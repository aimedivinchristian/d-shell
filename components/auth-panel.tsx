"use client";

import * as React from "react";
import { Mail, Lock, LogOut, X, Eye, EyeOff } from "lucide-react";
import type { User } from "@supabase/supabase-js";

function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.2.66.79.55A10.51 10.51 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function GoogleMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

type EmailMode = "magic-link" | "password";
type PasswordAction = "sign-in" | "sign-up";
type Status = "idle" | "sending" | "sent" | "error" | "confirm-email";

interface AuthPanelProps {
  user: User | null;
  isAvailable: boolean;
  onSignInMagicLink: (email: string) => Promise<{ error: string | null }>;
  onSignInGitHub: () => Promise<{ error: string | null }>;
  onSignInGoogle: () => Promise<{ error: string | null }>;
  onSignUpWithPassword: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  onSignInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignOut: () => void;
  onClose: () => void;
}

export function AuthPanel({
  user,
  isAvailable,
  onSignInMagicLink,
  onSignInGitHub,
  onSignInGoogle,
  onSignUpWithPassword,
  onSignInWithPassword,
  onSignOut,
  onClose,
}: AuthPanelProps) {
  const [emailMode, setEmailMode] = React.useState<EmailMode>("magic-link");
  const [passwordAction, setPasswordAction] = React.useState<PasswordAction>("sign-in");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function resetFeedback() {
    setStatus("idle");
    setErrorMsg(null);
  }

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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("sending");

    if (passwordAction === "sign-up") {
      const { error, needsConfirmation } = await onSignUpWithPassword(email.trim(), password);
      if (error) {
        setErrorMsg(error);
        setStatus("error");
      } else if (needsConfirmation) {
        setStatus("confirm-email");
      }
      // If no confirmation needed, the auth state listener picks up the new
      // session and the panel re-renders into the signed-in view on its own.
    } else {
      const { error } = await onSignInWithPassword(email.trim(), password);
      if (error) {
        setErrorMsg(error);
        setStatus("error");
      }
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setStatus("sending");
    const { error } = provider === "github" ? await onSignInGitHub() : await onSignInGoogle();
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    }
    // On success, the browser redirects away — no further state needed here.
  }

  const sending = status === "sending";

  return (
    <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-medium">
          {user ? "Synced account" : "Sign in"}
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
      ) : status === "confirm-email" ? (
        <p className="text-[13px] leading-relaxed text-accent">
          Almost there — check {email} for a confirmation link, then come back and sign in.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Sign in to save your progress and sandbox across devices.
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={sending}
              className="flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-[13px] text-foreground transition-colors hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <GitHubMark size={15} />
              Continue with GitHub
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={sending}
              className="flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-[13px] text-foreground transition-colors hover:border-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <GoogleMark size={15} />
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[11px] text-muted">or use email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex gap-1 rounded-md border border-border p-0.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => { setEmailMode("magic-link"); resetFeedback(); }}
              className={`flex-1 rounded py-1.5 transition-colors ${
                emailMode === "magic-link" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              magic link
            </button>
            <button
              type="button"
              onClick={() => { setEmailMode("password"); resetFeedback(); }}
              className={`flex-1 rounded py-1.5 transition-colors ${
                emailMode === "password" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              password
            </button>
          </div>

          {emailMode === "magic-link" ? (
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
                disabled={sending}
                className="rounded-md bg-accent py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {sending ? "Sending…" : "Send magic link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 focus-within:border-accent">
                  <Lock size={14} className="text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={passwordAction === "sign-up" ? "Create a password" : "Password"}
                    autoComplete={passwordAction === "sign-up" ? "new-password" : "current-password"}
                    className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="rounded-md bg-accent py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {sending
                  ? passwordAction === "sign-up" ? "Creating account…" : "Signing in…"
                  : passwordAction === "sign-up" ? "Create account" : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasswordAction((a) => (a === "sign-in" ? "sign-up" : "sign-in"));
                  resetFeedback();
                }}
                className="font-mono text-[11px] text-muted transition-colors hover:text-foreground"
              >
                {passwordAction === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </form>
          )}

          {status === "error" && errorMsg && (
            <p className="text-[12px] text-red-400">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
