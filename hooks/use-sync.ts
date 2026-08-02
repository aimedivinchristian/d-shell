"use client";

import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { localProgressAdapter } from "@/lib/progress";
import { reconcileProgressOnSignIn, pushCloudProgress } from "@/lib/supabase/progress-sync";
import { fetchCloudSession, pushCloudSession } from "@/lib/supabase/session-sync";
import { DirNode } from "@/lib/shell/filesystem";

/** How long to wait after the last filesystem change before pushing to the
 *  cloud — avoids a network write on every single command. */
const SESSION_PUSH_DEBOUNCE_MS = 4000;

interface UseSyncResult {
  user: ReturnType<typeof useAuth>["user"];
  isAuthLoaded: boolean;
  isAvailable: boolean;
  /** True while reconciling local + cloud progress right after sign-in. */
  isReconciling: boolean;
  /** Filesystem restored from the cloud on sign-in, if any — apply this to a fresh ShellState. */
  restoredFilesystem: DirNode | null;
  signInWithMagicLink: ReturnType<typeof useAuth>["signInWithMagicLink"];
  signInWithGitHub: ReturnType<typeof useAuth>["signInWithGitHub"];
  signOut: () => Promise<void>;
  /** Call after progress changes locally — pushes to the cloud immediately if signed in. */
  onProgressChange: (ids: string[]) => void;
  /** Call on every shell state change — pushes to the cloud after a debounce if signed in. */
  onFilesystemChange: (fs: DirNode) => void;
}

export function useSync(): UseSyncResult {
  const auth = useAuth();
  const [isReconciling, setIsReconciling] = React.useState(false);
  const [restoredFilesystem, setRestoredFilesystem] = React.useState<DirNode | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconciledForUserId = React.useRef<string | null>(null);

  // On sign-in, reconcile local progress into the cloud once, and pull down
  // any saved session filesystem. Guarded so it only runs once per user id
  // per app load, not on every auth state tick.
  React.useEffect(() => {
    if (!auth.user || reconciledForUserId.current === auth.user.id) return;
    reconciledForUserId.current = auth.user.id;

    async function reconcile() {
      if (!auth.user) return;
      setIsReconciling(true);
      const localIds = localProgressAdapter.load();
      const { ids: mergedIds } = await reconcileProgressOnSignIn(auth.user.id, localIds);
      if (mergedIds) localProgressAdapter.save(mergedIds);

      const { filesystem } = await fetchCloudSession(auth.user.id);
      if (filesystem) setRestoredFilesystem(filesystem);

      setIsReconciling(false);
    }
    reconcile();
  }, [auth.user]);

  const onProgressChange = React.useCallback(
    (ids: string[]) => {
      if (!auth.user) return;
      pushCloudProgress(auth.user.id, ids);
    },
    [auth.user]
  );

  const onFilesystemChange = React.useCallback(
    (fs: DirNode) => {
      if (!auth.user) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const userId = auth.user.id;
      debounceRef.current = setTimeout(() => {
        pushCloudSession(userId, fs);
      }, SESSION_PUSH_DEBOUNCE_MS);
    },
    [auth.user]
  );

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const signOut = React.useCallback(async () => {
    reconciledForUserId.current = null;
    setRestoredFilesystem(null);
    await auth.signOut();
  }, [auth]);

  return {
    user: auth.user,
    isAuthLoaded: auth.isLoaded,
    isAvailable: auth.isAvailable,
    isReconciling,
    restoredFilesystem,
    signInWithMagicLink: auth.signInWithMagicLink,
    signInWithGitHub: auth.signInWithGitHub,
    signOut,
    onProgressChange,
    onFilesystemChange,
  };
}
