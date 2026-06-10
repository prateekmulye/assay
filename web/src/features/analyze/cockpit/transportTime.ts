/**
 * transportTime — pure formatting for the replay transport. Split from
 * TransportBar.tsx so that component file stays component-only (fast refresh).
 */

/** Format milliseconds as a mono `m:ss` media readout. */
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
