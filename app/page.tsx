"use client";

import * as React from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { RotateCcw, Keyboard } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Terminal } from "@/components/terminal";
import { ChallengeGrid } from "@/components/challenge-grid";
import { SplashScreen } from "@/components/splash-screen";
import { AuthPanel } from "@/components/auth-panel";
import { challenges, getCompletedChallengeIds } from "@/lib/challenges";
import { ShellState } from "@/lib/shell/commands";
import { useProgress } from "@/hooks/use-progress";
import { useSync } from "@/hooks/use-sync";

export default function Home() {
  const { completedIds, isLoaded, markCompleted, resetProgress } = useProgress();
  const sync = useSync();
  const [showAuthPanel, setShowAuthPanel] = React.useState(false);

  const handleStateChange = React.useCallback(
    (state: ShellState) => {
      const newlyTrue = getCompletedChallengeIds(state);
      const freshlyCompleted = Array.from(newlyTrue).filter((id) => !completedIds.has(id));
      freshlyCompleted.forEach((id) => track("challenge_completed", { challenge: id }));
      if (freshlyCompleted.length > 0 && completedIds.size + freshlyCompleted.length === challenges.length) {
        track("all_challenges_completed");
      }
      const merged = new Set(completedIds);
      newlyTrue.forEach((id) => merged.add(id));
      markCompleted(newlyTrue);
      sync.onProgressChange(Array.from(merged));
    },
    [markCompleted, completedIds, sync]
  );

  React.useEffect(() => {
    if (!showAuthPanel) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowAuthPanel(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showAuthPanel]);

  const completedCount = completedIds.size;
  const allComplete = isLoaded && completedCount === challenges.length;

  // Terminal is ready to mount once local progress has loaded AND, if
  // signed in, once the cloud reconcile/restore pass has finished — so a
  // restored filesystem is available before the terminal's first render.
  const terminalReady = isLoaded && sync.isAuthLoaded && !sync.isReconciling;
  const appReady = terminalReady;

  return (
    <div className="flex min-h-screen flex-col">
      <SplashScreen ready={appReady} />
      <SiteHeader user={sync.user} onAccountClick={() => setShowAuthPanel((v) => !v)} />

      {showAuthPanel && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sync.user ? "Account" : "Sign in"}
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 px-5 pt-24"
          onClick={() => setShowAuthPanel(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AuthPanel
              user={sync.user}
              isAvailable={sync.isAvailable}
              onSignInMagicLink={sync.signInWithMagicLink}
              onSignInGitHub={sync.signInWithGitHub}
              onSignInGoogle={sync.signInWithGoogle}
              onSignUpWithPassword={sync.signUpWithPassword}
              onSignInWithPassword={sync.signInWithPassword}
              onSignOut={() => {
                sync.signOut();
                setShowAuthPanel(false);
              }}
              onClose={() => setShowAuthPanel(false)}
            />
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-5 py-12 sm:px-8 sm:py-16">
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
              Learn Linux by using it.
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed text-muted">
              A real shell, running in your browser. No install, no account,
              no server on the other end — just a filesystem and a prompt.
            </p>
          </div>
          {terminalReady ? (
            <Terminal
              onStateChange={handleStateChange}
              onFilesystemChange={sync.onFilesystemChange}
              skipIntro={completedCount > 0 || !!sync.restoredFilesystem}
              initialFilesystem={sync.restoredFilesystem ?? undefined}
            />
          ) : (
            <div
              className="h-[calc(min(380px,55dvh)+41px)] w-full animate-pulse rounded-lg border border-border bg-surface sm:h-[421px]"
              aria-hidden
            />
          )}

          <Link
            href="/type"
            className="flex w-fit items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            <Keyboard size={13} />
            practice typing shell commands →
          </Link>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-medium">Challenges</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">
                {isLoaded ? `${completedCount}/${challenges.length} complete` : "…"} · play in any order
              </span>
              {isLoaded && completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetProgress}
                  className="flex items-center gap-1 font-mono text-xs text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <RotateCcw size={11} />
                  reset
                </button>
              )}
            </div>
          </div>
          <ChallengeGrid completedIds={completedIds} />

          {allComplete && (
            <div className="rounded-lg border border-accent/40 bg-accent/[0.04] px-5 py-4 font-mono text-[13px] leading-relaxed sm:text-sm">
              <p className="text-accent">$ echo $STATUS</p>
              <p className="mt-1 text-foreground">
                All challenges complete. You know your way around a real shell now.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 sm:px-8">
        <p className="font-mono text-xs text-muted">D&gt;shell — a Space D project</p>
      </footer>
    </div>
  );
}
