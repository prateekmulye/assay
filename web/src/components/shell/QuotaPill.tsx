import { useQuota } from "@/hooks/useQuota";
import { type QuotaState } from "@/lib/api";

/**
 * LED hue per quota state (DESIGN.md §8.6, semantics frozen from the API
 * contract): admin → beam (the operator's light), room → bull, exhausted →
 * hold (a steer to replays, not an error), unmetered/degraded/unknown →
 * unlit graphite. Never color alone — the label always carries the meaning.
 */
function ledColor(q: QuotaState): string {
  switch (q.kind) {
    case "admin":
      return "var(--color-beam)";
    case "available":
      return "var(--color-bull)";
    case "replay-only":
      return "var(--color-hold)";
    default:
      return "var(--color-fg-subtle)";
  }
}

/**
 * QuotaPill — an LED lozenge (DESIGN.md §8.6): 999px pill on surface-1, a
 * leading 6px LED glowing at 40% of its state color, mono tabular label so
 * the count never jitters as it ticks down.
 */
export function QuotaPill() {
  const { quota } = useQuota();
  const color = ledColor(quota);

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-1)] py-1 pl-2.5 pr-3 font-mono text-2xs font-medium text-[var(--color-fg-muted)] shadow-[inset_0_1px_0_0_var(--edge-light)]"
      title={`Live-run quota: ${quota.label}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 6px 0 color-mix(in oklab, ${color} 40%, transparent)`,
        }}
      />
      <span className="text-[var(--color-fg)]">{quota.label}</span>
    </span>
  );
}
