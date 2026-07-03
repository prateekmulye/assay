/**
 * DossierHeader — the instrument identity bar (Peak-End: the "who" and the
 * price are stated up front, above the dense panels). Left: mono ticker hero,
 * the human name, exchange/sector/country chips, the watched indicator.
 * Right: THE PRICE — last close in --text-5xl mono (§10-Market: the dossier
 * price is one of the two display steps in the app) with the signed change
 * over the visible range in its signal color (+ arrow glyph, §3.5), and the
 * "Analyze live" key that deep-links to / with the ticker prefilled.
 *
 * `instrument` may be null when the symbol resolved to bars but isn't in the
 * coverage list yet — the header still renders from the ticker alone. `bars`
 * feed the price block; while they load a same-size shimmer reserves the
 * space (no CLS, §9.3).
 */
import { ArrowLeft, Radio } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import type { Instrument, PriceBar } from "@/lib/api";
import { formatPercent } from "@/lib/utils";

import { ExchangeChip, WatchedChip } from "./marketChips";

function PriceBlock({
  bars,
  currency,
  isLoading,
}: {
  bars: PriceBar[];
  currency: string | null | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-start gap-2 sm:items-end"
        aria-hidden="true"
      >
        <span className="animate-shimmer h-3 w-24 rounded-sm bg-[var(--color-surface-2)]" />
        <span className="animate-shimmer h-12 w-44 rounded-sm bg-[var(--color-surface-2)] sm:h-[61px]" />
        <span className="animate-shimmer h-3 w-28 rounded-sm bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  const last = bars.length ? bars[bars.length - 1]!.close : null;
  const first = bars.length ? bars[0]!.close : null;
  if (last == null) return null;
  const frac = first ? (last - first) / first : null;
  const up = (frac ?? 0) >= 0;

  return (
    <div className="sm:text-right">
      <p className="kicker">Last close{currency ? ` · ${currency}` : ""}</p>
      <p className="mt-1 font-mono text-4xl font-[560] tabular-nums leading-none text-[var(--color-fg)] sm:text-5xl">
        {last.toFixed(2)}
      </p>
      {frac != null && (
        <p
          className="mt-2 font-mono text-xs font-medium tabular-nums"
          style={{ color: up ? "var(--color-bull)" : "var(--color-bear)" }}
        >
          <span aria-hidden="true">{up ? "▲" : "▼"}</span>{" "}
          {formatPercent(frac, { signed: true })}
          <span className="font-normal text-[var(--color-fg-subtle)]">
            {" "}
            over range
          </span>
        </p>
      )}
    </div>
  );
}

export function DossierHeader({
  ticker,
  exchange,
  instrument,
  bars = [],
  priceLoading = false,
}: {
  ticker: string;
  /** Exchange from the URL / resolved bars; falls back to the instrument's. */
  exchange?: string;
  instrument: Instrument | null;
  /** Bars for the visible range — drive the price hero. */
  bars?: PriceBar[];
  priceLoading?: boolean;
}) {
  const venue = exchange || instrument?.exchange;
  const meta = [instrument?.sector, instrument?.country].filter(Boolean);

  return (
    <div className="space-y-4">
      <Link
        to="/market"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors duration-[100ms] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to explorer
      </Link>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="kicker">Instrument dossier</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-[var(--color-fg)] sm:text-4xl">
              {ticker}
            </h1>
            {venue && <ExchangeChip exchange={venue} className="text-xs" />}
            {instrument?.watched && <WatchedChip watched />}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-fg-muted)]">
            <span className="font-medium text-[var(--color-fg)]">
              {instrument?.name ?? "Coverage instrument"}
            </span>
            {meta.length > 0 && (
              <span className="text-[var(--color-fg-subtle)]">
                · {meta.join(" · ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 sm:items-end">
          <PriceBlock
            bars={bars}
            currency={instrument?.currency}
            isLoading={priceLoading}
          />
          <Link
            to="/"
            state={{ ticker }}
            className={buttonVariants({ variant: "key", size: "md" })}
          >
            <Radio className="size-4" aria-hidden="true" />
            Analyze {ticker} live
          </Link>
        </div>
      </div>
    </div>
  );
}
