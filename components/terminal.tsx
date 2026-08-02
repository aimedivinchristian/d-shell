"use client";

import * as React from "react";
import { createInitialFilesystem, pathToString, DirNode } from "@/lib/shell/filesystem";
import { knownCommands, runCommand, ShellState } from "@/lib/shell/commands";

interface Line {
  id: number;
  kind: "input" | "output" | "error";
  text: string;
  prompt?: string;
}

const DEMO_SCRIPT: { cmd: string; delay: number }[] = [
  { cmd: "whoami", delay: 45 },
  { cmd: "ls", delay: 45 },
];

let lineId = 0;
function nextId() {
  return lineId++;
}

interface TerminalProps {
  /** Called with the live ShellState after every user-submitted command. */
  onStateChange?: (state: ShellState) => void;
  /** Called with just the filesystem tree after every command — for cloud sync, kept separate from onStateChange since it fires on a different cadence upstream. */
  onFilesystemChange?: (fs: DirNode) => void;
  /** When true, skip the auto-typing intro and drop straight into a live prompt. */
  skipIntro?: boolean;
  /** A filesystem tree to start from instead of the default starter content — e.g. restored from a synced cloud session. */
  initialFilesystem?: DirNode;
}

export function Terminal({ onStateChange, onFilesystemChange, skipIntro = false, initialFilesystem }: TerminalProps) {
  const stateRef = React.useRef<ShellState>({
    root: initialFilesystem ?? createInitialFilesystem(),
    cwd: ["home", "learner"],
    history: [],
    env: {},
  });

  const [lines, setLines] = React.useState<Line[]>([]);
  const [input, setInput] = React.useState("");
  const [historyIndex, setHistoryIndex] = React.useState<number | null>(null);
  const [demoRunning, setDemoRunning] = React.useState(!skipIntro);
  const [demoText, setDemoText] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const prompt = React.useCallback(() => {
    const path = pathToString(stateRef.current.cwd).replace("/home/learner", "~");
    return `learner@d-shell:${path || "~"}$`;
  }, []);

  // Auto-typing intro demo, then hand control to the user. Skipped entirely
  // for returning users (skipIntro) — they've seen it.
  React.useEffect(() => {
    if (skipIntro) return;
    let cancelled = false;

    async function playDemo() {
      for (const step of DEMO_SCRIPT) {
        let typed = "";
        for (const ch of step.cmd) {
          if (cancelled) return;
          typed += ch;
          setDemoText(typed);
          await new Promise((r) => setTimeout(r, step.delay));
        }
        await new Promise((r) => setTimeout(r, 250));
        if (cancelled) return;
        const p = prompt();
        const result = runCommand(step.cmd, stateRef.current);
        setLines((prev) => [
          ...prev,
          { id: nextId(), kind: "input", text: step.cmd, prompt: p },
          ...(result.output ? [{ id: nextId(), kind: "output" as const, text: result.output }] : []),
          ...(result.error ? [{ id: nextId(), kind: "error" as const, text: result.error }] : []),
        ]);
        setDemoText("");
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!cancelled) {
        setDemoRunning(false);
        onStateChange?.(stateRef.current);
      }
    }

    playDemo();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipIntro]);

  React.useEffect(() => {
    if (!demoRunning) inputRef.current?.focus();
  }, [demoRunning]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, demoText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = input.trim();
    const p = prompt();

    if (!cmd) {
      setLines((prev) => [...prev, { id: nextId(), kind: "input", text: "", prompt: p }]);
      setInput("");
      return;
    }

    stateRef.current.history.push(cmd);
    setHistoryIndex(null);

    const result = runCommand(cmd, stateRef.current);

    setLines((prev) => {
      const base = [...prev, { id: nextId(), kind: "input" as const, text: cmd, prompt: p }];
      if (result.clear) return [];
      if (result.output) base.push({ id: nextId(), kind: "output", text: result.output });
      if (result.error) base.push({ id: nextId(), kind: "error", text: result.error });
      return base;
    });

    setInput("");
    onStateChange?.(stateRef.current);
    onFilesystemChange?.(stateRef.current.root);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const hist = stateRef.current.history;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hist.length === 0) return;
      const nextIndex = historyIndex === null ? hist.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(hist[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= hist.length) {
        setHistoryIndex(null);
        setInput("");
      } else {
        setHistoryIndex(nextIndex);
        setInput(hist[nextIndex]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = knownCommands.find((c) => c.startsWith(input));
      if (match) setInput(match);
    }
  }

  return (
    <div
      className="w-full rounded-lg border border-border bg-surface shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-accent/50"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 font-mono text-xs text-muted">learner@d-shell — bash</span>
      </div>

      <div
        ref={scrollRef}
        className="term-scroll h-[min(380px,55dvh)] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed sm:h-[380px] sm:text-sm"
      >
        {lines.map((line) => (
          <div key={line.id}>
            {line.kind === "input" ? (
              <div className="flex gap-2">
                <span className="shrink-0 text-accent">{line.prompt}</span>
                <span className="whitespace-pre-wrap break-all">{line.text}</span>
              </div>
            ) : (
              <div
                className={`whitespace-pre-wrap break-words ${
                  line.kind === "error" ? "text-red-400" : "text-foreground"
                }`}
              >
                {line.text}
              </div>
            )}
          </div>
        ))}

        {demoRunning ? (
          <div className="flex gap-2">
            <span className="shrink-0 text-accent">{prompt()}</span>
            <span>{demoText}</span>
            <span className="cursor-blink inline-block h-[1.1em] w-[7px] translate-y-[2px] bg-accent-glow" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <label htmlFor="terminal-input" className="shrink-0 text-accent">
              {prompt()}
            </label>
            <input
              id="terminal-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="flex-1 bg-transparent outline-none placeholder:text-muted"
              placeholder="type a command…"
              aria-label="Shell command input"
            />
          </form>
        )}
      </div>
    </div>
  );
}
