/**
 * judgeChrome — the shared visual DNA of the A/B comparison: how a judge
 * preference is colored, everywhere it appears (scatter points, table chips,
 * the legend). Kept as a pure `.ts` so both the chart and the table import it
 * without tripping react-refresh (components live in JudgeBadges.tsx).
 *
 * The mapping IS the A/B legend (DESIGN.md §3.5), and its one deliberate move
 * is that the ablation winning is INFORMATIVE, never negative:
 *   on  → bull green      (the debate earns its keep)
 *   off → conservative    (the baseline won — a finding, NOT a failure; bear
 *                          would read "the product broke", which is a lie)
 *   tie → fg-subtle       (a wash speaks in graphite, not chroma)
 *   null→ hollow          (never refereed: 1px line-strong stroke, no fill)
 */
import type { JudgePreferred } from "./evalFormat";

export function judgeColor(pref: JudgePreferred): string {
  switch (pref) {
    case "on":
      return "var(--color-bull)";
    case "off":
      return "var(--color-conservative)";
    case "tie":
      return "var(--color-fg-subtle)";
    default:
      return "var(--color-fg-subtle)";
  }
}

/** The engraved-chip fill (§8.5 dim fills) behind a judge word. Unjudged is
 *  hollow — no fill at all; the 1px line-strong stroke is applied call-side. */
export function judgeFill(pref: JudgePreferred): string {
  switch (pref) {
    case "on":
      return "var(--color-bull-dim)";
    case "off":
      return "var(--color-conservative-dim)";
    case "tie":
      return "var(--color-surface-2)";
    default:
      return "transparent";
  }
}

/** The human label for a preference, used in chips and aria. */
export function judgeLabel(pref: JudgePreferred): string {
  switch (pref) {
    case "on":
      return "prefers debate";
    case "off":
      return "prefers baseline";
    case "tie":
      return "tie";
    default:
      return "unjudged";
  }
}
