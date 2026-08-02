"use client";

import * as React from "react";
import { localProgressAdapter, ProgressAdapter } from "@/lib/progress";

interface UseProgressResult {
  completedIds: Set<string>;
  /** True until the initial load from storage has resolved (avoids a 0-count flash). */
  isLoaded: boolean;
  /** Merges newly-completed ids into the existing set and persists the result. */
  markCompleted: (ids: Set<string>) => void;
  /** Clears all saved progress, in storage and in memory. */
  resetProgress: () => void;
}

export function useProgress(adapter: ProgressAdapter = localProgressAdapter): UseProgressResult {
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setCompletedIds(new Set(adapter.load()));
    setIsLoaded(true);
    // Adapter is expected to be a stable reference (module-level singleton by default).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markCompleted = React.useCallback(
    (ids: Set<string>) => {
      setCompletedIds((prev) => {
        const merged = new Set(prev);
        ids.forEach((id) => merged.add(id));
        adapter.save(Array.from(merged));
        return merged;
      });
    },
    [adapter]
  );

  const resetProgress = React.useCallback(() => {
    adapter.clear();
    setCompletedIds(new Set());
  }, [adapter]);

  return { completedIds, isLoaded, markCompleted, resetProgress };
}
