// Storage adapter for challenge progress.
//
// Kept deliberately narrow (load/save of a string id list) so the backing
// store can change later — e.g. swapped for a Supabase-synced adapter once
// auth exists — without touching any component or the hook that uses it.

const STORAGE_KEY = "d-shell:progress:v1";

export interface ProgressAdapter {
  load(): string[];
  save(ids: string[]): void;
  clear(): void;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const localProgressAdapter: ProgressAdapter = {
  load() {
    if (!isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string");
    } catch {
      // Corrupt or unreadable — treat as no saved progress rather than throwing.
      return [];
    }
  },

  save(ids) {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage full or disabled (e.g. private browsing) — fail silently.
      // Progress simply won't persist for this session.
    }
  },

  clear() {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  },
};
