import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Button — machined keys (DESIGN.md §8.3). `key` is the single beam-filled
 * bright element at rest (one per view, maximum); `panel` is a raised graphite
 * key; `rail` is the hairline-outlined utility key; `ghost` is text-only.
 * Press physics: scale(0.97) on --spring-press. Interaction speaks in light,
 * never hue.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium " +
    "[transition:transform_var(--spring-press),background-color_150ms_var(--ease-out),box-shadow_150ms_var(--ease-out),border-color_150ms_var(--ease-out),color_150ms_var(--ease-out),filter_150ms_var(--ease-out)] " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-beam)] " +
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        key:
          "bg-[var(--color-beam)] text-[var(--color-key-fg)] shadow-[inset_0_1px_0_0_var(--edge-light)] " +
          "hover:brightness-[1.04] hover:shadow-[var(--shadow-glow-beam)]",
        panel:
          "bg-[var(--color-surface-2)] text-[var(--color-fg)] shadow-[var(--shadow-panel)] " +
          "hover:bg-[var(--color-surface-3)]",
        rail:
          "border border-[var(--color-line-strong)] bg-transparent text-[var(--color-fg)] " +
          "hover:bg-[var(--color-surface-1)]",
        ghost: "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
      },
      size: {
        /* Dense key — visual h-9, hit area expanded to 44px via ::after (§8). */
        sm: "h-9 px-3 text-xs after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "key", size: "md" },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

// Co-exported for link-styled-as-button usage (shadcn convention).
// eslint-disable-next-line react-refresh/only-export-components
export { buttonVariants };
