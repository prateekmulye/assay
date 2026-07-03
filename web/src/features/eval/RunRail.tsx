/**
 * RunRail — the eval-run selector as a machined SEGMENTED CONTROL (§8.4): a
 * milled well containing key-shaped segments, newest first. The selected run is
 * a pressed key — surface-3 fill + the 1px milled edge-light — that slides
 * between segments via a shared-layout spring (press physics, §6.1). Selecting
 * a run writes ?label= to the URL so every run is deep-linkable (the same
 * URL-as-source-of-truth idiom the library and market screens use). Hick's
 * Law: a finite, scannable rail beats a dropdown that hides the comparison set.
 */
import { motion } from "motion/react";
import { Link } from "react-router";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { EvalResult } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";

export function RunRail({
  runs,
  activeLabel,
}: {
  runs: EvalResult[];
  /** The label currently selected (from ?label=), or the newest by default. */
  activeLabel: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div>
      <p className="kicker mb-2 px-1">
        Eval runs
        <span className="ml-2 tabular-nums">{runs.length}</span>
      </p>
      <ul
        className="well flex max-w-full snap-x gap-1 overflow-x-auto p-1.5 lg:inline-flex"
        aria-label="Stored eval runs, newest first"
      >
        {runs.map((run) => {
          const active = run.label === activeLabel;
          const nTickers =
            typeof run.summary?.n_tickers === "number"
              ? run.summary.n_tickers
              : null;
          return (
            <li key={run.id} className="snap-start">
              <Link
                to={`/eval?label=${encodeURIComponent(run.label)}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  // The segment IS the focus target, so the beam ring lives
                  // right here (never suppressed without a replacement).
                  "relative flex min-w-[9.5rem] flex-col gap-0.5 rounded-md px-3 py-2 transition-colors duration-[150ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-beam)]",
                  active
                    ? "text-[var(--color-fg)]"
                    : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]",
                )}
              >
                {active && (
                  <motion.span
                    aria-hidden="true"
                    layoutId="eval-run-key"
                    className="absolute inset-0 rounded-md bg-[var(--color-surface-3)] shadow-[inset_0_1px_0_0_var(--edge-light)]"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", visualDuration: 0.18, bounce: 0 }
                    }
                  />
                )}
                <span className="relative flex items-baseline justify-between gap-2">
                  <span className="truncate font-mono text-sm tracking-tight [font-weight:550]">
                    {run.label}
                  </span>
                  {nTickers != null && (
                    <span className="shrink-0 font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
                      {nTickers}t
                    </span>
                  )}
                </span>
                <span className="relative font-mono text-2xs text-[var(--color-fg-subtle)]">
                  {formatRelativeTime(run.created_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
