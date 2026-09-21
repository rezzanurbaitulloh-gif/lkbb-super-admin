import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const service = createServiceSupabase();
  const { data, error } = await service.from("event_templates").select("*").order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const service = createServiceSupabase();
  const { data, error } = await service.from("event_templates").insert({
    name: body.name,
    description: body.description || "",
    preview_image_url: body.preview_image_url || null,
    category: body.category || "generic",
    theme_tokens: body.theme_tokens || {},
    layout_variant: body.layout_variant || "default",
    hero_variant: body.hero_variant || "default",
    component_registry: body.component_registry || {},
    cms_sections: body.cms_sections || [],
    default_settings: body.default_settings || {},
    branding_assets: body.branding_assets || {},
    is_active: body.is_active !== false,
    is_premium: !!body.is_premium,
    created_by: auth.user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const allowed = ["name","description","preview_image_url","category","theme_tokens","layout_variant","hero_variant","component_registry","cms_sections","default_settings","branding_assets","is_active","is_premium"];
  const updates: any = { updated_at: new Date().toISOString() };
  for (const k of allowed) if (rest[k] !== undefined) updates[k] = rest[k];
  const service = createServiceSupabase();
  const { data, error } = await service.from("event_templates").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const service = createServiceSupabase();
  const { data: used } = await service.from("events").select("id").eq("template_id", id).limit(1);
  if (used && used.length > 0) return NextResponse.json({ error: "Template masih dipakai event" }, { status: 409 });
  const { error } = await service.from("event_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
