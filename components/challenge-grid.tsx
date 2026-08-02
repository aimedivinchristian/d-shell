import { Check } from "lucide-react";
import { challenges, Difficulty } from "@/lib/challenges";

interface ChallengeGridProps {
  completedIds: Set<string>;
}

const TIER_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];
const TIER_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ChallengeGrid({ completedIds }: ChallengeGridProps) {
  return (
    <div className="flex flex-col gap-10">
      {TIER_ORDER.map((tier) => {
        const tierChallenges = challenges.filter((c) => c.difficulty === tier);
        const tierDone = tierChallenges.filter((c) => completedIds.has(c.id)).length;

        return (
          <div key={tier} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-mono text-xs uppercase tracking-wide text-muted">
                {TIER_LABEL[tier]}
              </h3>
              <span className="font-mono text-xs text-muted">
                {tierDone}/{tierChallenges.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tierChallenges.map((c, i) => {
                const done = completedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className={`group flex flex-col gap-3 rounded-lg border p-5 transition-colors ${
                      done
                        ? "border-accent/40 bg-accent/[0.04]"
                        : "border-border bg-surface hover:border-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {done ? (
                        <span className="flex items-center gap-1 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                          <Check size={11} strokeWidth={2.5} />
                          done
                        </span>
                      ) : (
                        <span className="rounded border border-border bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-muted">
                          {c.command}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-[15px] font-medium leading-snug">{c.title}</h3>
                    <p className="text-[13px] leading-relaxed text-muted">{c.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
