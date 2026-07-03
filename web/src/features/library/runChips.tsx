/**
 * runChips — the engraved-chip atoms (DESIGN.md §8.5) shared by the ledger row
 * and the replay dossier header: status chip, debate on/off chip, and the
 * conviction meter. Chip anatomy is frozen here so run metadata reads the same
 * everywhere: --radius-sm, dim fill, NO border (pills are reserved for LED
 * lozenges), mono --text-2xs, and signal chroma ONLY when it encodes state —
 * always backed by a glyph + the literal word (never color alone, §1).
 */
import { CircleCheck, CircleSlash, OctagonX, Radio } from "lucide-react";

import { cn } from "@/lib/utils";

/** finished -> bull (done) · error -> bear · aborted -> hold · running -> beam. */
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
    tint: "var(--color-beam)",
    dim: "var(--color-beam-dim)",
    Icon: Radio,
    label: "running",
  },
};

export function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? {
    tint: "var(--color-fg-muted)",
    dim: "var(--color-surface-2)",
    Icon: CircleSlash,
    label: status,
  };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-2xs font-medium lowercase tracking-wide"
      style={{ color: cfg.tint, background: cfg.dim }}
    >
      <cfg.Icon className="size-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

/** Debate topology chip — pure run metadata, so it stays graphite (§8.5). */
export function DebateChip({ mode }: { mode: string }) {
  const on = mode === "on";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-2xs tracking-wide",
        on ? "text-[var(--color-fg-muted)]" : "text-[var(--color-fg-subtle)]",
      )}
    >
      <span aria-hidden="true">{on ? "⇄" : "→"}</span>
      debate {mode}
    </span>
  );
}

/**
 * Conviction meter — the ledger row's ONLY chroma besides the verdict chip
 * (§10-Library): a 3px recessed track with a signal-tinted fill. The literal
 * percent is exposed to assistive tech and echoed in mono beside the track.
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
        className="h-[3px] w-20 overflow-hidden rounded-full bg-[var(--color-well)] shadow-[var(--shadow-well)]"
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
