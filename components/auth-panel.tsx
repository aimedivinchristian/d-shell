"use client";

import * as React from "react";
import { Mail, LogOut, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.2.66.79.55A10.51 10.51 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

interface AuthPanelProps {
  user: User | null;
  isAvailable: boolean;
  onSignInMagicLink: (email: string) => Promise<{ error: string | null }>;
  onSignInGitHub: () => Promise<{ error: string | null }>;
  onSignOut: () => void;
  onClose: () => void;
}

export function AuthPanel({
  user,
  isAvailable,
  onSignInMagicLink,
  onSignInGitHub,
  onSignOut,
  onClose,
}: AuthPanelProps) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await onSignInMagicLink(email.trim());
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function handleGitHub() {
    setStatus("sending");
    const { error } = await onSignInGitHub();
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    }
    // On success, the browser redirects away — no further state needed here.
  }

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-medium">
          {user ? "Synced account" : "Sync your progress"}
        </h3>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <X size={16} />
        </button>
      </div>

      {!isAvailable ? (
        <p className="text-[13px] leading-relaxed text-muted">
          Sync isn&apos;t configured for this deployment — progress stays saved on this browser only.
        </p>
      ) : user ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Signed in as <span className="text-foreground">{user.email ?? "your account"}</span>. Your
            progress and sandbox sync automatically across devices.
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 rounded-md border border-border py-2 text-[13px] text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      ) : status === "sent" ? (
        <p className="text-[13px] leading-relaxed text-accent">
          Check your inbox — we sent a sign-in link to {email}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Sign in to save your progress and sandbox across devices.
          </p>

          <button
            type="button"
            onClick={handleGitHub}
            disabled={status === "sending"}
            className="flex items-center justify-center gap-2 rounded-md border border-border py-2 text-[13px] text-foreground transition-colors hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GitHubMark size={15} />
            Continue with GitHub
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 focus-within:border-accent">
              <Mail size={14} className="text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-md bg-accent py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>

          {status === "error" && errorMsg && (
            <p className="text-[12px] text-red-400">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
