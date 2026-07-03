/**
 * PairTable — the receipts. One milled panel; every ticker is a dense row
 * separated by hairline RULES only (§8.14: no vertical rules, no cell boxes —
 * borders-as-containment are abolished). Reading order per row: ticker ·
 * verdict (on → off SignalBadge pair + an agree/diverge cue) · score Δ
 * (right-aligned mono) · the cost/latency/token delta tape (each tinted by
 * OUTCOME UTILITY) · the judge preference chip with confidence. Row hover is a
 * luminance lift (surface-1 → surface-2, 150ms), never a border.
 *
 * Sortable by score delta or cost delta (client-side, two keys) — the two
 * questions a skeptic asks: "where did it decide better?" and "where did it
 * cost more?". Sortable headers are real buttons; the SORTED column carries a
 * 2px beam filament under its header + an arrow glyph (§8.14). On mobile the
 * row stacks; on wide screens it's a single scan line.
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { SignalBadge } from "@/components/ui/signal-badge";
import { cn } from "@/lib/utils";

import {
  type EvalPair,
  deltaTone,
  formatSignedInt,
  formatSignedSeconds,
  formatSignedUsd,
  toneColor,
} from "./evalFormat";
import { JudgePrefChip } from "./JudgeBadges";
import { type SortKey, type SortState, nextSort, sortPairs } from "./pairSort";

const GRID_COLS = "lg:grid-cols-[7rem_minmax(9rem,1fr)_7rem_1fr_8rem]";

export function PairTable({ pairs }: { pairs: EvalPair[] }) {
  const [sort, setSort] = useState<SortState>({ key: "scoreDelta", dir: "desc" });
  const rows = useMemo(() => sortPairs(pairs, sort), [pairs, sort]);

  return (
    <div className="panel overflow-hidden p-0">
      {/* Column rail (lg+; rows stack with inline labels on mobile). th =
          kicker style; the sorted column's beam filament sits ON the hairline. */}
      <div
        className={cn(
          "hidden h-9 items-stretch gap-4 border-b px-4 font-mono text-2xs uppercase tracking-[0.14em] text-[var(--color-fg-subtle)] lg:grid",
          GRID_COLS,
        )}
      >
        <SortButton label="Ticker" col="ticker" sort={sort} onSort={setSort} />
        <span className="self-center">verdict on → off</span>
        <span className="flex justify-end">
          <SortButton label="Score Δ" col="scoreDelta" sort={sort} onSort={setSort} />
        </span>
        <span className="flex items-center gap-1">
          <SortButton label="Cost Δ" col="costDelta" sort={sort} onSort={setSort} />
          <span>· lat · tok</span>
        </span>
        <span className="self-center text-right">judge</span>
      </div>

      <ul className="divide-y">
        {rows.map((pair) => (
          <li key={pair.ticker}>
            <Row pair={pair} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SortButton({
  label,
  col,
  sort,
  onSort,
}: {
  label: string;
  col: SortKey;
  sort: SortState;
  onSort: (s: SortState) => void;
}) {
  const active = sort.key === col;
  const Icon = !active ? ArrowUpDown : sort.dir === "desc" ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={() => onSort(nextSort(sort, col))}
      aria-label={`Sort by ${label}${active ? `, ${sort.dir}ending` : ""}`}
      className={cn(
        "relative inline-flex h-full items-center gap-1 uppercase tracking-[0.14em] transition-colors duration-[150ms] hover:text-[var(--color-fg)]",
        // 44px hit area on a visually 36px control (§8 global rule).
        "after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        active ? "text-[var(--color-fg)]" : "text-[var(--color-fg-subtle)]",
      )}
    >
      {label}
      <Icon className="size-3" aria-hidden="true" />
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-beam)]"
        />
      )}
    </button>
  );
}

