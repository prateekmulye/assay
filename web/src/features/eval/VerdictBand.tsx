/**
 * VerdictBand — the headline claim of the screen, as an asymmetric bento of
 * mono stat tiles (DESIGN.md §10 "the lab report"). The hero tile is the MEAN
 * SCORE DELTA — the debate's payoff — as a giant mono `--text-4xl` figure
 * tinted by OUTCOME UTILITY with a directional arrow (Functional Signal
 * Inversion, §3.5), isolated by size (2×2 in the bento — Von Restorff) and
 * breathing only while the freshest run is on screen. The six supporting tiles
 * carry the judge's read (honest "n/a" when nothing was refereed — never a
 * fake 0%), the agreement rates, and the debate's price (cost / latency /
 * tokens), each delta signal-inverted so cost-up reads as friction without
 * reading the label.
 *
 * `aria-live="polite"` on the band so a screen reader announces the verdict.
 */
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

import {
  type DeltaPolarity,
  type EvalSummary,
  deltaArrow,
  deltaTone,
  formatRate,
  formatSigned,
  formatSignedInt,
  formatSignedSeconds,
  formatSignedUsd,
  toneColor,
} from "./evalFormat";

export function VerdictBand({
  summary,
  fresh = false,
}: {
  summary: EvalSummary;
  /** True when this band shows the newest stored run — only a fresh feed
   *  breathes (§6.3-5); a deep-linked archive run sits still. */
  fresh?: boolean;
}) {
  const reduced = useReducedMotion();
  const heroTone = deltaTone(summary.meanScoreDelta, "more-is-better");
  const heroDir = deltaArrow(summary.meanScoreDelta);
  const HeroArrow =
    heroDir === "up" ? ArrowUpRight : heroDir === "down" ? ArrowDownRight : Minus;

  return (
    <section
      aria-label="Debate-on versus debate-off verdict"
      aria-live="polite"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
    >
      {/* HERO — the debate's payoff: mean conviction shift, on − off. Spans
          2×2 so lg's 5-col bento fills exactly with the six supporting tiles. */}
      <div
        className={cn(
          "panel-raised relative col-span-2 flex flex-col justify-between overflow-hidden p-5 lg:row-span-2",
          fresh && !reduced && "animate-breathe-tile",
        )}
      >
        <p className="kicker">Mean score Δ</p>

        {summary.meanScoreDelta != null ? (
          <div className="mt-4">
            <p
              className="flex items-center gap-2 font-mono text-4xl leading-none tabular-nums [font-weight:560]"
              style={{ color: toneColor(heroTone) }}
            >
              <HeroArrow className="size-7 shrink-0" aria-hidden="true" />
              {formatSigned(summary.meanScoreDelta)}
            </p>
            <p className="mt-3 max-w-[28ch] text-xs leading-relaxed text-[var(--color-fg-muted)]">
              conviction score, debate on − off
              {summary.scoreDeltaStdev != null && (
                <> · ±{summary.scoreDeltaStdev.toFixed(1)} σ</>
              )}{" "}
              across {summary.nTickers}{" "}
              {summary.nTickers === 1 ? "ticker" : "tickers"}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="font-mono text-4xl leading-none tabular-nums text-[var(--color-fg-subtle)] [font-weight:560]">
              —
            </p>
            <p className="mt-3 max-w-[28ch] text-xs leading-relaxed text-[var(--color-fg-muted)]">
              this run recorded no paired conviction scores, so the debate&rsquo;s
              payoff can&rsquo;t be measured.
            </p>
          </div>
        )}
      </div>

      {/* Judge tiles — honest "n/a" when nothing was refereed (§10). */}
      <RateTile
        label="Judge prefers debate"
        rate={summary.judgePrefersOnRate}
        na={!summary.judged}
        hint={
          summary.judged
            ? `of ${summary.nJudged} refereed ${
                summary.nJudged === 1 ? "ticker" : "tickers"
              }, the deep-model judge picked the debate pipeline`
            : "no verdicts were refereed in this run — the judge was skipped or unavailable"
        }
      />
      <RateTile
        label="Judge agreement"
        rate={summary.judgeAgreementRate}
        na={!summary.judged}
        hint={summary.judged ? "referee concurred with the call" : "no verdicts judged"}
      />
      <RateTile
        label="Action agreement"
        rate={summary.actionAgreementRate}
        hint="on vs off picked the same verdict"
      />

      {/* The debate's price — signed deltas, Functional Signal Inversion. */}
      <DeltaTile
        label="Mean cost Δ"
        value={summary.meanCostDelta}
        polarity="less-is-better"
        format={formatSignedUsd}
        hint="the debate's price, on − off"
      />
      <DeltaTile
        label="Mean latency Δ"
        value={summary.meanLatencyDelta}
        polarity="less-is-better"
        format={formatSignedSeconds}
        hint="wall-clock, on − off"
      />
      <DeltaTile
        label="Mean token Δ"
        value={summary.meanTokenDelta}
        polarity="less-is-better"
        format={formatSignedInt}
        hint="tokens spent, on − off"
      />
    </section>
  );
}

/** A neutral 0..1 rate tile (no good/bad polarity — agreement isn't a win or a
 *  loss, it's context). `na` distinguishes "not applicable" (nothing judged →
 *  honest "n/a") from "no data recorded" (—). */
function RateTile({
  label,
  rate,
  hint,
  na = false,
}: {
  label: string;
  rate: number | null;
  hint: string;
  na?: boolean;
}) {
  return (
    <div className="panel flex flex-col justify-between p-4">
      <p className="kicker">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-medium leading-none tabular-nums",
          rate == null ? "text-[var(--color-fg-subtle)]" : "text-[var(--color-fg)]",
        )}
      >
        {rate == null ? (na ? "n/a" : "—") : formatRate(rate)}
      </p>
      <p className="mt-2 text-2xs leading-snug text-[var(--color-fg-subtle)]">
        {hint}
      </p>
    </div>
  );
}

/** A signed-delta tile with Functional Signal Inversion: the value AND its arrow
 *  are tinted by outcome utility (green=helps, amber=friction). */
function DeltaTile({
  label,
  value,
  polarity,
  format,
  hint,
}: {
  label: string;
  value: number | null;
  polarity: DeltaPolarity;
  format: (v: number) => string;
  hint: string;
}) {
  const tone = deltaTone(value, polarity);
  const color = toneColor(tone);
  const dir = deltaArrow(value);
  const Arrow = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;

  return (
    <div className="panel flex flex-col justify-between p-4">
      <p className="kicker">{label}</p>
      <p
        className="mt-2 flex items-center gap-1 font-mono text-2xl font-medium leading-none tabular-nums"
        style={{ color: value == null ? "var(--color-fg-subtle)" : color }}
      >
        <Arrow className="size-4 shrink-0" aria-hidden="true" />
        {value == null ? "—" : format(value)}
      </p>
      <p className="mt-2 text-2xs leading-snug text-[var(--color-fg-subtle)]">
        {hint}
      </p>
    </div>
  );
}
