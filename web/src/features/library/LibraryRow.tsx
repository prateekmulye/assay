/**
 * LibraryRow — one ledger line (DESIGN.md §10-Library). Anatomy is the
 * contract: verdict chip in a FIXED 96px column | ticker mono 500 | conviction
 * meter (3px signal fill — the row's only other chroma) | mono metrics tape |
 * relative time. The verdict chips stacking down the page form the colored
 * spine on an otherwise graphite ledger — that IS the composition, so
 * everything else in the row speaks in luminance (an exceptional status —
 * error/aborted/running — earns a tinted word in the tape, §3.6).
 *
 * The whole h-14 row is the click target (Fitts) and lifts toward the lamp on
 * hover (§8.14 + the press spring); rows enter with the page's 24ms stagger
 * (§6.2, capped at 8 then batched). Replay opens at /library/:runId.
 */
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { SignalBadge } from "@/components/ui/signal-badge";
import type { RunSummary } from "@/lib/api";
import {
  formatInt,
  formatLatency,
  formatRelativeTime,
  formatUsd,
} from "@/lib/utils";

import { ConvictionMeter } from "./runChips";
import { actionTint, statusTint } from "./runFormat";

export function LibraryRow({
  run,
  index = 0,
}: {
  run: RunSummary;
  /** Position in the list — drives the 24ms entry stagger (max 8, §6.2). */
  index?: number;
}) {
  const fd = run.final_decision;
  const exceptionTint = statusTint(run.status);

  return (
    <Link
      to={`/library/${encodeURIComponent(run.run_id)}`}
      state={{ ticker: run.ticker }}
      aria-label={`Replay ${run.ticker} — ${fd?.action ?? "no verdict"}, ${run.status}`}
      className="group block focus-visible:outline-none"
    >
      <div
        className="panel animate-rise-in flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 [transition:translate_var(--spring-press),box-shadow_180ms_var(--ease-out),background-color_180ms_var(--ease-out)] group-hover:-translate-y-0.5 group-hover:bg-[var(--color-surface-2)] group-hover:shadow-[var(--shadow-lifted)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--color-beam)] sm:h-14 sm:flex-nowrap sm:py-0"
        style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
      >
        {/* Verdict chip — the fixed 96px spine column. */}
        <span className="w-24 shrink-0">
          {fd ? (
            <SignalBadge action={fd.action} score={fd.score} size="sm" />
          ) : (
            <span className="inline-flex rounded-sm bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-2xs lowercase tracking-wide text-[var(--color-fg-subtle)]">
              no verdict
            </span>
          )}
        </span>

        {/* Identity. */}
        <span className="w-24 truncate font-mono text-sm font-medium tracking-tight text-[var(--color-fg)] sm:w-28">
          {run.ticker}
        </span>

        {/* Conviction — the only other chroma on the line. */}
        {fd ? (
          <ConvictionMeter
            conviction={fd.conviction}
            tint={actionTint(fd.action)}
            className="shrink-0"
          />
        ) : (
          <span
            className="w-20 shrink-0 font-mono text-2xs text-[var(--color-fg-subtle)]"
            aria-hidden="true"
          >
            —
          </span>
        )}

        {/* Metrics tape — mono, luminance only; an exceptional status earns
            its state word (glyph-free words are fine: word + color, §1). */}
        <span className="ml-auto flex shrink-0 items-center gap-4 font-mono text-2xs tabular-nums">
          {exceptionTint && (
            <span
              className="font-medium lowercase tracking-wide"
              style={{ color: exceptionTint }}
            >
              {run.status}
            </span>
          )}
          <Metric label="cost" value={formatUsd(run.cost?.cost_usd)} />
          <Metric label="tok" value={formatInt(run.cost?.total_tokens)} />
          <Metric label="lat" value={formatLatency(run.cost?.latency_s)} />
          <span className="hidden text-[var(--color-fg-subtle)] md:inline">
            {formatRelativeTime(run.started_at)}
          </span>
          <ChevronRight
            className="size-4 text-[var(--color-fg-subtle)] transition-[transform,color] duration-[180ms] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-[var(--color-fg)]"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="uppercase tracking-[0.14em] text-[var(--color-fg-subtle)]">
        {label}
      </span>
      <span className="text-[var(--color-fg-muted)]">{value}</span>
    </span>
  );
}
