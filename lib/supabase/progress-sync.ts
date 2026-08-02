import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface CloudProgressResult {
  ids: string[] | null;
  error: string | null;
}

/** Fetches the signed-in user's saved progress from Supabase. Null ids means no row exists yet. */
export async function fetchCloudProgress(
  userId: string,
  supabase: SupabaseClient | null = getSupabaseClient()
): Promise<CloudProgressResult> {
  if (!supabase) return { ids: null, error: "Sync not configured" };

  const { data, error } = await supabase
    .from("progress")
    .select("completed_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ids: null, error: error.message };
  return { ids: data?.completed_ids ?? null, error: null };
}

/** Upserts the full completed-ids list for the signed-in user. */
export async function pushCloudProgress(
  userId: string,
  ids: string[],
  supabase: SupabaseClient | null = getSupabaseClient()
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Sync not configured" };

  const { error } = await supabase
    .from("progress")
    .upsert({ user_id: userId, completed_ids: ids }, { onConflict: "user_id" });

  return { error: error?.message ?? null };
}

/**
 * Merges local (pre-sign-in) progress with whatever's already saved in the
 * cloud for this user, and pushes the union back. Called once right after
 * sign-in so progress made anonymously isn't lost when a user logs in on a
 * device that already has cloud progress from elsewhere.
 */
export async function reconcileProgressOnSignIn(
  userId: string,
  localIds: string[],
  supabase: SupabaseClient | null = getSupabaseClient()
): Promise<CloudProgressResult> {
  const { ids: cloudIds, error: fetchError } = await fetchCloudProgress(userId, supabase);
  if (fetchError) return { ids: null, error: fetchError };

  const merged = Array.from(new Set([...(cloudIds ?? []), ...localIds]));
  const { error: pushError } = await pushCloudProgress(userId, merged, supabase);
  if (pushError) return { ids: null, error: pushError };

  return { ids: merged, error: null };
}
