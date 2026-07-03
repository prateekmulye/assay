/**
 * ExplorerSearch — "the lens" (DESIGN.md §8.17): the observatory's hero
 * instrument. One h-14 milled well (sunken --color-well fill, inverted inset
 * shadow) with a mono command line and a beam caret; focus turns the rim to
 * beam light. It drives BOTH lanes (instruments + research memory), so the
 * recruiter types once and the whole page reorganises (Fitts: large target,
 * top-of-fold). The page owns debouncing + the URL; this stays presentational.
 */
import { Search, X } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

export function ExplorerSearch({
  value,
  onChange,
  resultCount,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Optional live count for the aria status line (announced, not shown). */
  resultCount?: number;
}) {
  const inputId = useId();
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Search instruments and research memory
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--color-fg-subtle)]"
        aria-hidden="true"
      />
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search any ticker, company, or research memory — AAPL · Reliance · “tariff risk”"
        autoComplete="off"
        spellCheck={false}
        maxLength={256}
        className={cn(
          "h-14 w-full rounded-md pl-12 pr-12",
          "border bg-[var(--color-well)] shadow-[var(--shadow-well)]",
          "font-mono text-base font-medium text-[var(--color-fg)] [caret-color:var(--color-beam)]",
          "placeholder:font-normal placeholder:text-[var(--color-fg-subtle)]",
          "transition-[border-color,box-shadow] duration-[180ms] ease-[var(--ease-out)]",
          "focus:border-[var(--color-beam)] focus:shadow-[var(--shadow-glow-beam)] focus:outline-none",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-fg-subtle)] transition-colors duration-[100ms] after:absolute after:-inset-1.5 after:content-[''] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      {resultCount != null && (
        <span className="sr-only" role="status" aria-live="polite">
          {resultCount} {resultCount === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
}
