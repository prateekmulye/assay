/**
 * marketChips — the engraved-chip atoms (DESIGN.md §8.5) shared across the
 * explorer lanes and the dossier header: the exchange chip, the "watched"
 * indicator dot, and the kind chip (news | run) for research-memory hits.
 * Chip anatomy: --radius-sm, graphite fill, NO border (pills stay reserved for
 * LED lozenges); chroma appears only where it encodes state (watched = the
 * system has analyzed it = bull "done"), always backed by a word or label.
 */
import { Eye, FileText, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";

/** Exchange code in a graphite chip — the venue an instrument trades on. */
export function ExchangeChip({
  exchange,
  className,
}: {
  exchange: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-[var(--color-surface-2)] px-2 py-0.5",
        "font-mono text-2xs uppercase tracking-wide text-[var(--color-fg-subtle)]",
        className,
      )}
    >
      {exchange}
    </span>
  );
}

/**
 * WatchedDot — a small bull LED when an instrument is on the watchlist (the
 * system has analyzed it before, so data is backfilled). State color is backed
 * by an accessible label; no glow — emission is reserved for live computation
 * (§1 clause 2). The absent state is a hollow ring so the column still aligns.
 */
export function WatchedDot({ watched }: { watched: boolean }) {
  return (
    <span
      className="inline-flex size-2.5 shrink-0 items-center justify-center"
      role="img"
      aria-label={watched ? "On watchlist" : "Not watched"}
      title={watched ? "On watchlist" : "Not watched"}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          watched
            ? "bg-[var(--color-bull)]"
            : "border border-[var(--color-line-strong)]",
        )}
      />
    </span>
  );
}

/** kind chip for a research-memory hit — news (external) vs run (internal). */
export function KindChip({ kind }: { kind: "news" | "run" }) {
  const cfg =
    kind === "news"
      ? { Icon: Newspaper, label: "news" }
      : { Icon: FileText, label: "run" };
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-2xs lowercase tracking-wide text-[var(--color-fg-muted)]">
      <cfg.Icon className="size-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

/** "watched" word-chip for the dossier header (more legible than a bare dot). */
export function WatchedChip({ watched }: { watched: boolean }) {
  if (!watched) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-2xs lowercase tracking-wide"
      style={{
        color: "var(--color-bull)",
        background: "var(--color-bull-dim)",
      }}
    >
      <Eye className="size-3" aria-hidden="true" />
      watched
    </span>
  );
}
