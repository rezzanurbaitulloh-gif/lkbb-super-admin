"use client";
import { useEffect, useState } from "react";
import { TemplatePreviewCard } from "@/components/TemplatePreviewCard";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" });
  const [preview, setPreview] = useState<any>(null);
  const [confirm, setConfirm] = useState<any>(null);
  const [confirmEvent, setConfirmEvent] = useState("");
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [tr, er] = await Promise.all([fetch("/api/templates"), fetch("/api/events")]);
    if (tr.ok) setTemplates(await tr.json().catch(() => []));
    if (er.ok) setEvents(await er.json().catch(() => []));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { setMsg("Gagal: " + ((await res.json().catch(() => ({}))) as any).error); return; }
    setForm({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" });
    load();
  };

  const doApply = async () => {
    if (!confirm || !confirmEvent) { setMsg("Pilih event dulu."); return; }
    setApplying(true);
    const res = await fetch("/api/templates/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: confirmEvent, template_id: confirm.id }) });
    const j = await res.json().catch(() => ({}));
    setApplying(false);
    if (!res.ok) { setMsg("Gagal: " + ((j as any).error || res.status)); return; }
    const evName = events.find((x: any) => x.id === confirmEvent)?.name || confirmEvent;
    setMsg(`OK: "${confirm.name}" diterapkan ke ${evName}.`);
    setConfirm(null);
  };

  const toggleActive = async (t: any) => {
    await fetch("/api/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, is_active: !t.is_active }) });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">Template UI/UX</h1>
      <form onSubmit={create} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid gap-2 sm:grid-cols-2">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama template" required className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <button className="sm:col-span-2 h-11 rounded-full bg-white text-black text-sm font-bold">+ Template</button>
      </form>
      {msg && <p className="text-xs text-white/70">{msg}</p>}
      {templates.length === 0 && <p className="text-sm text-white/50">Belum ada template.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t: any) => (
          <div key={t.id} className="space-y-2">
            <TemplatePreviewCard template={t} onApply={(tpl) => setPreview(tpl)} />
            <div className="flex gap-2">
              <button onClick={() => toggleActive(t)} className="h-9 flex-1 rounded-full border border-white/10 text-xs">
                {t.is_active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button onClick={() => setConfirm(t)} disabled={!t.is_active} className="h-9 flex-1 rounded-full bg-white text-black text-xs font-bold disabled:opacity-40">
                Terapkan…
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#141416] p-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-black mb-1">Pratinjau: {preview.name}</h2>
            <p className="text-xs text-white/60 mb-3">{preview.description} • {preview.category} • {preview.layout_variant}/{preview.hero_variant}</p>
            <TemplatePreviewCard template={preview} />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setPreview(null)} className="h-10 flex-1 rounded-full border border-white/15 text-sm">Tutup</button>
              <button onClick={() => { setPreview(null); setConfirm(preview); }} disabled={!preview.is_active} className="h-10 flex-1 rounded-full bg-white text-black text-sm font-bold disabled:opacity-40">Terapkan…</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#141416] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-black">Konfirmasi Penerapan</h2>
            <p className="text-xs text-white/70">
              Template <b>{confirm.name}</b> akan menimpa warna, layout, hero, dan pengaturan dasar event tujuan. Data tim/transaksi tidak tersentuh.
            </p>
            <select value={confirmEvent} onChange={(e) => setConfirmEvent(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-black px-3 text-sm">
              <option value="">— Pilih event —</option>
              {events.map((e: any) => <option key={e.id} value={e.id}>{e.slug} — {e.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="h-10 flex-1 rounded-full border border-white/15 text-sm">Batal</button>
              <button onClick={doApply} disabled={applying || !confirmEvent} className="h-10 flex-1 rounded-full bg-white text-black text-sm font-bold disabled:opacity-40">
                {applying ? "Menerapkan..." : "Ya, Terapkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
