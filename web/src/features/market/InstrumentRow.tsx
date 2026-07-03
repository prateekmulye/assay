/**
 * InstrumentRow — one covered instrument as a ledger line in the coverage lane
 * (§10-Market mirror lanes: shared mono DNA with the research lane). The
 * watched LED + mono ticker lead, the human name + sector/country trail as
 * muted metadata on the same line. The whole row is the click target (Fitts)
 * and lifts toward the lamp on hover; it deep-links to the dossier at
 * /market/:ticker?exchange= — exchange threaded so a suffix-ambiguous symbol
 * resolves to the right venue.
 */
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import type { Instrument } from "@/lib/api";

import { ExchangeChip, WatchedDot } from "./marketChips";

export function InstrumentRow({ instrument }: { instrument: Instrument }) {
  const to = `/market/${encodeURIComponent(instrument.ticker)}${
    instrument.exchange
      ? `?exchange=${encodeURIComponent(instrument.exchange)}`
      : ""
  }`;
  const meta = [instrument.sector, instrument.country].filter(Boolean).join(" · ");

  return (
    <Link
      to={to}
      aria-label={`Open ${instrument.ticker} dossier${
        instrument.name ? ` — ${instrument.name}` : ""
      }`}
      className="group block focus-visible:outline-none"
    >
      <div className="panel flex min-h-14 items-center gap-3 overflow-hidden px-4 py-2 [transition:translate_var(--spring-press),box-shadow_180ms_var(--ease-out),background-color_180ms_var(--ease-out)] group-hover:-translate-y-0.5 group-hover:bg-[var(--color-surface-2)] group-hover:shadow-[var(--shadow-lifted)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--color-beam)]">
        <WatchedDot watched={instrument.watched} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium tracking-tight text-[var(--color-fg)]">
              {instrument.ticker}
            </span>
            <ExchangeChip exchange={instrument.exchange} />
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--color-fg-muted)]">
            {instrument.name ?? "—"}
            {meta && (
              <span className="text-[var(--color-fg-subtle)]"> · {meta}</span>
            )}
          </p>
        </div>

        <ChevronRight
          className="size-4 shrink-0 text-[var(--color-fg-subtle)] transition-[transform,color] duration-[180ms] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-[var(--color-fg)]"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
