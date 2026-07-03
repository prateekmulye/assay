import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * PageHeader (DESIGN.md §8.7): kicker → display title (600, -0.03em, lit from
 * above via the luminance mask) → muted lede. Beneath everything runs the
 * BENCH RULE — a full-width hairline with a 24px beam lit tick at the content
 * left edge. The lit tick is the v3 signature detail: every page header, and
 * nowhere else.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="kicker mb-2">{eyebrow}</p>}
          <h1 className="display-lit text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="bench-rule" aria-hidden="true" />
    </div>
  );
}
