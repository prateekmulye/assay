/**
 * SegmentedKeys — the milled segmented control (DESIGN.md §8.4): a sunken well
 * containing key-shaped segments; the selected segment is a pressed machined
 * key (surface-3 fill + the 1px milled edge-light) that slides between
 * positions on the shared-layout spring. Snaps under reduced motion.
 *
 * Shared across features (Library status filter, Dossier range keys) — it
 * lives here because §8.4 names "Library status" as the canonical usage; the
 * market feature imports it rather than forking the key language.
 *
 * A11y: real buttons with `aria-pressed` (a filter, not a radio group); hit
 * areas are expanded to ≥44px via ::after per the §8 global rule.
 */
import { motion } from "motion/react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedKeys<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  groupLabel,
  className,
}: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Unique per control — the Motion shared-layout key slides within it. */
  layoutId: string;
  /** When set, the container becomes role="group" with this accessible name. */
  groupLabel?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      role={groupLabel ? "group" : undefined}
      aria-label={groupLabel}
      className={cn("well inline-flex items-center gap-0.5 p-1", className)}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative h-8 rounded-[6px] px-3 font-mono text-2xs font-medium tracking-wide",
              "transition-colors duration-[100ms]",
              // ≥44px hit target: the visual key is h-8 inside the well.
              "after:absolute after:inset-x-0 after:-inset-y-2 after:content-['']",
              selected
                ? "text-[var(--color-fg)]"
                : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]",
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-[6px] bg-[var(--color-surface-3)] shadow-[inset_0_1px_0_0_var(--edge-light)]"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", visualDuration: 0.18, bounce: 0 }
                }
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
