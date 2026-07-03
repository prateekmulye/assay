import { Suspense } from "react";
import { Outlet } from "react-router";

import { useShellLive } from "@/components/shell/live";
import { Footer } from "@/components/shell/Footer";
import { PageTransition } from "@/components/shell/PageTransition";
import { RouteFallback } from "@/components/shell/RouteFallback";
import { TopNav } from "@/components/shell/TopNav";

/**
 * AppShell — the bench (DESIGN.md §2.3). Atmosphere layers, back to front:
 * base fill + static bench light (L1) → live emission field (L2, opacity
 * driven by data-live) → content → machined grain (L4, via `.grain`). The
 * `data-live` attribute is the single liveness switch: emission field and
 * Wordmark cursor blink are pure CSS reactions to it.
 */
export function AppShell() {
  const live = useShellLive();

  return (
    <div
      data-live={live ? "true" : "false"}
      className="grain relative flex min-h-dvh flex-col"
    >
      {/* Atmosphere L0–L2: two fixed radial fields, both token-defined in CSS. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <div className="bench-light" />
        <div className="emission-field" />
      </div>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-[var(--color-beam)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-key-fg)]"
      >
        Skip to content
      </a>

      <TopNav />

      {/* tabIndex={-1}: the skip link's target must be programmatically
          focusable or the skip is a no-op in several browsers. */}
      <div
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-6 py-8 outline-none sm:py-10"
      >
        <PageTransition>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </div>

      <Footer />
    </div>
  );
}
