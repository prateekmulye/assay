/**
 * PipelineCanvas — the machine on the bench (DESIGN.md §8.9). An xyflow graph
 * of the 12 (or 10) pipeline DIES on a milled registration dot-grid, sitting
 * borderless and transparent over the bench itself. Edges are grooves in the
 * board; data arrival plays the PHOSPHOR TRACE (§6.3-2): a white-hot beam dot
 * crawls the live groove, the target die dips-then-pulses (fin-collide), and
 * the trace cools from beam to its phase tint over --duration-slow.
 *
 * DECORATIVE-but-causal: `aria-hidden`, non-interactive (pan/zoom/drag
 * locked), shadowed by the StatusAnnouncer + LiveFeed transcript for screen
 * readers. Node visuals are a pure function of the stream-derived NodeStatus
 * map; nodes are pre-positioned (zero CLS). Phase tints are state chroma
 * (§8.9): analysts=conservative · debate=hold · trade/risk=aggressive ·
 * reporter=the final action's signal.
 *
 * @xyflow/react and its CSS resolve into the lazy Analyze chunk.
 */
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { Check, X } from "lucide-react";
import { memo, useMemo } from "react";

import { nodeLabel, nodePhase } from "@/features/analyze/nodeLabels";
import type { Action } from "@/lib/api";
import { cn } from "@/lib/utils";

import "./cockpit.css";
import {
  type EdgeFlow,
  type NodeStatus,
  type Topology,
  edgeFlow,
} from "./pipeline";

/* Spatial tokens (px) — pre-allocated so the canvas never reflows mid-run. */
const COL_W = 168;
const ROW_H = 86;
const NODE_W = 138;
const NODE_H = 60;
const PAD = 24;
/* §10: the canvas is the full-width causal spine, ~340px. */
const BOARD_H = 340;

/** Die-face labels (§8.9) — short enough to NEVER truncate on the die at
 *  mono --text-2xs. The transcript keeps the full nodeLabel() names. */
const DIE_LABEL: Record<string, string> = {
  router: "Router",
  news_analyst: "News",
  fundamentals_analyst: "Fundamentals",
  technicals_analyst: "Technicals",
  bull: "Bull",
  bear: "Bear",
  facilitator: "Facilitator",
  research_synthesis: "Synthesis",
  trader: "Trader",
  risk_conservative: "Conservative",
  risk_aggressive: "Aggressive",
  risk_arbiter: "Arbiter",
  reporter: "Reporter",
};
const dieLabel = (id: string) => DIE_LABEL[id] ?? nodeLabel(id);

type FinNodeData = { status: NodeStatus; tint: string };
type FinEdgeData = { flow: EdgeFlow; tint: string };

const VERDICT_TINT: Record<Action, string> = {
  BUY: "var(--color-bull)",
  SELL: "var(--color-bear)",
  HOLD: "var(--color-hold)",
};

/** §8.9 phase tints — state chroma, per PHASE (personas speak in the panels). */
function dieTint(id: string, verdict: Action | null): string {
  switch (nodePhase(id)) {
    case "Analysts":
      return "var(--color-conservative)"; // cool intake
    case "Debate":
      return "var(--color-hold)"; // heat of argument
    case "Trade":
    case "Risk":
      return "var(--color-aggressive)";
    case "Report":
      // The verdict die takes the final action's signal; before (or without)
      // a decision it speaks "done" (bull, §3.4).
      return verdict ? VERDICT_TINT[verdict] : "var(--color-bull)";
    default:
      return "var(--color-beam)"; // Resolve — the machine's own light
  }
}

/** §8.9 die glow states — box-shadow lists built from tokens only. */
function dieShadow(status: NodeStatus, tint: string): string {
  if (status === "running") {
    // The lamp catches a working die: doubled milled edge + its panel shadow.
    return `inset 0 1px 0 0 var(--fin-edge-light-2), var(--shadow-panel)`;
  }
  if (status === "complete") {
    // Underglow ignites at collision, rests at ~6px (§8.9 / §6.3-2).
    return (
      `var(--shadow-panel), ` +
      `0 0 0 1px color-mix(in oklch, ${tint} 35%, transparent), ` +
      `0 0 14px -4px color-mix(in oklch, ${tint} 45%, transparent)`
    );
  }
  if (status === "error") {
    return (
      `var(--shadow-panel), ` +
      `0 0 0 1px color-mix(in oklch, var(--color-bear) 35%, transparent), ` +
      `0 0 14px -4px color-mix(in oklch, var(--color-bear) 45%, transparent)`
    );
  }
  return "var(--shadow-panel)";
}

/* ---------------------------------------------------------- custom die UI */

