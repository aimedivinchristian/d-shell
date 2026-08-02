"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { useTypingTest } from "@/hooks/use-typing-test";
import { TypingMode } from "@/lib/typing-content";

interface TypingTestProps {
  mode: TypingMode;
  onModeChange: (mode: TypingMode) => void;
}

export function TypingTest({ mode, onModeChange }: TypingTestProps) {
  const test = useTypingTest(mode);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, [test.isFinished]);

  function handleModeSwitch(newMode: TypingMode) {
    onModeChange(newMode);
    test.restart(newMode);
  }

  return (
    <div
      className="w-full rounded-lg border border-border bg-surface shadow-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-5 py-3">
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleModeSwitch("commands"); }}
            className={`rounded px-2.5 py-1 transition-colors ${
              mode === "commands" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            commands
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleModeSwitch("words"); }}
            className={`rounded px-2.5 py-1 transition-colors ${
              mode === "words" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            words
          </button>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-muted">
          <span>
            <span className="text-accent">{test.stats.wpm}</span> wpm
          </span>
          <span>
            <span className="text-accent">{test.stats.accuracy}</span>% acc
          </span>
          <span>{Math.floor(test.stats.elapsedSeconds)}s</span>
        </div>
      </div>

      <div className="relative px-6 py-10 sm:px-10 sm:py-12" ref={containerRef}>
        {test.isFinished ? (
          <TypingResults stats={test.stats} onRestart={() => test.restart()} />
        ) : (
          <>
            <div className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-lg leading-relaxed sm:text-xl">
              {test.completedTokens.map((t, i) => (
                <span key={i} className={t.correct ? "text-muted/50" : "text-red-400/70"}>
                  {t.text}
                </span>
              ))}

              <span className="relative">
                {(() => {
                  const target = test.tokens[test.currentTokenIndex] ?? "";
                  const len = Math.max(target.length, test.currentInput.length);
                  return Array.from({ length: len }, (_, i) => {
                    const ch = i < target.length ? target[i] : test.currentInput[i];
                    const state = test.currentTokenCharStates[i] ?? "pending";
                    return (
                      <span
                        key={i}
                        className={
                          state === "correct"
                            ? "text-foreground"
                            : state === "incorrect"
                            ? "bg-red-500/20 text-red-400"
                            : "text-muted"
                        }
                      >
                        {ch === " " ? "\u00A0" : ch}
                      </span>
                    );
                  });
                })()}
                <span className="cursor-blink inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-accent-glow" />
              </span>

              {test.tokens.slice(test.currentTokenIndex + 1, test.currentTokenIndex + 9).map((tok, i) => (
                <span key={i} className="text-muted/40">
                  {tok}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              value={test.currentInput}
              onChange={(e) => test.handleInputChange(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="absolute inset-0 h-full w-full cursor-default opacity-0"
              aria-label="Typing test input"
            />
          </>
        )}
      </div>
    </div>
  );
}

function TypingResults({
  stats,
  onRestart,
}: {
  stats: ReturnType<typeof useTypingTest>["stats"];
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex gap-10">
        <div>
          <div className="font-mono text-4xl font-bold text-accent">{stats.wpm}</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">wpm</div>
        </div>
        <div>
          <div className="font-mono text-4xl font-bold text-foreground">{stats.accuracy}%</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">accuracy</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <RotateCcw size={12} />
        try again
      </button>
    </div>
  );
}
