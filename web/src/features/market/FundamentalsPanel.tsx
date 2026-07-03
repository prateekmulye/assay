/**
 * FundamentalsPanel — the latest snapshot as a borderless mono metric tape
 * (§8.14: row hairlines only, kicker labels left, tabular values right, h-11
 * rows). Growth and margin follow Functional Signal Inversion (§3.5): the
 * sign is colored by outcome utility AND paired with a directional arrow
 * glyph — never color alone. A snapshot timestamp grounds the data in time.
 * Missing snapshot → an outcome-oriented empty state, not a dead "no data".
 */
import { Gauge } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import type { Fundamentals } from "@/lib/api";
import {
  cn,
  formatCompactUsd,
  formatPercent,
  formatRatio,
  formatRelativeTime,
} from "@/lib/utils";

function TapeRow({
  label,
  value,
  signed,
}: {
  label: string;
  value: string;
  /** Signed fraction for Functional Inversion tint + arrow; omit for neutral. */
  signed?: number | null;
}) {
  const tinted = signed != null && signed !== 0;
  const up = (signed ?? 0) > 0;
  return (
    <div className="flex h-11 items-center justify-between gap-4 border-b last:border-b-0">
      <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-[var(--color-fg-subtle)]">
        {label}
      </dt>
      <dd
        className="flex items-baseline gap-1.5 font-mono text-sm font-medium tabular-nums"
        style={{
          color: tinted
            ? up
              ? "var(--color-bull)"
              : "var(--color-bear)"
            : "var(--color-fg)",
        }}
      >
        {tinted && <span aria-hidden="true">{up ? "▲" : "▼"}</span>}
        <span>{value}</span>
      </dd>
    </div>
  );
}

export function FundamentalsPanel({
  ticker,
  data,
  isLoading,
  notFound,
  className,
}: {
  ticker: string;
  data: Fundamentals | null;
  isLoading: boolean;
  /** A 404 (no snapshot) is the expected empty path, not an error. */
  notFound: boolean;
  className?: string;
}) {
  return (
    <section className={cn("panel space-y-3 p-5 sm:p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="kicker flex items-center gap-2">
          <Gauge className="size-3.5" aria-hidden="true" />
          Fundamentals
        </p>
        {data && (
          <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
            snapshot {formatRelativeTime(data.ts)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-1.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-shimmer h-9 rounded-sm bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
      ) : notFound || !data ? (
        <div className="flex flex-col items-center gap-2.5 px-5 py-8 text-center">
          <span className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1 rounded-full bg-[var(--color-fg-subtle)] opacity-30"
              />
            ))}
          </span>
          <p className="text-sm font-medium text-[var(--color-fg)]">
            No fundamentals snapshot yet
          </p>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--color-fg-muted)]">
            The fundamentals analyst captures P/E, EPS, growth, and margins on
            its first run over {ticker}.
          </p>
          <Link
            to="/"
            state={{ ticker }}
            className={cn(buttonVariants({ variant: "rail", size: "sm" }), "mt-1")}
          >
            Analyze {ticker}
          </Link>
        </div>
      ) : (
        <dl>
          <TapeRow label="Market cap" value={formatCompactUsd(data.market_cap)} />
          <TapeRow label="P / E" value={formatRatio(data.pe_ratio)} />
          <TapeRow label="EPS" value={formatRatio(data.eps)} />
          <TapeRow
            label="Rev growth"
            value={formatPercent(data.revenue_growth, { signed: true })}
            signed={data.revenue_growth}
          />
          <TapeRow
            label="Profit margin"
            value={formatPercent(data.profit_margin, { signed: true })}
            signed={data.profit_margin}
          />
        </dl>
      )}
    </section>
  );
}
