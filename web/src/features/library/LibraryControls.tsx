/**
 * LibraryControls — the ledger's command bar. The ticker filter is a milled
 * well (§8.4: sunken --color-well fill, inverted inset shadow, mono uppercase
 * display, beam caret + beam rim on focus); status is a segmented-keys control
 * (Fitts/Hick: one tap per filter, no dropdown) whose pressed key slides on
 * the shared-layout spring. The page owns debouncing + the URL; this stays
 * presentational.
 */
import { Search, X } from "lucide-react";
import { useId } from "react";

import { type RunStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

import { SegmentedKeys } from "./SegmentedKeys";

export type StatusFilter = "all" | RunStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "finished", label: "Finished" },
  { value: "error", label: "Error" },
  { value: "aborted", label: "Aborted" },
];

export function LibraryControls({
  ticker,
  onTicker,
  status,
  onStatus,
}: {
  ticker: string;
  onTicker: (v: string) => void;
  status: StatusFilter;
  onStatus: (v: StatusFilter) => void;
}) {
  const inputId = useId();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="sm:w-72">
        <label htmlFor={inputId} className="kicker mb-1.5 block">
          Filter ticker
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-fg-subtle)]"
            aria-hidden="true"
          />
          <input
            id={inputId}
            value={ticker}
            onChange={(e) => onTicker(e.target.value)}
            placeholder="AAPL · NVDA · 0700.HK"
            autoComplete="off"
            spellCheck={false}
            maxLength={15}
            className={cn(
              "h-11 w-full rounded-md pl-9 pr-9",
              "border bg-[var(--color-well)] shadow-[var(--shadow-well)]",
              "font-mono text-sm font-medium uppercase tracking-wide text-[var(--color-fg)] [caret-color:var(--color-beam)]",
              "placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--color-fg-subtle)]",
              "transition-[border-color,box-shadow] duration-[180ms] ease-[var(--ease-out)]",
              "focus:border-[var(--color-beam)] focus:shadow-[var(--shadow-glow-beam)] focus:outline-none",
            )}
          />
          {ticker && (
            <button
              type="button"
              onClick={() => onTicker("")}
              aria-label="Clear ticker filter"
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-fg-subtle)] transition-colors duration-[100ms] after:absolute after:-inset-1.5 after:content-[''] hover:text-[var(--color-fg)]"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <fieldset>
        <legend className="kicker mb-1.5">Status</legend>
        <SegmentedKeys
          options={STATUS_OPTIONS}
          value={status}
          onChange={onStatus}
          layoutId="library-status-key"
        />
      </fieldset>
    </div>
  );
}
