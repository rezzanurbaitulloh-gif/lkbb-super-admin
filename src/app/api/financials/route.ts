import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";
import { requireSuperAdmin } from "@/lib/guard";

// GET /api/financials — kartu per event terpisah (realtime) + total global. Super saja.
export async function GET(req: Request) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return NextResponse.json({ error: "SUPER_ADMIN required" }, { status: auth.status });
  const service = createServiceSupabase();
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("event_id");
  const { data: events } = await service.from("events").select("id,slug,name,status,event_date").order("created_at", { ascending: true });
  const list = ((events || []) as any[]).filter((e) => !eventId || e.id === eventId);

  let useView = false;
  try {
    const probe = await service.from("financial_aggregates").select("event_id").limit(1);
    useView = !probe.error;
  } catch {}

  const cards: any[] = [];
  for (const ev of list) {
    let row: any = null;
    if (useView) {
      const { data } = await service.from("financial_aggregates").select("*").eq("event_id", ev.id).maybeSingle();
      if (data) {
        const d: any = data;
        row = {
          event_id: ev.id, slug: ev.slug, name: ev.name, status: ev.status, event_date: ev.event_date,
          total_transactions: Number(d.total_transactions || 0),
          total_revenue: Number(d.total_revenue || 0),
          verified_revenue: Number(d.verified_revenue || 0),
          pending_revenue: Number(d.pending_revenue || 0),
          unique_payers: Number(d.unique_payers || 0),
          last_transaction_at: d.last_transaction_at || null,
          source: "view",
        };
      }
    }
    if (!row) {
      const { data: txs } = await service.from("transactions").select("amount,status,user_id,created_at").eq("event_id", ev.id);
      const arr = (txs || []) as any[];
      row = {
        event_id: ev.id, slug: ev.slug, name: ev.name, status: ev.status, event_date: ev.event_date,
        total_transactions: arr.length,
        total_revenue: arr.reduce((s, t) => s + Number(t.amount || 0), 0),
        verified_revenue: arr.filter((t) => t.status === "Success" || t.status === "PAID").reduce((s, t) => s + Number(t.amount || 0), 0),
        pending_revenue: arr.filter((t) => t.status === "Pending").reduce((s, t) => s + Number(t.amount || 0), 0),
        unique_payers: new Set(arr.map((t) => t.user_id)).size,
        last_transaction_at: arr.reduce((m: string | null, t: any) => (!m || t.created_at > m ? t.created_at : m), null),
        source: "live",
      };
    }
    cards.push(row);
  }
  const totals = cards.reduce((acc: any, c: any) => ({
    total_transactions: acc.total_transactions + c.total_transactions,
    total_revenue: acc.total_revenue + c.total_revenue,
    verified_revenue: acc.verified_revenue + c.verified_revenue,
    pending_revenue: acc.pending_revenue + c.pending_revenue,
    unique_payers: acc.unique_payers + c.unique_payers,
  }), { total_transactions: 0, total_revenue: 0, verified_revenue: 0, pending_revenue: 0, unique_payers: 0 });

  return NextResponse.json({ totals, events: cards, at: new Date().toISOString() });
}
