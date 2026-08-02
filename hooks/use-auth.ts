"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

/** Maps common raw Supabase auth error messages to friendlier text. Unknown
 *  errors pass through unchanged rather than being hidden — better to show
 *  something slightly technical than to swallow information the user needs. */
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit")) {
    return "Too many attempts — wait a minute and try again.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Couldn't reach the sign-in service. Check your connection and try again.";
  }
  if (lower.includes("expired") || (lower.includes("link") && lower.includes("invalid"))) {
    return "That sign-in link has expired or was already used — request a new one.";
  }
  if (lower.includes("invalid") && lower.includes("email") && !lower.includes("link")) {
    return "That doesn't look like a valid email address.";
  }
  return message;
}

interface UseAuthResult {
  user: User | null;
  /** True until the initial auth check has resolved. */
  isLoaded: boolean;
  /** Whether Supabase is configured at all — false means the app runs local-only. */
  isAvailable: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGitHub: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const supabase = getSupabaseClient();
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) {
      setIsLoaded(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoaded(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const signInWithMagicLink = React.useCallback(
    async (email: string) => {
      if (!supabase) return { error: "Sync isn't configured for this deployment." };
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      return { error: error ? friendlyAuthError(error.message) : null };
    },
    [supabase]
  );

  const signInWithGitHub = React.useCallback(async () => {
    if (!supabase) return { error: "Sync isn't configured for this deployment." };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  return {
    user,
    isLoaded,
    isAvailable: !!supabase,
    signInWithMagicLink,
    signInWithGitHub,
    signOut,
  };
}
