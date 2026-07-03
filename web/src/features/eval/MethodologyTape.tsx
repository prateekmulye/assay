/**
 * MethodologyTape — the portfolio's credibility signature, by design.
 *
 * The brief mandates the PROXY honesty cue ride prominently. The trap is making
 * it read as an error/warning (amber alarm), which triggers anxiety instead of
 * trust. v3 (§10) re-tones it from the old azure info-banner to CONFIDENT
 * GRAPHITE PAPER: a hairline-framed strip (rules above and below — §2.5, never
 * a box), a mono "JUDGE-PROXY · METHODOLOGY" kicker, fg-muted body, and a beam
 * lit tick on the left edge — the same light language as the bench rule. The
 * full caveat stays behind an Onion-Peel collapsible so the detail is there for
 * the skeptic without taxing the casual reader.
 */
import { FlaskConical } from "lucide-react";
import { useId, useState } from "react";

import { PROXY_BODY, PROXY_HEADLINE } from "./evalFormat";

export function MethodologyTape() {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div
      className="relative border-y py-3 pl-4 pr-1 sm:pl-5"
      role="note"
      aria-label="Methodology and honesty disclaimer"
    >
      {/* The lit tick — a short beam segment on the left edge (confident
          paper, not a warning). Static light: it marks, it doesn't glow-loop. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-1/2 h-6 w-[2px] -translate-y-1/2 bg-[var(--color-beam)] shadow-[0_0_8px_0_var(--color-beam-dim)]"
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] shadow-[inset_0_1px_0_0_var(--edge-light)]">
          <FlaskConical className="size-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="kicker">Judge-proxy · methodology</p>
          <p className="mt-1 text-sm font-medium leading-snug text-[var(--color-fg)]">
            {PROXY_HEADLINE}
          </p>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={bodyId}
            className="mt-1.5 font-mono text-2xs tracking-wide text-[var(--color-fg-muted)] underline-offset-2 transition-colors hover:text-[var(--color-fg)] hover:underline"
          >
            {open ? "− what this measures" : "+ what this measures (and what it doesn't)"}
          </button>

          {open && (
            <p
              id={bodyId}
              className="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--color-fg-muted)]"
            >
              {PROXY_BODY}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
