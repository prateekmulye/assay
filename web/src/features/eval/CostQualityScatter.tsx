/**
 * CostQualityScatter — the spatial proof of the screen. One point per ticker:
 * x = cost delta (the debate's price), y = score delta (the debate's payoff).
 * The (0,0) origin is the ABLATION BASELINE — the system with the debate OFF
 * (NotebookLM "Zero-Point Crosshair") — drawn as a `--color-line-strong`
 * crosshair (§8.15). Quadrant tints turn position into a literal verdict:
 * top-right faint bull = "debate earns its place" (better score, and yes it
 * cost more); bottom-left faint bear = "ablate" (worse score AND cheaper off).
 * Points are colored by judge preference per §3.5 — on=bull,
 * off=conservative (informative, never bear), tie=fg-subtle, and unjudged is a
 * HOLLOW point (1px line-strong stroke, no fill). Hover = an opaque surface-3
 * Onion-Peel tooltip with the full per-ticker tape (mono, no blur).
 *
 * recharts is themed entirely to DESIGN tokens — OKLCH vars resolve directly
 * in SVG (unlike the canvas chart lib in WP-9). recharts stays lazy-co-located
 * in the EvalPage chunk; `isAnimationActive` is false (§8.15).
 */
import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  type EvalPair,
  formatSignedInt,
  formatSignedSeconds,
  formatSignedUsd,
} from "./evalFormat";
import { judgeColor, judgeFill } from "./judgeChrome";

interface Point {
  ticker: string;
  x: number; // cost delta
  y: number; // score delta
  pair: EvalPair;
}

/** Only points with BOTH deltas present can be plotted. */
function toPoints(pairs: EvalPair[]): Point[] {
  return pairs.flatMap((p) =>
    p.costDelta != null && p.scoreDelta != null
      ? [{ ticker: p.ticker, x: p.costDelta, y: p.scoreDelta, pair: p }]
      : [],
  );
}

/** A symmetric axis domain padded around the data so the origin crosshair sits
 *  inside the frame and no point hugs the edge. */
function domain(values: number[], pad = 1.2): [number, number] {
  const max = Math.max(0.0001, ...values.map((v) => Math.abs(v)));
  const m = max * pad;
  return [-m, m];
}

