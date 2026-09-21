import { redirect } from "next/navigation";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import Link from "next/link";

async function isSuper(userId: string) {
  const service = createServiceSupabase();
  const { data } = await service.from("platform_roles").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

export default async function Shell({ children }: { children: React.ReactNode }) {
  const sb = await createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !(await isSuper(user.id))) redirect("/login");
  const items = [
    { href: "/", label: "Event" },
    { href: "/templates", label: "Template" },
    { href: "/financials", label: "Keuangan" },
    { href: "/users", label: "Pengguna" },
  ];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-[1100px] px-4 h-14 flex items-center gap-5">
          <span className="font-black text-sm">LKBB <span className="text-amber-400">SUPER</span></span>
          <nav className="flex gap-4 text-sm">
            {items.map((i) => (
              <Link key={i.href} href={i.href} className="text-white/70 hover:text-white">{i.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-6">{children}</main>
    </div>
  );
}
