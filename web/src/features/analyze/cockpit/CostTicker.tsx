/**
 * CostTicker — the METER STRIP (DESIGN.md §8.12): a horizontal mono strip in
 * a milled well, pinned under the pipeline board. A 6px beam LED leads it
 * (breathing while streaming, unlit at done); value groups — tokens · cost ·
 * elapsed · nodes — are separated by hairline verticals (rules, not boxes)
 * and sit in fixed-width tabular slots so digits never reflow.
 *
 * Increments are COLLISION-DRIVEN (§6.3-2): a value advances only when a
 * node_complete metric lands, and the changed group flashes to the beam for
 * 150ms before settling to fg (fin-meter-flash, keyed remount). At `done`
 * the strip freezes with one final flash.
 */
import { useEffect, useState } from "react";

import type { AnalysisStreamState } from "@/hooks/useAnalysisStream";
import { cn, formatInt, formatUsd } from "@/lib/utils";

import "./cockpit.css";
import { costTotals, elapsedSeconds } from "./pipeline";

function Meter({
  label,
  value,
  flash,
  width = "5.5ch",
}: {
  label: string;
  value: string;
  flash?: boolean;
  /** Reserved value width (ch) — digits land in place, never reflow. */
  width?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-2 px-3 first:pl-0 sm:px-4">
      <span className="kicker whitespace-nowrap !tracking-[0.14em]">{label}</span>
      <span
        className={cn(
          "text-right font-mono text-sm font-semibold tabular-nums text-[var(--color-fg)]",
          flash && "meter-flash",
        )}
        style={{ minWidth: width }}
      >
        {value}
      </span>
    </div>
  );
}

export function CostTicker({
  state,
  replayElapsedMs = null,
}: {
  state: AnalysisStreamState;
  /**
   * REPLAY: the ORIGINAL run's recorded elapsed ms at the playhead (from
   * useEventPlayer.recordedElapsedMs). When set, ELAPSED renders this and the
   * wall clock is never consulted — replay state stamps node lifecycles with
   * synthetic fold ticks, and `Date.now() - tick` renders raw epoch seconds.
   */
  replayElapsedMs?: number | null;
}) {
  const totals = costTotals(state);
  const active = state.phase === "connecting" || state.phase === "streaming";
  const isDone = state.phase === "done";
  const isReplay = replayElapsedMs != null;

  // 1Hz wall clock only while live + active, so elapsed advances without
  // re-rendering the whole cockpit on every frame. Replay never ticks: its
  // elapsed is welded to the recorded timeline, not to wall time.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active || isReplay) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, isReplay]);

  // Wall-clock elapsed while live and at done. Only a trivially short wall
  // clock (< 2s — a near-instant cached/fake run) is substituted with the
  // summed per-node latency: on a real run parallel nodes routinely make that
  // sum EXCEED the wall time, so it must never replace it.
  const wall = elapsedSeconds(state, now);
  const liveElapsed =
    isDone && wall < 2 && totals.latencyS > wall ? totals.latencyS : wall;
  const elapsed = isReplay ? replayElapsedMs / 1000 : liveElapsed;

  // Flash keying: a new reporting node = a collision; the phase flip to done
  // = the final freeze flash. Remount-by-key restarts fin-meter-flash.
  const collide = totals.nodesReporting > 0 && (active || isDone);
  const flashKey = `${totals.nodesReporting}-${isDone}`;

  // role="group", NOT a live region: the 1Hz clock would announce every
  // second. The terminal cost summary is announced once by StatusAnnouncer.
  return (
    <div
      role="group"
      aria-label="Run cost"
      className="well flex items-center overflow-x-auto px-3.5 py-2.5 sm:px-4"
    >
      {/* The strip's LED (§8.12): beam + breathing while streaming; unlit at
          done. Static beam at rest under reduced motion (index.css unwind). */}
      <span
        aria-hidden="true"
        className={cn(
          "mr-1 size-1.5 shrink-0 rounded-full sm:mr-2",
          active && "animate-breathe",
        )}
        style={{
          background: active
            ? "var(--color-beam)"
            : "color-mix(in oklch, var(--color-fg-subtle) 30%, transparent)",
          boxShadow: active ? "0 0 6px 0 var(--color-beam-dim)" : "none",
        }}
      />
      <div className="flex divide-x divide-[var(--color-line)]">
        <Meter
          key={`tok-${flashKey}`}
          label="tokens"
          value={formatInt(totals.totalTokens)}
          flash={collide}
          width="6.5ch"
        />
        <Meter
          key={`cost-${flashKey}`}
          label="cost"
          value={formatUsd(totals.costUsd)}
          flash={collide}
          width="7.5ch"
        />
        <Meter
          label="elapsed"
          value={`${elapsed.toFixed(elapsed < 10 ? 1 : 0)}s`}
          width="5.5ch"
        />
        <Meter
          key={`nodes-${flashKey}`}
          label="nodes"
          value={formatInt(totals.nodesReporting)}
          flash={collide}
          width="2.5ch"
        />
      </div>
    </div>
  );
}
