"use client";
import { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState({ slug: "", name: "", organizer_name: "", event_date: "", status: "DRAFT", template_id: "", domain_mode: "myid" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const [er, tr] = await Promise.all([fetch("/api/events"), fetch("/api/templates")]);
    if (er.ok) setEvents(await er.json().catch(() => []));
    if (tr.ok) setTemplates(await tr.json().catch(() => []));
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    const res = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, template_id: form.template_id || undefined }) });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setMsg("Gagal: " + (j.error || res.status)); return; }
    setMsg(`OK: ${j.slug} → ${j.provisioning?.domain?.domain} (template: ${j.provisioning?.template}, vercel: ${j.provisioning?.domain?.vercel})`);
    setForm({ slug: "", name: "", organizer_name: "", event_date: "", status: "DRAFT", template_id: "", domain_mode: "myid" });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">Kelola Event (Sewa)</h1>
      <form onSubmit={create} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid gap-2 sm:grid-cols-2">
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug (mis. paskibra1)" required className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama event" required className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })} placeholder="Penyelenggara" className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <input value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} type="date" className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className="h-10 rounded-xl border border-white/10 bg-black px-3 text-sm">
          <option value="">— Tanpa template —</option>
          {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={form.domain_mode} onChange={(e) => setForm({ ...form, domain_mode: e.target.value })} className="h-10 rounded-xl border border-white/10 bg-black px-3 text-sm">
          <option value="myid">*.lkbb.my.id (production)</option>
          <option value="vercel">*.lkbb.vercel.app (dev)</option>
        </select>
        <button disabled={saving} className="sm:col-span-2 h-11 rounded-full bg-white text-black text-sm font-bold disabled:opacity-50">
          {saving ? "Memproses..." : "Buat Event + Provisioning"}
        </button>
        {msg && <p className="sm:col-span-2 text-xs text-white/70">{msg}</p>}
      </form>
      <div className="grid gap-2">
        {events.map((e: any) => (
          <div key={e.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <div className="font-bold">{e.name} <span className="text-white/50">/{e.slug} • {e.status}</span></div>
            <div className="text-xs text-white/60">{(e.event_domains || []).map((d: any) => d.domain).join(", ")}</div>
            <a className="text-xs underline" target="_blank" rel="noreferrer" href={`https://${(e.event_domains || [])[0]?.domain || e.slug + ".lkbb.my.id"}/admin`}>Buka admin web →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
