/**
 * PricePanel — the lit specimen (§10-Market): the candles carry the page's
 * whole chroma budget, so the panel chrome around them is pure graphite —
 * kicker + segmented range keys (§8.4/§8.15), then the canvas. The price and
 * signed change live in the DossierHeader hero, not here (one statement of
 * chroma per fact). Range keys re-key the prices query by `days`; the switch
 * settles in 400ms --ease-out via the chart's own data transition. When a
 * ticker has no bars yet, the empty state is an outcome-oriented nudge
 * (§8.8): "Analyze {ticker} to backfill" — a rail key, since the header
 * already spends the view's one beam-filled key.
 */
import { CandlestickChart as ChartIcon, LineChart } from "lucide-react";
import { Link } from "react-router";

import { Button, buttonVariants } from "@/components/ui/button";
import { SegmentedKeys } from "@/features/library/SegmentedKeys";
import type { PriceBar } from "@/lib/api";
import { cn } from "@/lib/utils";

import { CandlestickChart } from "./CandlestickChart";
import { RANGE_OPTIONS, type RangeKey } from "./dossierRange";

const RANGE_KEY_OPTIONS = RANGE_OPTIONS.map(({ key, label }) => ({
  value: key,
  label,
}));

export function PricePanel({
  ticker,
  bars,
  range,
  onRange,
  isLoading,
  isError,
  onRetry,
  className,
}: {
  ticker: string;
  bars: PriceBar[];
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <section className={cn("panel space-y-4 p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="kicker">Daily price action</p>
        <SegmentedKeys
          options={RANGE_KEY_OPTIONS}
          value={range}
          onChange={onRange}
          layoutId="dossier-range-key"
          groupLabel="Chart range"
        />
      </div>

      {isLoading ? (
        <div
          className="animate-shimmer h-[340px] w-full rounded-md bg-[var(--color-surface-2)] sm:h-[420px]"
          aria-hidden="true"
        />
      ) : isError ? (
        <div className="well flex h-[340px] flex-col items-center justify-center gap-3 sm:h-[420px]">
          <LineChart
            className="size-6 text-[var(--color-fg-subtle)]"
            aria-hidden="true"
          />
          <p className="text-sm text-[var(--color-fg-muted)]">
            Couldn’t load price bars
          </p>
          <Button variant="panel" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : bars.length === 0 ? (
        <div className="well flex h-[340px] flex-col items-center justify-center gap-3 px-6 text-center sm:h-[420px]">
          <span className="flex size-12 items-center justify-center rounded-md bg-[var(--color-surface-2)] shadow-[inset_0_1px_0_0_var(--edge-light)]">
            <ChartIcon
              className="size-5 text-[var(--color-fg-subtle)]"
              aria-hidden="true"
            />
          </span>
          <div className="max-w-sm space-y-1">
            <p className="text-sm font-medium text-[var(--color-fg)]">
              No bars stored for {ticker} yet
            </p>
            <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
              Price history is backfilled when the analysts run. Analyze {ticker}{" "}
              live and its daily candles land here.
            </p>
          </div>
          <Link
            to="/"
            state={{ ticker }}
            className={cn(buttonVariants({ variant: "rail", size: "sm" }), "mt-1")}
          >
            Analyze {ticker} to backfill
          </Link>
        </div>
      ) : (
        <CandlestickChart bars={bars} />
      )}
    </section>
  );
}
