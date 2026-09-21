import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

async function provisionVercelDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME;
  if (!token || !project) return { ok: false, error: "VERCEL_TOKEN/VERCEL_PROJECT_ID belum di-set" };
  const res = await fetch(`https://api.vercel.com/v10/projects/${project}/domains`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return { ok: false, error: (j as any)?.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const service = createServiceSupabase();
  const { data, error } = await service
    .from("events")
    .select("*, event_domains(domain, subdomain, is_primary, ssl_status)")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  const { slug, name, organizer_name, description, event_date, status, template_id, domain_mode } = body;
  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 });
  const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleanSlug)) {
    return NextResponse.json({ error: "slug tidak valid" }, { status: 400 });
  }
  const service = createServiceSupabase();
  const { data: existing } = await service.from("events").select("id").eq("slug", cleanSlug).maybeSingle();
  if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

  const { data, error } = await service.from("events").insert({
    slug: cleanSlug, name,
    organizer_name: organizer_name || "PASKIBRA",
    description: description || "",
    event_date: event_date || null,
    status: status || "DRAFT",
    settings: {},
    template_id: template_id || null,
  } as any).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const eventId = (data as any).id as string;

  const useCustom = (domain_mode || "myid") === "myid";
  const domain = useCustom ? `${cleanSlug}.lkbb.my.id` : `${cleanSlug}.lkbb.vercel.app`;
  const domainState: any = { domain, ssl: "pending", vercel: "skipped" };
  try {
    await service.from("event_domains").insert({
      event_id: eventId, domain, subdomain: cleanSlug,
      is_primary: true, is_verified: false, ssl_status: "pending",
    } as any);
  } catch {}
  try {
    const v = await provisionVercelDomain(domain);
    domainState.vercel = v.ok ? "added" : `gagal: ${v.error}`;
    domainState.ssl = v.ok ? "pending" : "pending";
    if (v.ok) {
      await service.from("event_domains").update({ is_verified: true, ssl_status: "active" } as any).eq("event_id", eventId).eq("domain", domain);
      domainState.ssl = "active";
    }
  } catch (e: any) {
    domainState.vercel = `gagal: ${e?.message || e}`;
  }

  try {
    await service.from("competitions").insert({ name, tagline: description, state: status || "DRAFT", event_id: eventId, settings: {} } as any);
  } catch {}

  let templateState = "skipped";
  if (template_id) {
    try {
      const { data: tpl } = await service.from("event_templates").select("*").eq("id", template_id).maybeSingle();
      if (tpl) {
        const t: any = tpl;
        await service.from("events").update({
          template_config: {
            themeTokens: t.theme_tokens || {},
            layoutVariant: t.layout_variant,
            heroVariant: t.hero_variant,
            componentRegistry: t.component_registry || {},
          },
          component_registry: t.component_registry || {},
          branding: t.branding_assets || {},
          settings: t.default_settings || {},
          updated_at: new Date().toISOString(),
        } as any).eq("id", eventId);
        try {
          await service.from("competitions").update({ settings: t.default_settings || {} } as any).eq("event_id", eventId);
        } catch {}
        templateState = "applied";
      } else templateState = "template tidak ditemukan";
    } catch (e: any) {
      templateState = `gagal: ${e?.message || e}`;
    }
  }

  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_create", target: eventId, details: { ...body, domain }, event_id: eventId } as any);
  return NextResponse.json({ ...(data as object), provisioning: { domain: domainState, template: templateState } });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  const { id, slug, name, organizer_name, description, event_date, status, settings } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const service = createServiceSupabase();
  const updates: any = { updated_at: new Date().toISOString() };
  if (slug) updates.slug = slug;
  if (name) updates.name = name;
  if (organizer_name !== undefined) updates.organizer_name = organizer_name;
  if (description !== undefined) updates.description = description;
  if (event_date !== undefined) updates.event_date = event_date;
  if (status) updates.status = status;
  if (settings) updates.settings = settings;
  const { data, error } = await service.from("events").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_update", target: id, details: updates, event_id: id } as any);
  return NextResponse.json(data);
}
