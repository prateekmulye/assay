/**
 * The shell liveness seam (DESIGN.md §2.3 / §8.1). Pages that own a run stream
 * report "a run is live"; AppShell renders it as `data-live` on the shell root,
 * which powers the live emission field and the Wordmark cursor blink — both
 * pure CSS from there. A tiny module-level store keeps this out of the frozen
 * hooks/reducer seams and adds zero re-renders outside the shell.
 */
import { useEffect, useSyncExternalStore } from "react";

let live = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return live;
}

export function setShellLive(next: boolean): void {
  if (live === next) return;
  live = next;
  listeners.forEach((l) => l());
}

/** Read the shell liveness (AppShell). */
export function useShellLive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Report liveness from a page that owns a stream; resets on unmount. */
export function useReportShellLive(isLive: boolean): void {
  useEffect(() => {
    setShellLive(isLive);
    return () => setShellLive(false);
  }, [isLive]);
}
