/**
 * LibraryRow — one past run as a panel-framed terminal tile (not a table cell).
 *
 * Reading order is deliberate (Von Restorff + Serial Position): a left verdict
 * CAP isolates the BUY/SELL/HOLD signal as the row's hero, the mono ticker is
 * its identity, then the run's structure (conviction, debate, status) and a
 * right-aligned Bloomberg-style metrics tape (cost · tokens · latency · time).
 * The whole row is the click target (Fitts) and lifts on hover with the system
 * spring. Replay opens at /library/:runId.
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

import { ConvictionMeter, DebateChip, StatusChip } from "./runChips";
import { actionTint } from "./runFormat";

export function LibraryRow({ run }: { run: RunSummary }) {
  const fd = run.final_decision;
  const tint = fd ? actionTint(fd.action) : "var(--color-fg-subtle)";

  return (
    <Link
      to={`/library/${encodeURIComponent(run.run_id)}`}
      state={{ ticker: run.ticker }}
      aria-label={`Replay ${run.ticker} — ${fd?.action ?? "no verdict"}, ${run.status}`}
      className="group block focus-visible:outline-none"
    >
      <div className="panel relative flex items-stretch gap-0 overflow-hidden rounded-lg transition-[transform,box-shadow,border-color] duration-[200ms] ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lifted)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--color-beam)]">
        {/* Verdict cap — the isolated signal rail. */}
        <span
          aria-hidden="true"
          className="w-1 shrink-0"
          style={{ background: tint }}
        />

        <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:py-3.5 sm:pl-5 sm:pr-4">
          {/* Identity + verdict */}
          <div className="flex min-w-0 items-center gap-3 sm:w-56 sm:shrink-0">
            {fd ? (
              <SignalBadge action={fd.action} score={fd.score} size="md" />
            ) : (
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-2xs text-[var(--color-fg-subtle)]">
                no verdict
              </span>
            )}
            <span className="truncate font-mono text-base font-semibold tracking-tight text-[var(--color-fg)]">
              {run.ticker}
            </span>
          </div>

          {/* Structure: conviction + chips */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-1">
            {fd ? (
              <ConvictionMeter conviction={fd.conviction} tint={tint} />
            ) : (
              <span className="font-mono text-2xs text-[var(--color-fg-subtle)]">
                —
              </span>
            )}
            <DebateChip mode={run.debate_mode} />
            <StatusChip status={run.status} />
          </div>

          {/* Metrics tape — Bloomberg energy, right-aligned. */}
          <div className="flex shrink-0 items-center gap-4 font-mono text-2xs tabular-nums text-[var(--color-fg-muted)]">
            <Metric label="cost" value={formatUsd(run.cost?.cost_usd)} />
            <Metric label="tok" value={formatInt(run.cost?.total_tokens)} />
            <Metric label="lat" value={formatLatency(run.cost?.latency_s)} />
            <span className="hidden text-[var(--color-fg-subtle)] sm:inline">
              {formatRelativeTime(run.started_at)}
            </span>
            <ChevronRight
              className="size-4 text-[var(--color-fg-subtle)] transition-[transform,color] duration-[200ms] group-hover:translate-x-0.5 group-hover:text-[var(--color-fg)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
        {label}
      </span>
      <span className="text-[var(--color-fg)]">{value}</span>
    </span>
  );
}
