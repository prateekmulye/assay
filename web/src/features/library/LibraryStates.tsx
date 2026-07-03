/**
 * LibraryStates — the loading skeleton, the pager, and the quota banner. The
 * library page composes these so its render stays a thin state machine.
 */
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shimmer placeholder rows matching the h-14 ledger-line silhouette (§6.3-6:
 *  a luminance sweep, never opacity-pulse; flat surface under reduced motion). */
export function LibrarySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="panel animate-shimmer flex h-14 items-center gap-4 overflow-hidden px-4"
        >
          <span className="h-5 w-24 shrink-0 rounded-sm bg-[var(--color-surface-3)]" />
          <span className="h-4 w-16 rounded-sm bg-[var(--color-surface-3)]" />
          <span className="h-[3px] w-20 rounded-full bg-[var(--color-surface-3)]" />
          <span className="ml-auto h-3 w-44 rounded-sm bg-[var(--color-surface-3)]" />
        </li>
      ))}
    </ul>
  );
}

/**
 * LibraryPager — Prev/Next over an offset window with a mono "N–M of T"
 * readout. Disabled states gate the edges; the page owns offset math.
 * (DOM shape note: the readout <p> and the button cluster share one row div —
 * the page test reads the readout through that structure.)
 */
export function LibraryPager({
  offset,
  pageSize,
  total,
  onPrev,
  onNext,
  isFetching,
}: {
  offset: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  isFetching?: boolean;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);
  const hasPrev = offset > 0;
  const hasNext = to < total;

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
        {from}
        <span className="px-0.5">–</span>
        {to}
        <span className="px-1">of</span>
        {total}
        {isFetching && (
          <span className="ml-2 text-[var(--color-beam)]">· updating</span>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="rail"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev || isFetching}
        >
          <ChevronLeft />
          Prev
        </Button>
        <Button
          variant="rail"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || isFetching}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/**
 * QuotaExhaustedBanner — when live runs are spent, the library reframes itself
 * as the place to GO (not a dead end). State speaks as a 2px hold filament on
 * a graphite panel (borders-as-containment are abolished, §2.5); the glyph +
 * words carry the meaning with the color.
 */
export function QuotaExhaustedBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "panel relative flex items-start gap-3 overflow-hidden px-5 py-4",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] bg-[var(--color-hold)]"
      />
      <Clapperboard
        className="mt-0.5 size-5 shrink-0 text-[var(--color-hold)]"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-[var(--color-fg)]">
          Live runs exhausted for today — explore replays
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-fg-muted)]">
          Every run below replays the full agent stream exactly as it happened,
          no quota required. Open one and scrub the timeline.
        </p>
      </div>
    </div>
  );
}
