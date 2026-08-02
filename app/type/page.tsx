"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { TypingTest } from "@/components/typing-test";
import { TypingMode } from "@/lib/typing-content";
import { useSync } from "@/hooks/use-sync";

export default function TypePage() {
  const sync = useSync();
  const [mode, setMode] = React.useState<TypingMode>("commands");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={sync.user} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={13} />
            back to shell
          </Link>
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            Typing practice
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-muted">
            Build muscle memory for shell syntax, or just get faster at typing in general.
            Start typing to begin — the timer starts on your first keystroke.
          </p>
        </div>

        <TypingTest mode={mode} onModeChange={setMode} />
      </main>

      <footer className="border-t border-border px-5 py-6 sm:px-8">
        <p className="font-mono text-xs text-muted">D&gt;shell — a Space D project</p>
      </footer>
    </div>
  );
}
