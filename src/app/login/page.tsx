"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const sb = createBrowserSupabase();
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      // Verifikasi SUPER_ADMIN via API (RLS: user bisa baca platform_role miliknya)
      const { data: { user } } = await sb.auth.getUser();
      const { data: plat } = await sb.from("platform_roles").select("user_id").eq("user_id", user!.id).maybeSingle();
      if (!plat) {
        await sb.auth.signOut();
        throw new Error("Akun ini bukan SUPER_ADMIN.");
      }
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-[380px] rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h1 className="text-xl font-black">LKBB Super Admin</h1>
        <p className="text-xs text-white/60">Khusus SUPER_ADMIN. Login di sini berlaku juga di semua web event (satu akun).</p>
        <div>
          <label className="text-xs font-bold">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold">Kata Sandi</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full h-11 rounded-xl border border-white/10 bg-transparent px-3 text-sm" />
        </div>
        {err && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">{err}</div>}
        <button disabled={loading} className="h-11 w-full rounded-full bg-white text-black text-sm font-bold disabled:opacity-50">
          {loading ? "Memeriksa..." : "Masuk →"}
        </button>
      </form>
    </main>
  );
}
