/**
 * runFormat — pure run-summary helpers, split from runChips.tsx so that file
 * stays component-only (fast refresh).
 */

/** Verdict action -> its signal token, for the conviction meter fill. */
export function actionTint(action: string): string {
  if (action === "BUY") return "var(--color-bull)";
  if (action === "SELL") return "var(--color-bear)";
  return "var(--color-hold)";
}

/**
 * Exceptional run status -> its state token for the ledger tape word
 * (§3.6: error = bear, aborted = hold, running = beam). `finished` returns
 * null on purpose — the default outcome earns no chroma on the ledger
 * (§10-Library rations row chroma to the verdict chip + conviction fill).
 */
export function statusTint(status: string): string | null {
  if (status === "error") return "var(--color-bear)";
  if (status === "aborted") return "var(--color-hold)";
  if (status === "running") return "var(--color-beam)";
  return null;
}
