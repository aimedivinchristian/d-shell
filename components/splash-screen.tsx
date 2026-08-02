"use client";

import * as React from "react";
import Image from "next/image";

interface SplashScreenProps {
  /** Once true, the splash begins fading out and unmounts shortly after. */
  ready: boolean;
  /** Minimum time the splash stays visible, in ms — avoids an unpleasant flash on fast loads. */
  minDurationMs?: number;
}

export function SplashScreen({ ready, minDurationMs = 700 }: SplashScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [mounted, setMounted] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  React.useEffect(() => {
    if (ready && minTimeElapsed) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400); // matches the fade transition below
      return () => clearTimeout(t);
    }
  }, [ready, minTimeElapsed]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-[400ms] ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative h-24 w-24 animate-pulse">
          <Image
            src="/dshell-logo.png"
            alt="D>shell"
            fill
            sizes="96px"
            priority
            className="object-contain"
          />
        </div>
        <div className="h-[2px] w-24 overflow-hidden rounded-full bg-[#2a2a2a]">
          <div className="h-full w-1/3 animate-[loading-sweep_1.1s_ease-in-out_infinite] rounded-full bg-[#22d3ee]" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 pb-10">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#6b6b6b]">
          Developed by
        </span>
        <span className="font-mono text-sm font-medium text-[#8a8a8a]">Space D</span>
      </div>
    </div>
  );
}