function FinNode({ data, id }: NodeProps & { data: FinNodeData }) {
  const { status, tint } = data;
  const running = status === "running";
  const complete = status === "complete";
  const error = status === "error";
  const halted = status === "halted";
  const skipped = status === "skipped";
  const filament = complete ? tint : error ? "var(--color-bear)" : null;

  return (
    <div
      className={cn(
        "pipe-node relative flex flex-col justify-center gap-1 overflow-hidden rounded-md bg-[var(--color-surface-2)] px-2.5 py-2",
        running && "animate-breathe",
        complete && "animate-collide",
      )}
      style={{
        width: NODE_W,
        height: NODE_H,
        transformOrigin: "center",
        boxShadow: dieShadow(status, tint),
        // §8.9 cached/skipped: 1px dashed outline (a permitted dashed outline,
        // §2.5), fill unchanged, pressed flat.
        outline: skipped ? "1px dashed var(--color-line-strong)" : "none",
        outlineOffset: -1,
        opacity:
          status === "pending" ? 0.55 : halted ? 0.6 : skipped ? 0.7 : 1,
      }}
    >
      {/* invisible handles keep edges anchored; the graph is non-interactive */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0"
        isConnectable={false}
      />

      <div className="flex items-center gap-1.5">
        {/* 6px status LED (§8.9): unlit -> beam breathing -> phase tint. */}
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{
            background: running
              ? "var(--color-beam)"
              : complete
                ? tint
                : error
                  ? "var(--color-bear)"
                  : "color-mix(in oklch, var(--color-fg-subtle) 30%, transparent)",
            boxShadow: running
              ? "0 0 6px 0 var(--color-beam-dim)"
              : complete
                ? `0 0 6px 0 color-mix(in oklch, ${tint} 40%, transparent)`
                : "none",
          }}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate font-mono text-2xs font-medium",
            running || complete || error
              ? "text-[var(--color-fg)]"
              : "text-[var(--color-fg-subtle)]",
          )}
        >
          {dieLabel(id)}
        </span>
        {complete && (
          <Check
            className="size-3 shrink-0"
            style={{ color: tint }}
            strokeWidth={2.5}
          />
        )}
        {error && (
          <X
            className="size-3 shrink-0 text-[var(--color-bear)]"
            strokeWidth={2.5}
          />
        )}
      </div>
      <span className="pl-3 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
        {skipped ? "cached" : halted ? "halted" : nodePhase(id)}
      </span>

      {/* 2px bottom filament in the phase tint (§8.9), lit on completion. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] transition-opacity duration-[180ms] ease-[var(--ease-out)]"
        style={{ background: filament ?? "transparent", opacity: filament ? 1 : 0 }}
      />
    </div>
  );
}

/* -------------------------------------------------------- custom groove UI */

function FinEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: FinEdgeData }) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const flow = data?.flow ?? "idle";
  const tint = data?.tint ?? "var(--color-beam)";
  const live = flow === "live";
  const settled = flow === "settled";

  return (
    <>
      {/* The groove: a 1px edge-light highlight beside the channel (§8.9). */}
      <path
        d={path}
        fill="none"
        className="pipe-edge"
        transform="translate(0 1)"
        style={{ stroke: "var(--edge-light)", strokeWidth: 1, opacity: 0.6 }}
      />
      {/* The channel itself: dormant edge-light -> live beam -> cooled tint.
          .pipe-edge-cool makes the beam->tint change the §6.3-2 cooling. */}
      <BaseEdge
        path={path}
        className="pipe-edge pipe-edge-cool"
        style={{
          stroke: settled
            ? `color-mix(in oklch, ${tint} 35%, transparent)`
            : live
              ? "var(--color-beam)"
              : "var(--edge-light)",
          strokeWidth: settled || live ? 1.5 : 1,
          opacity: settled ? 1 : live ? 0.65 : 1,
        }}
      />
      {live && (
        <>
          {/* marching-ants dash-flow on the live groove */}
          <path
            d={path}
            fill="none"
            className="pipe-edge edge-flow"
            style={{ stroke: "var(--color-beam)", strokeWidth: 1.5, opacity: 0.9 }}
          />
          {/* PHOSPHOR TRACE (§6.3-2): the white-hot beam dot, source -> target */}
          <circle
            r={2.5}
            className="animate-signal-travel"
            style={{
              offsetPath: `path('${path}')`,
              fill: "var(--color-beam)",
              filter: "drop-shadow(0 0 4px var(--color-beam))",
            }}
          />
        </>
      )}
    </>
  );
}

const nodeTypes = { fin: FinNode };
const edgeTypes = { fin: FinEdge };

/* ------------------------------------------------------------- the board */

// React.memo + the Cockpit-side useMemo on `statuses` means the board (and
// its node/edge useMemos) only re-renders when the topology, a node status,
// or the terminal verdict actually changed — not on token storms.
export const PipelineCanvas = memo(function PipelineCanvas({
  topology,
  statuses,
  verdict = null,
}: {
  topology: Topology;
  statuses: Record<string, NodeStatus>;
  /** Final action once `done` lands — tints the reporter die (§8.9). */
  verdict?: Action | null;
}) {
  const nodes: Node[] = useMemo(
    () =>
      topology.nodes.map((n) => ({
        id: n.id,
        type: "fin",
        position: { x: PAD + n.col * COL_W, y: PAD + n.row * ROW_H },
        data: { status: statuses[n.id] ?? "pending", tint: dieTint(n.id, verdict) },
        draggable: false,
        selectable: false,
        connectable: false,
        width: NODE_W,
        height: NODE_H,
      })),
    [topology, statuses, verdict],
  );

  const edges: Edge[] = useMemo(
    () =>
      topology.edges.map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        type: "fin",
        data: { flow: edgeFlow(e, statuses), tint: dieTint(e.from, verdict) },
      })),
    [topology, statuses, verdict],
  );

  return (
    <div
      aria-hidden="true"
      className="pipe-board overflow-hidden rounded-lg"
      style={{ height: BOARD_H }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        // The board is aria-hidden decoration — nothing inside it may take
        // keyboard focus (xyflow defaults edges/nodes to tabbable, which put
        // "Edge from router to…" in the page tab order behind aria-hidden).
        nodesFocusable={false}
        edgesFocusable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={1.4}
      />
    </div>
  );
});
