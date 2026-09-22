import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

// GET /api/transactions?event_id=&status=a,b&provider=&method=&source=&search=&limit=&offset=&order=
// Super saja. Riwayat transaksi per event + gabungan peleton/user.
export async function GET(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const service = createServiceSupabase();
  const sp = new URL(req.url).searchParams;
  const eventId = sp.get("event_id");
  const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "50") || 50));
  const offset = Math.max(0, parseInt(sp.get("offset") || "0") || 0);
  const split = (v: string | null) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);

  let q: any = service
    .from("transactions")
    .select("*, peletons(name,school,category,number)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  const oneId = sp.get("id");
  if (oneId) q = q.eq("id", oneId);
  if (eventId) q = q.eq("event_id", eventId);
  const statuses = split(sp.get("status"));
  if (statuses.length) q = q.in("status", statuses);
  const providers = split(sp.get("provider"));
  if (providers.length) q = q.in("provider", providers);
  const methods = split(sp.get("method"));
  if (methods.length) q = q.in("method", methods);
  const sources = split(sp.get("source"));
  if (sources.length) q = q.in("source", sources);
  const search = (sp.get("search") || "").trim();
  if (search) q = q.or(`id.ilike.%${search}%,external_transaction_id.ilike.%${search}%,provider_ref.ilike.%${search}%`);

  const { data, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let userMap: Record<string, any> = {};
  if (oneId && data && (data as any[]).length) {
    const uid = (data as any[])[0].user_id;
    if (uid) {
      const { data: prof } = await service.from("profiles").select("id,email").eq("id", uid).maybeSingle();
      if (prof) userMap[uid] = prof;
    }
  }

  // Opsi filter: nilai unik per kolom dalam scope event (untuk multi-select)
  let optQ: any = service.from("transactions").select("status,provider,method,source").limit(2000);
  if (eventId) optQ = optQ.eq("event_id", eventId);
  const { data: optRows } = await optQ;
  const uniq = (k: string) => [...new Set(((optRows || []) as any[]).map((r) => r[k]).filter(Boolean))];
  const options = {
    status: uniq("status"),
    provider: uniq("provider"),
    method: uniq("method"),
    source: uniq("source"),
  };
  return NextResponse.json({ rows: data || [], total: count || 0, options, users: userMap });
}
