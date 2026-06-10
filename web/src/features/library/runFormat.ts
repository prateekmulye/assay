/**
 * runFormat — pure run-summary helpers, split from runChips.tsx so that file
 * stays component-only (fast refresh).
 */

/** Verdict action -> its signal token, for the conviction meter + cap rail. */
export function actionTint(action: string): string {
  if (action === "BUY") return "var(--color-bull)";
  if (action === "SELL") return "var(--color-bear)";
  return "var(--color-hold)";
}
