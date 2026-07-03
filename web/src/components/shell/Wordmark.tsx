import { cn } from "@/lib/utils";

/**
 * Wordmark (DESIGN.md §8.1): "FinResearch" set tight at 600, with a trailing
 * 2×14px block cursor in the beam. The cursor is solid at rest and blinks
 * (1.1s, steps(2)) ONLY while the shell is data-live — the brand itself ties
 * to liveness. Both behaviors are pure CSS on `.wm-cursor`; reduced motion
 * keeps it static. Everything is graphite + beam: no chroma, no glyph costume.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className="text-[0.95rem] font-semibold tracking-tight">
        <span className="text-[var(--color-fg)]">Fin</span>
        <span className="text-[var(--color-fg-muted)]">Research</span>
      </span>
      <span
        aria-hidden="true"
        className="wm-cursor inline-block h-3.5 w-0.5 self-center bg-[var(--color-beam)]"
      />
    </span>
  );
}
