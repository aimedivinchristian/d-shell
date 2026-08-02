import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Returns a singleton Supabase browser client, or null if the required
 * env vars aren't set. Callers must handle the null case — the app is
 * designed to work fully anonymously/offline when Supabase isn't configured,
 * so a missing config is not an error, just "sync is unavailable."
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    client = null;
    return client;
  }

  client = createBrowserClient(url, anonKey);
  return client;
}
