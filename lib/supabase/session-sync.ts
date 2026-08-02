import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DirNode } from "@/lib/shell/filesystem";

/** Bump this whenever the DirNode/FileNode shape changes in a way that could
 *  break loading an older saved snapshot. Mismatched versions are discarded
 *  rather than risking a corrupt filesystem being loaded into the shell. */
export const SESSION_SCHEMA_VERSION = 1;

export interface CloudSessionResult {
  filesystem: DirNode | null;
  error: string | null;
}

export async function fetchCloudSession(
  userId: string,
  supabase: SupabaseClient | null = getSupabaseClient()
): Promise<CloudSessionResult> {
  if (!supabase) return { filesystem: null, error: "Sync not configured" };

  const { data, error } = await supabase
    .from("sessions")
    .select("filesystem_json, schema_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { filesystem: null, error: error.message };
  if (!data) return { filesystem: null, error: null };

  if (data.schema_version !== SESSION_SCHEMA_VERSION) {
    // Saved under an older shape we no longer trust — treat as absent
    // rather than loading something that might not match current DirNode/
    // FileNode fields. The learner starts fresh; their challenge completion
    // (tracked separately) is unaffected.
    return { filesystem: null, error: null };
  }

  return { filesystem: data.filesystem_json as DirNode, error: null };
}

export async function pushCloudSession(
  userId: string,
  filesystem: DirNode,
  supabase: SupabaseClient | null = getSupabaseClient()
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Sync not configured" };

  const { error } = await supabase.from("sessions").upsert(
    {
      user_id: userId,
      filesystem_json: filesystem,
      schema_version: SESSION_SCHEMA_VERSION,
    },
    { onConflict: "user_id" }
  );

  return { error: error?.message ?? null };
}