export function CostQualityScatter({ pairs }: { pairs: EvalPair[] }) {
  const points = toPoints(pairs);
  const plotted = points.length;
  const dropped = pairs.length - plotted;

  if (plotted === 0) {
    return (
      <div className="well flex h-[360px] flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm font-medium text-[var(--color-fg)]">
          No plottable tickers
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-[var(--color-fg-muted)]">
          A point needs both a cost delta and a score delta. This run didn&rsquo;t
          record paired metrics for any ticker.
        </p>
      </div>
    );
  }

  const xDomain = domain(points.map((p) => p.x));
  const yDomain = domain(points.map((p) => p.y));

  return (
    <div>
      <div className="relative h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 8 }}>
            {/* Quadrant tints — position becomes a verdict (§8.15: bull/bear
                at 5%; this is outcome state, not judge chroma). */}
            {/* Top-right: better score AND costs more → "earns its place". */}
            <ReferenceArea
              x1={0}
              x2={xDomain[1]}
              y1={0}
              y2={yDomain[1]}
              fill="var(--color-bull)"
              fillOpacity={0.05}
              stroke="none"
            />
            {/* Bottom-left: worse score AND cheaper off → "ablate". */}
            <ReferenceArea
              x1={xDomain[0]}
              x2={0}
              y1={yDomain[0]}
              y2={0}
              fill="var(--color-bear)"
              fillOpacity={0.05}
              stroke="none"
            />

            {/* Grid: ivory at 4%, "2 4" dashes (§8.15) — a registration
                etching, not a cage. */}
            <CartesianGrid
              stroke="var(--color-fg)"
              strokeOpacity={0.04}
              strokeDasharray="2 4"
              vertical
              horizontal
            />

            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              ticks={[xDomain[0], xDomain[0] / 2, 0, xDomain[1] / 2, xDomain[1]]}
              tick={{
                fill: "var(--color-fg-subtle)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(v: number) => (v === 0 ? "$0" : formatSignedUsd(v))}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={yDomain}
              ticks={[yDomain[0], yDomain[0] / 2, 0, yDomain[1] / 2, yDomain[1]]}
              tick={{
                fill: "var(--color-fg-subtle)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(v: number) => {
                // Kill float-noise ticks ("28.799999999") from the padded domain.
                const n = Number(v.toFixed(1));
                return n > 0 ? `+${n}` : `${n}`;
              }}
              tickLine={false}
              axisLine={false}
              width={44}
            />

            {/* The Ablation Baseline crosshair through (0,0) — §8.15. */}
            <ReferenceLine x={0} stroke="var(--color-line-strong)" strokeWidth={1} />
            <ReferenceLine y={0} stroke="var(--color-line-strong)" strokeWidth={1} />

            <Tooltip
              cursor={{ stroke: "var(--color-beam)", strokeOpacity: 0.3 }}
              content={<ScatterTooltip />}
            />

            <Scatter data={points} isAnimationActive={false}>
              {points.map((p) =>
                p.pair.judgePreferred == null ? (
                  // Unjudged: hollow — 1px line-strong stroke, no fill (§3.5).
                  <Cell
                    key={p.ticker}
                    fill="transparent"
                    stroke="var(--color-line-strong)"
                    strokeWidth={1}
                  />
                ) : (
                  <Cell
                    key={p.ticker}
                    fill={judgeColor(p.pair.judgePreferred)}
                    stroke="var(--color-base)"
                    strokeWidth={1.5}
                  />
                ),
              )}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant corner captions — pure annotation, aria-hidden (the data is
            in the tooltip + table). Absolutely positioned over the plot. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-2 font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--color-bull)" }}
        >
          earns its place ↗
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-14 left-16 font-mono text-[10px] uppercase tracking-wider"
          style={{ color: "var(--color-bear)" }}
        >
          ↙ ablate
        </span>
      </div>

      {/* Axis intent + dropped-row honesty footnote. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 font-mono text-2xs text-[var(--color-fg-subtle)]">
        <span>
          x: debate adds cost → &nbsp;·&nbsp; y: debate adds score ↑ &nbsp;·&nbsp;
          origin = debate OFF baseline
        </span>
        {dropped > 0 && (
          <span style={{ color: "var(--color-hold)" }}>
            {dropped} ticker{dropped === 1 ? "" : "s"} not plotted (missing paired
            metrics)
          </span>
        )}
      </div>
    </div>
  );
}

/** The Onion-Peel tooltip: an opaque surface-3 pane (§8.15 — no blur, lifted
 *  shadow) carrying the full per-ticker tape in mono. */
function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}) {
  const first = active ? payload?.[0] : undefined;
  if (!first) return null;
  const { pair } = first.payload;
  return (
    <div className="min-w-[12rem] rounded-lg bg-[var(--color-surface-3)] p-3 font-mono text-2xs shadow-[var(--shadow-lifted)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold tracking-tight text-[var(--color-fg)]">
          {pair.ticker}
        </span>
        <JudgePref pref={pair.judgePreferred} />
      </div>
      <TooltipRow
        label="verdict"
        value={`${pair.actionOn ?? "—"} → ${pair.actionOff ?? "—"}`}
        agree={pair.actionsAgree}
      />
      <TooltipRow
        label="score"
        value={`${pair.scoreOn ?? "—"} → ${pair.scoreOff ?? "—"} (${
          pair.scoreDelta != null
            ? (pair.scoreDelta > 0 ? "+" : "") + pair.scoreDelta
            : "—"
        })`}
      />
      <TooltipRow label="cost Δ" value={formatSignedUsd(pair.costDelta)} />
      <TooltipRow label="latency Δ" value={formatSignedSeconds(pair.latencyDelta)} />
      <TooltipRow label="tokens Δ" value={formatSignedInt(pair.tokenDelta)} />
    </div>
  );
}

function TooltipRow({
  label,
  value,
  agree,
}: {
  label: string;
  value: string;
  agree?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className="text-[var(--color-fg-subtle)]">{label}</span>
      <span className="flex items-center gap-1.5 tabular-nums text-[var(--color-fg)]">
        {value}
        {agree != null && (
          <span
            style={{ color: agree ? "var(--color-bull)" : "var(--color-hold)" }}
          >
            {agree ? "✓" : "≠"}
          </span>
        )}
      </span>
    </div>
  );
}

/** The tooltip's judge word — engraved-chip anatomy (§8.5: dim fill, colored
 *  word, no border); unjudged stays plain graphite text. */
function JudgePref({ pref }: { pref: EvalPair["judgePreferred"] }) {
  if (pref == null) {
    return <span className="text-[var(--color-fg-subtle)]">unjudged</span>;
  }
  return (
    <span
      className="rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
      style={{ color: judgeColor(pref), background: judgeFill(pref) }}
    >
      {pref === "tie" ? "tie" : `prefers ${pref}`}
    </span>
  );
}
