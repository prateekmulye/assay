/**
 * ArmedCanvas — the bench at rest (DESIGN.md §10-Analyze, "armed"). Before
 * any run, the FULL pipeline model renders UNLIT beneath the command bench:
 * idle dies flat on the dot-grid board, dormant grooves, three unlit LEDs in
 * the caption — the recruiter sees the whole machine as an object before it
 * wakes. The empty state IS the product diagram.
 *
 * Purely presentational: statuses are all-pending, topology is the full
 * debate-on graph (the larger machine — the honest default promise).
 */
import { useMemo } from "react";

import { initialState } from "@/hooks/analysisReducer";

import { PipelineCanvas } from "./PipelineCanvas";
import { type NodeStatus, resolveTopology } from "./pipeline";

export function ArmedCanvas() {
  const { topology } = resolveTopology(initialState, "on");
  const statuses = useMemo(() => {
    const out: Record<string, NodeStatus> = {};
    for (const { id } of topology.nodes) out[id] = "pending";
    return out;
  }, [topology]);

  return (
    <section aria-label="Agent pipeline, idle" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="kicker">Pipeline · armed</span>
        <span className="flex items-center gap-3">
          {/* Three unlit LEDs (§8.8) — the instrument waiting. */}
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1 rounded-full bg-[var(--color-fg-subtle)] opacity-30"
              />
            ))}
          </span>
          <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
            {topology.nodes.length} nodes · idle
          </span>
        </span>
      </div>
      <PipelineCanvas topology={topology} statuses={statuses} />
      <p className="text-center text-xs text-[var(--color-fg-subtle)]">
        Run a ticker to wake the machine — the verdict lands here.
      </p>
    </section>
  );
}
