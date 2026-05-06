import { createClient } from "@supabase/supabase-js";
import { env, hasSupabasePublicConfig, hasSupabaseServiceConfig } from "@/lib/env";

export function getSupabasePublicClient() {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseServiceConfig()) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
