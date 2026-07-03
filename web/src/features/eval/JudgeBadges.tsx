/**
 * JudgeBadges — the A/B legend and the per-pair judge chip. Both read their
 * color from judgeChrome.ts so the scatter, the legend, and the table speak one
 * visual language (Gestalt similarity). The legend is what makes "debate ON vs
 * OFF" instantly legible to a recruiter who's never seen the repo.
 *
 * v3 (§3.5): swatches are flat state chroma — no glow (emission is reserved for
 * interaction/liveness, One Rule clause 2). Unjudged is a HOLLOW swatch: 1px
 * line-strong stroke, no fill — absence of a verdict looks like absence.
 */
import { cn } from "@/lib/utils";

import type { JudgePreferred } from "./evalFormat";
import { judgeColor, judgeFill, judgeLabel } from "./judgeChrome";

/** A swatch + caption explaining what each scatter-point color means. */
export function JudgeLegend() {
  const items: { pref: JudgePreferred; caption: string }[] = [
    { pref: "on", caption: "judge prefers debate" },
    { pref: "off", caption: "judge prefers baseline" },
    { pref: "tie", caption: "tie / wash" },
    { pref: null, caption: "not refereed" },
  ];
  return (
    <ul
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      aria-label="Legend: scatter point color by judge preference"
    >
      {items.map((it) => (
        <li
          key={it.caption}
          className="flex items-center gap-1.5 font-mono text-2xs text-[var(--color-fg-muted)]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-full",
              it.pref == null && "border border-[var(--color-line-strong)]",
            )}
            style={
              it.pref != null ? { background: judgeColor(it.pref) } : undefined
            }
          />
          {it.caption}
        </li>
      ))}
    </ul>
  );
}

/** The per-pair judge-preference chip (table cell). Engraved-chip anatomy
 *  (§8.5): dim fill, colored WORD, no border — except unjudged, which is the
 *  §3.5 hollow chip (1px line-strong stroke, no fill). Color never alone. */
export function JudgePrefChip({
  pref,
  confidence,
}: {
  pref: JudgePreferred;
  confidence: number | null;
}) {
  const word =
    pref === "on" ? "on" : pref === "off" ? "off" : pref === "tie" ? "tie" : "—";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-2xs uppercase tracking-[0.14em]",
        pref == null && "border border-[var(--color-line-strong)]",
      )}
      style={{
        color: pref ? judgeColor(pref) : "var(--color-fg-subtle)",
        background: judgeFill(pref),
      }}
      aria-label={judgeLabel(pref)}
    >
      <span aria-hidden="true">{word}</span>
      {confidence != null && (
        <span className="tabular-nums tracking-normal text-[var(--color-fg-subtle)]">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
}
