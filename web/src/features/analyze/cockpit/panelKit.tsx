/**
 * panelKit — shared primitives for the cockpit intelligence panels
 * (DESIGN.md §8.10). A Tile is a machined PANEL (luminance + milled edge +
 * layered shadow, NO border — §13.3) carrying a 2px top FILAMENT in its
 * persona/phase tint: persona tiles wear it always (identity), analyst tiles
 * earn it on completion (the trio visibly "checks in"). Every numeric stays
 * mono + tabular; status color is always backed by a glyph (§9.2).
 */
import { Check, Loader2, Minus, X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import type { NodeStatus } from "./pipeline";

/** A status glyph. The glyph carries the meaning, never color alone. */
export function StatusDot({ status }: { status: NodeStatus }) {
  if (status === "complete")
    return <Check className="size-3.5 text-[var(--color-bull)]" aria-hidden="true" />;
  if (status === "error")
    return <X className="size-3.5 text-[var(--color-bear)]" aria-hidden="true" />;
  if (status === "running")
    return (
      <Loader2
        className="size-3.5 animate-spin text-[var(--color-beam)]"
        aria-hidden="true"
      />
    );
  return <Minus className="size-3.5 text-[var(--color-fg-subtle)]" aria-hidden="true" />;
}

/**
 * Tile — the §8.10 panel: kicker-weight mono header row, top filament, dense
 * body. `filament="always"` = persona identity; `"earned"` = ignites on
 * completion.
 */
export function Tile({
  title,
  phase,
  status,
  accent,
  filament = "earned",
  children,
  className,
  flash,
}: {
  title: string;
  phase?: string;
  status: NodeStatus;
  /** Persona/phase tint token for the filament (state chroma only). */
  accent?: string;
  /** Persona tiles wear the filament always; others earn it on completion. */
  filament?: "always" | "earned";
  children: ReactNode;
  className?: string;
  /** When true (a fresh completion), pulse the collision spring. */
  flash?: boolean;
}) {
  const tint = accent ?? "var(--color-line-strong)";
  const lit =
    status === "error"
      ? true
      : filament === "always"
        ? true
        : status === "complete";
  const filamentTint = status === "error" ? "var(--color-bear)" : tint;

  return (
    <div
      className={cn(
        "panel relative flex flex-col overflow-hidden p-3.5",
        flash && status === "complete" && "animate-collide",
        className,
      )}
      style={{ transformOrigin: "center" }}
    >
      {/* 2px top filament (§8.10) — the tile's only chroma. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-[180ms] ease-[var(--ease-out)]"
        style={{
          background: filamentTint,
          opacity: lit ? 1 : 0,
        }}
      />
      <div className="mb-2 flex items-center gap-2">
        <StatusDot status={status} />
        <span className="flex-1 truncate text-sm font-medium text-[var(--color-fg)]">
          {title}
        </span>
        {phase && (
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-fg-subtle)]">
            {phase}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** A 0..1 confidence chip — graphite anatomy (§8.5): dim fill, no border. */
export function ConfidenceChip({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-2xs tabular-nums text-[var(--color-fg-muted)] shadow-[inset_0_1px_0_0_var(--edge-light)]">
      conf <span className="text-[var(--color-fg)]">{Math.round(value * 100)}%</span>
    </span>
  );
}

/**
 * Auto-scrolling mono token stream. Older lines fade at the top (CSS mask).
 * Pins to the bottom as new tokens arrive so the freshest text stays visible.
 * The caret is the machine cursor — hard steps(2) blink, static under
 * reduced motion (index.css unwinds animate-caret-blink).
 */
export function TokenStream({ text, lines = 4 }: { text: string; lines?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text]);
  return (
    <div
      ref={ref}
      className="token-stream overflow-hidden font-mono text-xs leading-relaxed text-[var(--color-fg-muted)]"
      style={{ maxHeight: `${lines * 1.1}rem` }}
    >
      {text}
      <span
        aria-hidden="true"
        className="animate-caret-blink ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-[var(--color-beam)]"
      />
    </div>
  );
}

/** Evidence bullet list that rises into place (word-stream materialization). */
export function KeyPoints({ points }: { points: string[] }) {
  if (points.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {points.map((p, i) => (
        <li
          key={i}
          className="animate-rise-in flex gap-1.5 text-xs text-[var(--color-fg-muted)]"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--color-fg-subtle)]" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}
