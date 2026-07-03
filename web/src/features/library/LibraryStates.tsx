/**
 * LibraryStates — the loading skeleton, the pager, and the quota banner. The
 * library page composes these so its render stays a thin state machine.
 */
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Glass-shimmer placeholder rows that match the LibraryRow silhouette. */
export function LibrarySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="panel animate-shimmer flex items-center gap-5 overflow-hidden rounded-lg py-4 pl-5 pr-4"
        >
          <span className="h-6 w-20 shrink-0 rounded-full bg-[var(--color-surface-3)]" />
          <span className="h-5 w-16 rounded bg-[var(--color-surface-3)]" />
          <span className="h-1.5 w-16 rounded-full bg-[var(--color-surface-3)]" />
          <span className="ml-auto h-3 w-40 rounded bg-[var(--color-surface-3)]" />
        </li>
      ))}
    </ul>
  );
}

/**
 * LibraryPager — Prev/Next over an offset window with a mono "N–M of T"
 * readout. Disabled states gate the edges; the page owns offset math.
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
        <span className="px-0.5 text-[var(--color-fg-subtle)]">–</span>
        {to}
        <span className="px-1 text-[var(--color-fg-subtle)]">of</span>
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
 * as the place to GO (not a dead end). Amber (hold/replay) tint per DESIGN.md.
 */
export function QuotaExhaustedBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-5 py-4",
        className,
      )}
      style={{
        borderColor: "var(--color-hold)",
        background: "var(--color-hold-dim)",
      }}
    >
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
