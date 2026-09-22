"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const rp = (n: number) => "Rp" + Number(n || 0).toLocaleString("id-ID");

export default function FinancialsPage() {
  const [data, setData] = useState<any>(null);
  const load = async () => {
    const res = await fetch("/api/financials");
    if (res.ok) setData(await res.json());
  };
  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (!data) return <p className="text-sm text-white/60">Memuat...</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">Keuangan Semua Event <span className="text-xs font-normal text-white/50">(auto-refresh 15 dtk • {data.at ? new Date(data.at).toLocaleTimeString("id-ID") : ""})</span></h1>
      <div className="grid sm:grid-cols-3 gap-2">
        {[
          ["Total Transaksi", data.totals.total_transactions, ""],
          ["Total Revenue", rp(data.totals.total_revenue), ""],
          ["Terverifikasi", rp(data.totals.verified_revenue), "text-emerald-400"],
          ["Pending", rp(data.totals.pending_revenue), "text-amber-400"],
          ["Pembayar Unik", data.totals.unique_payers, ""],
        ].map(([l, v, c]: any) => (
          <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-[11px] text-white/50">{l}</div>
            <div className={`text-lg font-black tabular-nums ${c}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        {data.events.map((e: any) => (
          <Link key={e.event_id} href={`/financials/${e.event_id}`} className="block rounded-xl border border-white/10 bg-white/5 p-4 text-sm hover:border-white/25">
            <div className="font-bold">{e.name} <span className="text-white/50">/{e.slug} • {e.status}</span></div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>Transaksi<br /><b className="tabular-nums">{e.total_transactions}</b></div>
              <div>Revenue<br /><b className="tabular-nums">{rp(e.total_revenue)}</b></div>
              <div>Terverifikasi<br /><b className="tabular-nums text-emerald-400">{rp(e.verified_revenue)}</b></div>
              <div>Pending<br /><b className="tabular-nums text-amber-400">{rp(e.pending_revenue)}</b></div>
            </div>
            <div className="mt-1 text-[11px] text-white/40">Klik untuk riwayat + invoice →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
