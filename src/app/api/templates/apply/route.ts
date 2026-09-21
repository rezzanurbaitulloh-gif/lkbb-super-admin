import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

function merge(base: Record<string, any>, over: Record<string, any>) {
  return { ...(base || {}), ...(over || {}) };
}

// POST /api/templates/apply { event_id, template_id, overrides? } — 1 klik penuh
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  const { event_id, template_id, overrides } = body;
  if (!event_id || !template_id) return NextResponse.json({ error: "event_id & template_id required" }, { status: 400 });
  const service = createServiceSupabase();
  const { data: tpl, error: tplErr } = await service.from("event_templates").select("*").eq("id", template_id).maybeSingle();
  if (tplErr || !tpl) return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
  const t: any = tpl;
  if (t.is_active === false) return NextResponse.json({ error: "Template nonaktif" }, { status: 400 });

  const { error: evErr } = await service.from("events").update({
    template_id,
    template_config: {
      themeTokens: merge(t.theme_tokens, overrides?.theme_tokens),
      layoutVariant: overrides?.layout_variant || t.layout_variant,
      heroVariant: overrides?.hero_variant || t.hero_variant,
      componentRegistry: merge(t.component_registry, overrides?.component_registry),
    },
    component_registry: merge(t.component_registry, overrides?.component_registry),
    branding: merge(t.branding_assets, overrides?.branding_assets),
    settings: merge(t.default_settings, overrides?.default_settings),
    updated_at: new Date().toISOString(),
  } as any).eq("id", event_id);
  if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
  try {
    await service.from("competitions").update({ settings: merge(t.default_settings, overrides?.default_settings) } as any).eq("event_id", event_id);
  } catch {}
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "template_apply", target: event_id, details: { template_id }, event_id } as any);
  return NextResponse.json({ ok: true });
}
