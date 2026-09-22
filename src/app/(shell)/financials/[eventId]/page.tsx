"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const rp = (n: number) => "Rp" + Number(n || 0).toLocaleString("id-ID");

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="h-9 rounded-xl border border-white/10 bg-transparent px-3 text-xs w-full text-left truncate">
        {label}: {selected.length ? selected.join(", ") : "Semua"}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-48 rounded-xl border border-white/10 bg-[#141416] p-2 space-y-1 shadow-xl">
          {options.length === 0 && <div className="text-xs text-white/50 px-2 py-1">Tidak ada opsi</div>}
          {options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              <span className="truncate">{o}</span>
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => onChange([])} className="text-[11px] underline text-white/60">Reset</button>
            <button type="button" onClick={() => setOpen(false)} className="text-[11px] underline">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventTransactionsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState<any>({ status: [], provider: [], method: [], source: [] });
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fProvider, setFProvider] = useState<string[]>([]);
  const [fMethod, setFMethod] = useState<string[]>([]);
  const [fSource, setFSource] = useState<string[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [evName, setEvName] = useState("");

  const load = async () => {
    const qs = new URLSearchParams({ event_id: eventId, limit: "100" });
    if (search.trim()) qs.set("search", search.trim());
    if (fStatus.length) qs.set("status", fStatus.join(","));
    if (fProvider.length) qs.set("provider", fProvider.join(","));
    if (fMethod.length) qs.set("method", fMethod.join(","));
    if (fSource.length) qs.set("source", fSource.join(","));
    const res = await fetch(`/api/transactions?${qs.toString()}`);
    if (!res.ok) return;
    const j = await res.json();
    setRows(j.rows || []); setTotal(j.total || 0); setOptions(j.options || options);
  };
  useEffect(() => { load(); }, [eventId]);
  useEffect(() => {
    fetch("/api/events").then((r) => r.json()).then((evs) => {
      const ev = (evs || []).find((e: any) => e.id === eventId);
      if (ev) setEvName(`${ev.slug} — ${ev.name}`);
    }).catch(() => {});
  }, [eventId]);

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/transactions?event_id=${eventId}&id=${id}&limit=1`);
    if (!res.ok) return;
    const j = await res.json();
    setDetail({ row: (j.rows || [])[0] || null, user: (j.users || {})[(j.rows || [])[0]?.user_id] || null });
  };

  return (
    <div className="space-y-4">
      <div>
        <Link href="/financials" className="text-xs text-white/60 hover:text-white">← Keuangan</Link>
        <h1 className="text-xl font-black mt-1">Riwayat Transaksi</h1>
        <p className="text-xs text-white/60">{evName || eventId}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Cari ID / external / ref…" className="h-9 rounded-xl border border-white/10 bg-transparent px-3 text-xs lg:col-span-2" />
        <MultiSelect label="Status" options={options.status || []} selected={fStatus} onChange={setFStatus} />
        <MultiSelect label="Provider" options={options.provider || []} selected={fProvider} onChange={setFProvider} />
        <MultiSelect label="Metode" options={options.method || []} selected={fMethod} onChange={setFMethod} />
        <MultiSelect label="Sumber" options={options.source || []} selected={fSource} onChange={setFSource} />
      </div>
      <button onClick={load} className="h-9 px-5 rounded-full bg-white text-black text-xs font-bold">Terapkan Filter</button>

      <div className="text-xs text-white/60">{total} transaksi</div>
      <div className="grid gap-2">
        {rows.map((t: any) => (
          <button key={t.id} onClick={() => openDetail(t.id)} className="text-left rounded-xl border border-white/10 bg-white/5 p-3 text-sm hover:border-white/25">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs truncate">{t.external_transaction_id || t.id}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${t.status === "Success" ? "bg-emerald-500 text-black" : t.status === "Pending" ? "bg-amber-500 text-black" : "bg-white/10"}`}>{t.status}</span>
            </div>
            <div className="mt-1 text-xs text-white/60">{t.peletons?.name || "-"} • {t.supports} suara • {t.provider} • {t.method}</div>
            <div className="mt-0.5 text-sm font-black tabular-nums">{rp(t.amount)} <span className="text-[11px] font-normal text-white/50">{new Date(t.created_at).toLocaleString("id-ID")}</span></div>
          </button>
        ))}
        {rows.length === 0 && <div className="p-8 text-center text-sm text-white/50">Tidak ada transaksi.</div>}
      </div>

      {detail?.row && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#141416] p-5 space-y-2 text-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-black">Invoice</h2>
              <button onClick={() => setDetail(null)} className="text-xs text-white/60">Tutup ✕</button>
            </div>
            {[
              ["ID", detail.row.id],
              ["External ID", detail.row.external_transaction_id || "-"],
              ["Provider Ref", detail.row.provider_ref || "-"],
              ["Event", evName],
              ["Tim", detail.row.peletons ? `${detail.row.peletons.name} (${detail.row.peletons.school || ""})` : detail.row.peleton_id],
              ["Pembayar", detail.user?.email || detail.row.user_id],
              ["Jumlah Suara", `${detail.row.supports} suara`],
              ["Nominal", rp(detail.row.amount)],
              ["Metode", `${detail.row.provider} • ${detail.row.method} • ${detail.row.source || ""}`],
              ["Status", detail.row.status],
              ["Dibuat", new Date(detail.row.created_at).toLocaleString("id-ID")],
              ["Kedaluwarsa", detail.row.expires_at ? new Date(detail.row.expires_at).toLocaleString("id-ID") : "-"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between gap-3 text-xs">
                <span className="text-white/50 shrink-0">{l}</span>
                <span className="text-right break-all font-mono">{String(v ?? "-")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
