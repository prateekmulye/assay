import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

import { HealthDot } from "@/components/shell/HealthDot";
import { QuotaPill } from "@/components/shell/QuotaPill";
import { Wordmark } from "@/components/shell/Wordmark";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const ROUTES = [
  { to: "/", label: "Analyze", end: true },
  { to: "/library", label: "Library", end: false },
  { to: "/market", label: "Market", end: false },
  { to: "/eval", label: "Eval", end: false },
] as const;

/**
 * TopNav — "the rail" (DESIGN.md §8.1). Full-width, OPAQUE base fill, one
 * bottom hairline — not floating, not blurred, not pill-shaped. On scroll the
 * rail elevates: fill steps to surface-1, the hairline strengthens (180ms).
 * The active tab carries the FILAMENT — a 2px beam underline sliding between
 * tabs on the shared-layout spring. Under reduced motion it snaps.
 */
export function TopNav() {
  const reduced = useReducedMotion();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Match the deepest active root segment so /library/:id keeps "Library" lit.
  const activeRoot =
    ROUTES.slice()
      .reverse()
      .find((r) =>
        r.end ? location.pathname === r.to : location.pathname.startsWith(r.to),
      )?.to ?? "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-rail)] border-b transition-colors duration-[180ms] ease-[var(--ease-out)]",
        scrolled
          ? "border-[var(--color-line-strong)] bg-[var(--color-surface-1)]"
          : "border-[var(--color-line)] bg-[var(--color-bench)]",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-6"
      >
        <NavLink to="/" className="rounded-md" aria-label="Assay home">
          <Wordmark />
        </NavLink>

        {/* Plain nav links (NavLink anchors) — deliberately NOT a tablist:
            tabs control in-page panels; these navigate between routes. */}
        <div className="ml-4 hidden h-full items-center sm:flex">
          {ROUTES.map((route) => {
            const isActive = activeRoot === route.to;
            return (
              <NavLink
                key={route.to}
                to={route.to}
                end={route.end}
                className={cn(
                  "relative flex h-full items-center px-3.5 text-sm font-medium transition-colors duration-[100ms]",
                  isActive
                    ? "text-[var(--color-fg)]"
                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-filament"
                    className="absolute inset-x-3 bottom-0 h-[2px] bg-[var(--color-beam)]"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32, mass: 0.8 }
                    }
                  />
                )}
                {route.label}
              </NavLink>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <QuotaPill />
          <span className="hidden h-5 w-px bg-[var(--color-line)] md:block" />
          <HealthDot />
        </div>
      </nav>

      {/* Mobile tab row — a second rail line under the bar, same filament
          language (static per-tab underline; no shared layout on touch). */}
      <div className="mx-auto flex max-w-7xl gap-1 px-6 pb-2 sm:hidden">
        {ROUTES.map((route) => (
          <NavLink
            key={route.to}
            to={route.to}
            end={route.end}
            className={({ isActive }) =>
              cn(
                "flex-1 border-b-2 py-2 text-center text-xs font-medium transition-colors duration-[100ms]",
                isActive
                  ? "border-[var(--color-beam)] text-[var(--color-fg)]"
                  : "border-transparent text-[var(--color-fg-muted)]",
              )
            }
          >
            {route.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
