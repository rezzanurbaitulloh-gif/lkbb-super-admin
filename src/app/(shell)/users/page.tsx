"use client";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ email: "", event_id: "", role: "ADMIN" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const j = await res.json();
      setUsers(j.users || []); setMembers(j.members || []); setEvents(j.events || []);
      if (!form.event_id && j.events?.length) setForm((f) => ({ ...f, event_id: j.events[0].id }));
    }
  };
  useEffect(() => { load(); }, []);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await res.json().catch(() => ({}));
    setMsg(res.ok ? "OK: admin event ditetapkan." : "Gagal: " + ((j as any).error || res.status));
  };

  const remove = async (id: string) => {
    if (!confirm("Cabut admin event ini?")) return;
    await fetch(`/api/users?membership_id=${id}`, { method: "DELETE" });
    load();
  };

  const evName = (id: string) => events.find((e: any) => e.id === id)?.slug || id.slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">Pengguna & Admin Event</h1>
      <form onSubmit={assign} className="rounded-2xl border border-white/10 bg-white/5 p-4 grid gap-2 sm:grid-cols-4">
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email pengguna" required className="h-10 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} className="h-10 rounded-xl border border-white/10 bg-black px-3 text-sm">
          {events.map((e: any) => <option key={e.id} value={e.id}>{e.slug} — {e.name}</option>)}
        </select>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-10 rounded-xl border border-white/10 bg-black px-3 text-sm">
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>
        <button className="h-10 rounded-full bg-white text-black text-sm font-bold">Tetapkan</button>
      </form>
      {msg && <p className="text-xs text-white/70">{msg}</p>}
      <div className="grid gap-2">
        {members.map((m: any) => (
          <div key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold truncate">{m.user_id.slice(0, 8)}… • {m.role}</div>
              <div className="text-xs text-white/60">event: {evName(m.event_id)} • {m.status}</div>
            </div>
            <button onClick={() => remove(m.id)} className="text-xs text-red-400 underline shrink-0">Cabut</button>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/50">Catatan: akun SUPER_ADMIN tidak bisa diubah/dicabut dari sini (proteksi DB + API).</p>
    </div>
  );
}
