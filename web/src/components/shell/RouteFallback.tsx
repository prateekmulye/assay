import { Panel } from "@/components/ui/panel";

/**
 * RouteFallback — the suspense skeleton while a lazy page chunk resolves.
 * Shimmer only (§6.3-6): a luminance sweep over graphite bars — never an
 * opacity pulse. Under reduced motion the sweep is stripped and the bars
 * degrade to flat surfaces.
 */
export function RouteFallback() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading page">
      <div className="space-y-3">
        <div className="animate-shimmer h-3 w-32 overflow-hidden rounded-sm bg-[var(--color-surface-2)]" />
        <div className="animate-shimmer h-8 w-2/3 overflow-hidden rounded-sm bg-[var(--color-surface-1)]" />
      </div>
      <Panel className="animate-shimmer h-40 overflow-hidden" />
    </div>
  );
}
