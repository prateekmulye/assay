import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Panel } from "@/components/ui/panel";

/**
 * EmptyState (DESIGN.md §8.8) — outcome-oriented and unlit. Decoration is a
 * single row of three 4px unlit LEDs above the kicker: the instrument waiting.
 * Copy stays outcome-oriented ("Analyze NVDA to backfill this chart"), never
 * "No data." Exactly ONE key CTA belongs in the children slot.
 *
 * `icon` is accepted for call-site compatibility but intentionally not
 * rendered — the LEDs are the only decoration the contract permits here.
 */
export function EmptyState({
  title,
  description,
  children,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  badge?: string;
}) {
  return (
    <Panel className="flex flex-col items-center gap-5 py-14 text-center">
      <span className="flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-[var(--color-fg-subtle)] opacity-30"
          />
        ))}
      </span>
      <div className="max-w-md space-y-2">
        {badge && <p className="kicker">{badge}</p>}
        <h2 className="text-xl font-medium text-[var(--color-fg)] [font-weight:550]">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {description}
        </p>
      </div>
      {children}
    </Panel>
  );
}
