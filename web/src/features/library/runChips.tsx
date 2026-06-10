/**
 * runChips — the small, reusable terminal-tile atoms shared by the library row
 * and the replay dossier header: status chip, debate on/off chip, and the
 * conviction micro-bar. Kept in one file so a recruiter sees consistent run
 * metadata everywhere a run is summarised. Signal color is always backed by a
 * word (never color alone) per DESIGN.md §2.
 */
import { CircleCheck, CircleSlash, OctagonX } from "lucide-react";

import { cn } from "@/lib/utils";

/** finished -> healthy green · error -> bear red · aborted -> amber hold. */
const STATUS_CFG: Record<
  string,
  { tint: string; dim: string; Icon: typeof CircleCheck; label: string }
> = {
  finished: {
    tint: "var(--color-bull)",
    dim: "var(--color-bull-dim)",
    Icon: CircleCheck,
    label: "finished",
  },
  error: {
    tint: "var(--color-bear)",
    dim: "var(--color-bear-dim)",
    Icon: OctagonX,
    label: "error",
  },
  aborted: {
    tint: "var(--color-hold)",
    dim: "var(--color-hold-dim)",
    Icon: CircleSlash,
    label: "aborted",
  },
  running: {
    tint: "var(--color-accent)",
    dim: "var(--color-glass)",
    Icon: CircleCheck,
    label: "running",
  },
};

export function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? {
    tint: "var(--color-fg-subtle)",
    dim: "var(--color-glass)",
    Icon: CircleSlash,
    label: status,
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-2xs font-medium lowercase tracking-wide"
      style={{ color: cfg.tint, background: cfg.dim, border: `1px solid ${cfg.tint}` }}
    >
      <cfg.Icon className="size-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function DebateChip({ mode }: { mode: string }) {
  const on = mode === "on";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-2xs tracking-wide",
        on
          ? "border-[var(--color-line-strong)] text-[var(--color-fg-muted)]"
          : "border-[var(--color-line)] text-[var(--color-fg-subtle)]",
      )}
    >
      <span aria-hidden="true">{on ? "⇄" : "→"}</span>
      debate {mode}
    </span>
  );
}

/**
 * Conviction micro-bar — a thin meter for a 0..1 conviction, tinted by the
 * verdict so it reads at a glance without a number stealing focus from the
 * SignalBadge. The literal percent is exposed to assistive tech.
 */
export function ConvictionMeter({
  conviction,
  tint,
  className,
}: {
  conviction: number;
  tint: string;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, conviction)) * 100);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-surface-3)]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`Conviction ${pct}%`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: tint }}
        />
      </div>
      <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
        {pct}%
      </span>
    </div>
  );
}