function Row({ pair }: { pair: EvalPair }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 p-4 transition-colors duration-[150ms] hover:bg-[var(--color-surface-2)] lg:min-h-11 lg:items-center lg:gap-4 lg:py-2",
        GRID_COLS,
      )}
    >
      {/* Ticker. NB: no `text-base` here — the theme's `--color-base` shadows
          Tailwind's text-base font-size utility into `color: base` (near-black);
          the body default is already 16px. */}
      <span className="font-mono tracking-tight text-[var(--color-fg)] [font-weight:550]">
        {pair.ticker}
      </span>

      {/* Verdict on → off */}
      <div className="flex items-center gap-2">
        <Verdict action={pair.actionOn} score={pair.scoreOn} />
        <span
          aria-hidden="true"
          className="font-mono text-2xs"
          style={{
            color: pair.actionsAgree
              ? "var(--color-fg-subtle)"
              : "var(--color-hold)",
          }}
          title={pair.actionsAgree ? "verdicts agree" : "verdicts diverge"}
        >
          {pair.actionsAgree ? "→" : "≠"}
        </span>
        {/* The glyph is aria-hidden and a title isn't reliably exposed — the
            agree/diverge judgement must also exist as text. */}
        <span className="sr-only">
          {pair.actionsAgree ? "verdicts agree" : "verdicts diverge"}
        </span>
        <Verdict action={pair.actionOff} score={pair.scoreOff} muted />
      </div>

      {/* Score delta — numerics right-aligned on the scan line (§8.14). */}
      <div className="flex items-center gap-2 lg:justify-end">
        <LabelMobile>score Δ</LabelMobile>
        <ScoreDelta value={pair.scoreDelta} />
      </div>

      {/* Cost / latency / tokens delta tape */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs tabular-nums">
        <DeltaCell
          label="cost"
          value={pair.costDelta}
          polarity="less-is-better"
          fmt={formatSignedUsd}
        />
        <DeltaCell
          label="lat"
          value={pair.latencyDelta}
          polarity="less-is-better"
          fmt={formatSignedSeconds}
        />
        <DeltaCell
          label="tok"
          value={pair.tokenDelta}
          polarity="less-is-better"
          fmt={formatSignedInt}
        />
      </div>

      {/* Judge */}
      <div className="flex items-center gap-2 lg:justify-end">
        <LabelMobile>judge</LabelMobile>
        <JudgePrefChip pref={pair.judgePreferred} confidence={pair.judgeConfidence} />
      </div>
    </div>
  );
}

function Verdict({
  action,
  score,
  muted,
}: {
  action: EvalPair["actionOn"];
  score: number | null;
  muted?: boolean;
}) {
  if (!action) {
    return (
      <span className="px-1 font-mono text-2xs text-[var(--color-fg-subtle)]">
        —
      </span>
    );
  }
  return (
    <span className={muted ? "opacity-60" : undefined}>
      <SignalBadge action={action} score={score ?? undefined} size="sm" />
    </span>
  );
}

function ScoreDelta({ value }: { value: number | null }) {
  const tone = deltaTone(value, "more-is-better");
  return (
    <span
      className="font-mono text-sm font-medium tabular-nums"
      style={{ color: value == null ? "var(--color-fg-subtle)" : toneColor(tone) }}
    >
      {value == null ? "—" : value > 0 ? `+${value}` : `${value}`}
    </span>
  );
}

function DeltaCell({
  label,
  value,
  polarity,
  fmt,
}: {
  label: string;
  value: number | null;
  polarity: "less-is-better";
  fmt: (v: number | null) => string;
}) {
  const tone = deltaTone(value, polarity);
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
        {label}
      </span>
      <span style={{ color: value == null ? "var(--color-fg-subtle)" : toneColor(tone) }}>
        {fmt(value)}
      </span>
    </span>
  );
}

/** A mobile-only inline label (the column rail is hidden under lg). */
function LabelMobile({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)] lg:hidden">
      {children}
    </span>
  );
}
