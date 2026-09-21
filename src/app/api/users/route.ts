import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

// GET /api/users — daftar pengguna + keanggotaan event. Super saja.
export async function GET() {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const service = createServiceSupabase();
  const { data: profiles } = await service.from("profiles").select("id,email,role,created_at").order("created_at", { ascending: false }).limit(200);
  const { data: members } = await service.from("event_members").select("user_id,event_id,role,status");
  const { data: events } = await service.from("events").select("id,slug,name");
  return NextResponse.json({ users: profiles || [], members: members || [], events: events || [] });
}

// POST /api/users { user_id|email, event_id, role } — jadikan admin event. Super saja.
// Proteksi: target yang SUPER_ADMIN tidak bisa diubah.
export async function POST(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const body = await req.json();
  const { user_id, email, event_id, role } = body;
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });
  const service = createServiceSupabase();
  let targetId = user_id;
  if (!targetId && email) {
    const { data: prof } = await service.from("profiles").select("id").ilike("email", String(email).trim()).maybeSingle();
    if (!prof) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    targetId = (prof as any).id;
  }
  if (!targetId) return NextResponse.json({ error: "user_id/email required" }, { status: 400 });
  const { data: isSuper } = await service.from("platform_roles").select("user_id").eq("user_id", targetId).maybeSingle();
  if (isSuper) return NextResponse.json({ error: "Akun SUPER_ADMIN tidak bisa diubah" }, { status: 403 });
  const { data, error } = await service.from("event_members").upsert({
    event_id, user_id: targetId, role: role === "ADMIN" ? "ADMIN" : "USER", status: "active",
  }, { onConflict: "event_id,user_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_admin_assign", target: targetId, details: { event_id, role }, event_id } as any);
  return NextResponse.json(data);
}

// DELETE /api/users?membership_id= — cabut admin event. Super saja (tidak untuk super admin; mereka tak punya membership).
export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("membership_id");
  if (!id) return NextResponse.json({ error: "membership_id required" }, { status: 400 });
  const service = createServiceSupabase();
  const { data: row } = await service.from("event_members").select("id,event_id,user_id").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  const { error } = await service.from("event_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await service.from("audit_logs").insert({ user_id: auth.user.id, action: "event_admin_remove", target: (row as any).user_id, details: { event_id: (row as any).event_id }, event_id: (row as any).event_id } as any);
  return NextResponse.json({ ok: true });
}
