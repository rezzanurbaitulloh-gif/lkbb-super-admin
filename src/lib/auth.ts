import { createServiceSupabase } from "./supabase-server";

export async function isSuperAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const service = createServiceSupabase();
  const { data } = await service.from("platform_roles").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
