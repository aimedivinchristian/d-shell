import { User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { ThemeToggle } from "@/components/theme-toggle";

interface SiteHeaderProps {
  user?: User | null;
  onAccountClick?: () => void;
}

export function SiteHeader({ user, onAccountClick }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
      <div className="flex items-center gap-2 font-display text-[15px] font-medium">
        <span>D</span>
        <span className="text-accent">&gt;</span>
        <span className="text-muted">shell</span>
      </div>
      <div className="flex items-center gap-2">
        {onAccountClick && (
          <button
            type="button"
            onClick={onAccountClick}
            aria-label={user ? "Account" : "Sign in"}
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors ${
              user
                ? "border-accent/40 text-accent hover:border-accent"
                : "border-border text-muted hover:border-accent hover:text-foreground"
            }`}
          >
            <UserIcon size={13} />
            {user ? "Synced" : "Sign in"}
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
