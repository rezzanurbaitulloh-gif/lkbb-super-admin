import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSuperAdmin } from "./auth";

export async function requireSuperAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  if (!(await isSuperAdmin(user.id))) return { ok: false as const, status: 403 };
  return { ok: true as const, user };
}
