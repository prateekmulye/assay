/**
 * ExplorerStates — the lane chrome and its loading/empty states, plus the
 * search-mode honesty chips and the coverage stats strip. The page composes
 * these so its render stays a thin state machine (mirrors LibraryStates).
 */
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

/** A lane heading: the mono kicker + a tabular count of what's in the lane. */
export function LaneHeader({
  kicker,
  count,
}: {
  kicker: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="kicker">{kicker}</h2>
      {count != null && (
        <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
          {count}
        </span>
      )}
    </div>
  );
}

/** Shimmer placeholders matching the explorer row silhouette (§6.3-6). */
export function LaneSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="panel animate-shimmer flex h-14 items-center gap-3 overflow-hidden px-4"
        >
          <span className="size-2 shrink-0 rounded-full bg-[var(--color-surface-3)]" />
          <span className="h-4 w-20 rounded-sm bg-[var(--color-surface-3)]" />
          <span className="ml-auto h-3 w-32 rounded-sm bg-[var(--color-surface-3)]" />
        </li>
      ))}
    </ul>
  );
}

/**
 * A compact, in-lane empty/error notice. Decoration is the instrument at
 * rest — three 4px unlit LEDs (§8.8), never a spot illustration. The icon
 * prop is accepted for call-site compatibility but not rendered.
 */
export function LaneNotice({
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-2.5 px-5 py-8 text-center">
      <span className="flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-[var(--color-fg-subtle)] opacity-30"
          />
        ))}
      </span>
      <p className="text-sm font-medium text-[var(--color-fg)]">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-[var(--color-fg-muted)]">
        {description}
      </p>
      {children}
    </div>
  );
}

/**
 * KeywordModeChip — the honesty cue (§8.17). When /api/search answers in
 * "keyword" mode the semantic index was unavailable, so a hold LED says so
 * plainly rather than passing keyword hits off as semantic.
 */
export function KeywordModeChip() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-hold-dim)] px-2.5 py-1"
      role="status"
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-[var(--color-hold)]"
        aria-hidden="true"
      />
      <p className="font-mono text-2xs tracking-wide text-[var(--color-fg-muted)]">
        <span className="font-medium text-[var(--color-hold)]">
          keyword fallback
        </span>{" "}
        · semantic index offline — matching on text, not meaning
      </p>
    </div>
  );
}

/** SemanticModeChip — the quiet counterpart: pgvector answered in meaning. */
export function SemanticModeChip() {
  return (
    <div className="inline-flex items-center gap-2 rounded-sm bg-[var(--color-surface-2)] px-2.5 py-1">
      <span
        className="size-1.5 shrink-0 rounded-full bg-[var(--color-fg-subtle)]"
        aria-hidden="true"
      />
      <p className="font-mono text-2xs tracking-wide text-[var(--color-fg-subtle)]">
        semantic · pgvector
      </p>
    </div>
  );
}

/** Pre-search hint for the research lane (before the user types). */
export function ResearchLanePrompt() {
  return (
    <LaneNotice
      title="Search the system’s memory"
      description="Type a theme, ticker, or thesis to surface the news the analysts ingested and the past runs that reasoned over it."
    />
  );
}

/* ----------------------------------------------------------- coverage strip */

/**
 * CoverageStrip — three terminal stat tiles derived from the default
 * instruments fetch (shown only when there's no query). Honest by construction:
 * the counts describe the *fetched page*, not the whole universe, so the
 * footnote says "top N shown" — never an inflated total the backend didn't
 * promise. Values stay ivory: a count is information, not state (§1 clause 1).
 */
export function CoverageStrip({
  instruments,
  watched,
  exchanges,
  capped,
}: {
  instruments: number;
  watched: number;
  exchanges: number;
  /** True when the fetch hit its limit, so counts are a floor, not a total. */
  capped: boolean;
}) {
  return (
    <div>
      <dl className="grid grid-cols-3 gap-2">
        <CoverageStat
          label="Instruments"
          value={instruments}
          hint={capped ? "top shown" : "covered"}
        />
        <CoverageStat label="Watched" value={watched} hint="analyzed" />
        <CoverageStat label="Exchanges" value={exchanges} hint="venues" />
      </dl>
      {capped && (
        <p className="mt-2 px-1 font-mono text-2xs text-[var(--color-fg-subtle)]">
          Showing the top {instruments} instruments — search to reach the rest.
        </p>
      )}
    </div>
  );
}

function CoverageStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="terminal-tile px-4 py-3">
      <dt className="text-2xs uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-medium tabular-nums leading-none text-[var(--color-fg)]">
        {value.toLocaleString("en-US")}
      </dd>
      <dd className="mt-1 text-2xs text-[var(--color-fg-subtle)]">{hint}</dd>
    </div>
  );
}
