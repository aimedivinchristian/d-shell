"use client";

import * as React from "react";
import { generateTypingContent, TypingMode } from "@/lib/typing-content";

export type CharState = "pending" | "correct" | "incorrect";

export interface TypingStats {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  correctChars: number;
  incorrectChars: number;
}

interface UseTypingTestResult {
  tokens: string[];
  currentTokenIndex: number;
  currentInput: string;
  /** Per-character correctness for the current token, for rendering. */
  currentTokenCharStates: CharState[];
  completedTokens: { text: string; correct: boolean }[];
  stats: TypingStats;
  isRunning: boolean;
  isFinished: boolean;
  handleInputChange: (value: string) => void;
  restart: (mode?: TypingMode) => void;
}

const TOKEN_COUNT = 20;

export function useTypingTest(initialMode: TypingMode): UseTypingTestResult {
  const [mode, setMode] = React.useState(initialMode);
  const [tokens, setTokens] = React.useState<string[]>(() => generateTypingContent(initialMode, TOKEN_COUNT));
  const [currentTokenIndex, setCurrentTokenIndex] = React.useState(0);
  const [currentInput, setCurrentInput] = React.useState("");
  const [completedTokens, setCompletedTokens] = React.useState<{ text: string; correct: boolean }[]>([]);
  const [correctChars, setCorrectChars] = React.useState(0);
  const [incorrectChars, setIncorrectChars] = React.useState(0);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [now, setNow] = React.useState<number | null>(null);
  const [isFinished, setIsFinished] = React.useState(false);

  // Tick once per second while running, to keep live WPM updating.
  React.useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  const restart = React.useCallback((newMode?: TypingMode) => {
    const effectiveMode = newMode ?? mode;
    setMode(effectiveMode);
    setTokens(generateTypingContent(effectiveMode, TOKEN_COUNT));
    setCurrentTokenIndex(0);
    setCurrentInput("");
    setCompletedTokens([]);
    setCorrectChars(0);
    setIncorrectChars(0);
    setStartTime(null);
    setNow(null);
    setIsFinished(false);
  }, [mode]);

  const handleInputChange = React.useCallback(
    (value: string) => {
      if (isFinished) return;
      if (startTime === null) {
        setStartTime(Date.now());
        setNow(Date.now());
      }

      const target = tokens[currentTokenIndex] ?? "";

      // A trailing space submits the current token, unless the token itself
      // legitimately contains spaces (command mode) and the user hasn't yet
      // typed past its full length.
      if (value.endsWith(" ")) {
        const typed = value.slice(0, -1);
        if (typed.length >= target.length || !target.includes(" ")) {
          const isCorrect = typed === target;
          let correctDelta = 0;
          let incorrectDelta = 0;
          for (let i = 0; i < Math.max(typed.length, target.length); i++) {
            if (typed[i] === target[i]) correctDelta++;
            else incorrectDelta++;
          }
          setCorrectChars((c) => c + correctDelta);
          setIncorrectChars((c) => c + incorrectDelta);
          setCompletedTokens((prev) => [...prev, { text: typed, correct: isCorrect }]);

          const nextIndex = currentTokenIndex + 1;
          if (nextIndex >= tokens.length) {
            setIsFinished(true);
            setCurrentInput("");
          } else {
            setCurrentTokenIndex(nextIndex);
            setCurrentInput("");
          }
          return;
        }
      }

      setCurrentInput(value);
    },
    [tokens, currentTokenIndex, isFinished, startTime]
  );

  const currentTokenCharStates: CharState[] = React.useMemo(() => {
    const target = tokens[currentTokenIndex] ?? "";
    const states: CharState[] = [];
    const len = Math.max(target.length, currentInput.length);
    for (let i = 0; i < len; i++) {
      if (i >= currentInput.length) states.push("pending");
      else if (i >= target.length) states.push("incorrect"); // overtyped beyond the target
      else states.push(currentInput[i] === target[i] ? "correct" : "incorrect");
    }
    return states;
  }, [tokens, currentTokenIndex, currentInput]);

  const stats: TypingStats = React.useMemo(() => {
    const elapsedMs = startTime && now ? now - startTime : 0;
    const elapsedSeconds = elapsedMs / 1000;
    const elapsedMinutes = elapsedSeconds / 60;
    // Standard WPM formula: (correct chars / 5) / minutes elapsed.
    const wpm = elapsedMinutes > 0 ? Math.round(correctChars / 5 / elapsedMinutes) : 0;
    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    return { wpm, accuracy, elapsedSeconds, correctChars, incorrectChars };
  }, [startTime, now, correctChars, incorrectChars]);

  return {
    tokens,
    currentTokenIndex,
    currentInput,
    currentTokenCharStates,
    completedTokens,
    stats,
    isRunning: startTime !== null && !isFinished,
    isFinished,
    handleInputChange,
    restart,
  };
}
