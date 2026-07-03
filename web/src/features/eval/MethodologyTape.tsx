/**
 * MethodologyTape — the portfolio's credibility signature, by design.
 *
 * The brief mandates the PROXY honesty cue ride prominently. The trap is making
 * it read as an error/warning (amber alarm), which triggers anxiety instead of
 * trust (NotebookLM). So this is framed as a confident "methodology note": a
 * flask glyph, a graphite tape with a beam lit tick (confident paper, not a
 * banner), a one-line headline, and the full caveat in a collapsible —
 * Onion-Peel disclosure so the detail is there for the skeptic without taxing
 * the casual reader.
 */
import { FlaskConical } from "lucide-react";
import { useId, useState } from "react";

import { PROXY_BODY, PROXY_HEADLINE } from "./evalFormat";

export function MethodologyTape() {
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <div
      className="grain panel relative overflow-hidden px-4 py-3"
      role="note"
      aria-label="Methodology and honesty disclaimer"
    >
      {/* Confident paper, not warning (v3 §10): graphite tape + a beam lit
          tick on the left edge — the same light language as the bench rule. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-0 w-[2px] bg-[var(--color-beam)] shadow-[0_0_8px_0_var(--color-beam-dim)]"
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]">
          <FlaskConical className="size-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-2xs font-medium uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
            Methodology
          </p>
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
