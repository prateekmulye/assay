import { useHealth, type HealthState } from "@/hooks/useHealth";
import { cn } from "@/lib/utils";

/* System-state hues reuse signal semantics (§3.6): healthy = bull,
   down = bear, indeterminate = fg-subtle. Always paired with a word. */
const CONFIG: Record<HealthState, { color: string; label: string; breathe: boolean }> =
  {
    ok: { color: "var(--color-bull)", label: "Backend live", breathe: true },
    down: { color: "var(--color-bear)", label: "Backend unreachable", breathe: false },
    checking: {
      color: "var(--color-fg-subtle)",
      label: "Checking backend…",
      breathe: false,
    },
  };

/**
 * HealthDot — an 8px LED (DESIGN.md §8.6) polling /healthz. Healthy breathes
 * (the one breathing element in its region); the 40% state-color glow is the
 * emission that says "live", never decoration. Meaning never rides color
 * alone: an sr-only status word + title back it up.
 *
 * `announce=false` renders a silent mirror (e.g. the Footer copy) so the app
 * keeps exactly one live status region for this signal.
 */
export function HealthDot({
  withLabel = false,
  announce = true,
}: {
  withLabel?: boolean;
  announce?: boolean;
}) {
  const { state } = useHealth();
  const cfg = CONFIG[state];

  return (
    <span
      className="inline-flex items-center gap-2"
      title={cfg.label}
      {...(announce ? { role: "status", "aria-live": "polite" as const } : {})}
    >
      <span className="relative inline-flex size-2.5 items-center justify-center">
        {cfg.breathe && (
          <span
            className="animate-breathe absolute inline-flex size-full rounded-full opacity-60"
            style={{ background: cfg.color }}
          />
        )}
        <span
          className="relative inline-flex size-2 rounded-full"
          style={{
            background: cfg.color,
            boxShadow: `0 0 8px 0 color-mix(in oklab, ${cfg.color} 40%, transparent)`,
          }}
        />
      </span>
      <span
        className={cn(
          "font-mono text-2xs font-medium text-[var(--color-fg-muted)]",
          withLabel ? "inline" : "sr-only",
        )}
      >
        {cfg.label}
      </span>
    </span>
  );
}
