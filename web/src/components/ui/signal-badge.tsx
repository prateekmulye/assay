import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { type Action } from "@/lib/api";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  Action,
  { tint: string; dim: string; Icon: typeof Minus; label: string }
> = {
  BUY: {
    tint: "var(--color-bull)",
    dim: "var(--color-bull-dim)",
    Icon: TrendingUp,
    label: "BUY",
  },
  SELL: {
    tint: "var(--color-bear)",
    dim: "var(--color-bear-dim)",
    Icon: TrendingDown,
    label: "SELL",
  },
  HOLD: {
    tint: "var(--color-hold)",
    dim: "var(--color-hold-dim)",
    Icon: Minus,
    label: "HOLD",
  },
};

/**
 * SignalBadge — the engraved chip (DESIGN.md §8.5). Signal chroma is earned
 * here (verdict = state) but never alone: glyph + the literal WORD back it up.
 * Dim fill, NO border — the chip reads as engraved into the graphite, tinted
 * by its signal. Score suffix stays ivory (data values are always fg).
 */
export function SignalBadge({
  action,
  score,
  size = "md",
  className,
}: {
  action: Action;
  score?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cfg = CONFIG[action];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm font-mono font-medium uppercase",
        size === "sm" && "gap-1 px-1.5 py-0.5 text-2xs tracking-[0.14em]",
        size === "md" && "gap-1.5 px-2.5 py-1 text-2xs tracking-[0.14em]",
        size === "lg" && "gap-2 px-3.5 py-1.5 text-sm tracking-[0.1em]",
        className,
      )}
      style={{ color: cfg.tint, background: cfg.dim }}
    >
      <cfg.Icon
        className={cn(size === "lg" ? "size-5" : "size-3")}
        aria-hidden="true"
      />
      {cfg.label}
      {score != null && (
        <span className="tracking-normal text-[var(--color-fg)]">· {score}</span>
      )}
    </span>
  );
}
