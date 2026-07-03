import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `hero` (DESIGN.md §8.2): the page-level showpiece panel — raised graphite
   * (surface-2) at --radius-xl. Pair with `animate-breathe-tile` when live.
   */
  variant?: "default" | "hero";
}

/**
 * Panel — the machined-graphite container (was GlassCard). Elevation is
 * luminance + the 1px milled top edge + a layered shadow — never a border.
 * Panels never nest more than 2 deep; the third level is a well or a table.
 */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "panel p-5 sm:p-6",
        variant === "hero" && "panel-raised rounded-xl",
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = "Panel";
