"use client";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" });
  const [applySel, setApplySel] = useState<Record<string, string>>({});
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

  const apply = async (templateId: string) => {
    const eventId = applySel[templateId];
    if (!eventId) { setMsg("Pilih event dulu."); return; }
    setMsg("Menerapkan...");
    const res = await fetch("/api/templates/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: eventId, template_id: templateId }) });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? `OK diterapkan ke ${(j as any).event_id || eventId}` : "Gagal: " + ((j as any).error || res.status));
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
      <div className="grid gap-2">
        {templates.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm space-y-2">
            <div className="font-bold">{t.name} <span className="text-white/50">• {t.category} • {t.layout_variant}/{t.hero_variant} • {t.is_active ? "aktif" : "nonaktif"}</span></div>
            <div className="flex gap-2">
              <select value={applySel[t.id] || ""} onChange={(e) => setApplySel({ ...applySel, [t.id]: e.target.value })} className="h-9 flex-1 rounded-xl border border-white/10 bg-black px-2 text-xs">
                <option value="">— Pilih event —</option>
                {events.map((e: any) => <option key={e.id} value={e.id}>{e.slug} — {e.name}</option>)}
              </select>
              <button onClick={() => apply(t.id)} className="h-9 px-4 rounded-full bg-white text-black text-xs font-bold">Terapkan 1 Klik</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
