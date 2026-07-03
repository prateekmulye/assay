/**
 * QuotaBlocked — the §10 quota state: a HOLD-LED banner, not a dead wall.
 * When live runs are exhausted (429 / replay-only) the bench steers the
 * visitor to the Library replays: a recruiter who hits the cap still watches
 * a real recorded run. Hold is the DESIGN token for replay-only (§3.6); the
 * LED + kicker say it in light AND words.
 */
import { Sparkles } from "lucide-react";
import { Link } from "react-router";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuotaBlocked({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="panel relative overflow-hidden p-5 sm:p-6">
      {/* Hold filament — the banner's state, §3.6: replay-only = hold. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-hold)]"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="mb-1.5 flex items-center gap-2">
            {/* The hold LED. */}
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--color-hold)] shadow-[0_0_6px_0_var(--color-hold-dim)]"
            />
            <span className="kicker">Replay-only · daily quota reached</span>
          </p>
          <h2 className="text-lg text-[var(--color-fg)] [font-weight:550]">
            Out of live runs for today
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">
            Live analyses are metered to keep the demo affordable. The full
            cockpit — every node, the debate, the verdict — replays from
            recorded runs in the Library, at speed and with zero quota.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link to="/library" className={cn(buttonVariants({ variant: "key" }))}>
            <Sparkles className="size-4" aria-hidden="true" />
            Watch a replay
          </Link>
          {onDismiss && (
            <Button variant="rail" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
