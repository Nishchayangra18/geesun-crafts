import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey);
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceKey);
}
