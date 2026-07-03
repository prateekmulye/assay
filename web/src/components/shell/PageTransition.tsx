import { AnimatePresence, motion } from "motion/react";
import { type ReactNode } from "react";
import { useLocation } from "react-router";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * PageTransition — the LAMP PASS (DESIGN.md §6.3-4): a 240ms fade with a 6px
 * lift riding the press spring. Transform and opacity ride separate tracks —
 * the spring never animates opacity. Keyed on pathname; under reduced motion
 * the route swaps instantly.
 *
 * This component OWNS the page's <main> landmark (motion.main below), so the
 * reduced-motion branch must still render a real <main> — returning bare
 * children would silently drop the landmark for exactly the users most likely
 * to navigate by it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();

  if (reduced) return <main className="flex-1">{children}</main>;

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{
          y: { type: "spring", visualDuration: 0.18, bounce: 0 },
          opacity: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
        }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
