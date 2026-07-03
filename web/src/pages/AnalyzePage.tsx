import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { useReportShellLive } from "@/components/shell/live";
import { AnalyzeForm } from "@/features/analyze/AnalyzeForm";
import { ArmedCanvas } from "@/features/analyze/cockpit/ArmedCanvas";
import { Cockpit } from "@/features/analyze/cockpit/Cockpit";
import { QuotaBlocked } from "@/features/analyze/cockpit/QuotaBlocked";
import { isQuotaError } from "@/features/analyze/cockpit/quota";
import "@/features/analyze/cockpit/cockpit.css";
import { useAnalysisStream } from "@/hooks/useAnalysisStream";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { DebateMode } from "@/lib/api";

/**
 * AnalyzePage — THE BENCH (DESIGN.md §10-Analyze, the showpiece).
 *
 * Two lighting states inside one composition. AT REST (armed): a centered
 * command bench — kicker, display headline, the hero lens well with machined
 * mode keys — and beneath it the FULL pipeline model rendered UNLIT: the
 * recruiter sees the whole machine as an object before it wakes; the empty
 * state IS the product diagram. LIVE: POWER-UP fires (§6.3-1 — the shell's
 * emission field ramps via the data-live seam, the lens rim lights, the first
 * die breathes) and the cockpit unfolds beneath the bench as the asymmetric
 * bento. When the verdict lands, First Light (§6.3-3) concentrates the lamp:
 * the bench around the cockpit dims 6% ([data-revealing]) while the reveal
 * plays, then releases. A quota refusal steers to Library replays — the
 * bench never dead-ends.
 */
export function AnalyzePage() {
  const { state, isActive, start, stop } = useAnalysisStream();
  // The shell's data-live seam (§2.3/§8.1): the emission field ramps and the
  // Wordmark cursor blinks exactly while a run is live.
  useReportShellLive(isActive);
  const reduced = useReducedMotion();
  // The debate mode the user explicitly requested for the CURRENT run — lets
  // the cockpit lay out the right topology from t=0 (null = server default).
  const [modeHint, setModeHint] = useState<DebateMode | null>(null);
  // A replay's "Run this ticker live" CTA deep-links here with the ticker in
  // router state; prefill the command bar so the recruiter just hits Run.
  const location = useLocation();
  const prefillTicker =
    location.state && typeof (location.state as { ticker?: unknown }).ticker === "string"
      ? (location.state as { ticker: string }).ticker
      : undefined;

  // A run consumes quota the moment it starts, and a terminal phase (done,
  // error — including a 429 refusal) is when the backend's counters have
  // settled: refetch ["quota"] at both edges so the nav pill never shows a
  // stale "N runs left" after a run. The useQuota poll alone is 60s behind.
  const queryClient = useQueryClient();
  const phase = state.phase;
  useEffect(() => {
    if (phase === "connecting" || phase === "done" || phase === "error") {
      void queryClient.invalidateQueries({ queryKey: ["quota"] });
    }
  }, [phase, queryClient]);

  // FIRST LIGHT dimming window (§6.3-3): while the verdict reveals, every
  // non-cockpit surface (the bench) dims 6%, then the lamp releases. The
  // reduced-motion variant renders the final state with NO dimming pass.
  const hasDecision = state.done?.finalDecision != null;
  const [revealing, setRevealing] = useState(false);
  useEffect(() => {
    if (phase !== "done" || !hasDecision || reduced) return;
    setRevealing(true);
    const t = setTimeout(() => setRevealing(false), 1600);
    return () => {
      clearTimeout(t);
      setRevealing(false);
    };
  }, [phase, hasDecision, reduced]);

  const quotaBlocked =
    state.phase === "error" && isQuotaError(state.error, state.errorStatus);
  const hardError = state.phase === "error" && !quotaBlocked;
  const hasRun = state.order.length > 0 || state.phase !== "idle";

  return (
    <div className="space-y-8" data-revealing={revealing ? "true" : undefined}>
      {/* The command bench — centered, permanent; the cockpit unfolds
          beneath it without ever re-laying the bench out. */}
      <header className="bench-dim mx-auto flex max-w-2xl flex-col items-center gap-3 pt-2 text-center">
        <p className="kicker">Equity research pipeline</p>
        <h1 className="display-lit text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Watch the machine reach conviction.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-fg-muted)]">
          One ticker in: analysts fan out, bull argues bear, the risk desks
          collide, and a scored BUY / SELL / HOLD verdict lands — every token,
          dollar, and second metered live.
        </p>
      </header>

      {/* The bench rule — the v3 signature detail (§8.7). */}
      <div className="bench-rule" aria-hidden="true" />

      {/* The lens (§8.17) — milled straight into the bench, never boxed. */}
      <div className="bench-dim mx-auto w-full max-w-3xl">
        <AnalyzeForm
          initialTicker={prefillTicker}
          onSubmit={(v) => {
            setModeHint(v.debateMode ?? null);
            void start({
              ticker: v.ticker,
              investorMode: v.investorMode,
              ...(v.debateMode ? { debateMode: v.debateMode } : {}),
            });
          }}
          onStop={stop}
          isActive={isActive}
          disabled={state.phase === "connecting" || quotaBlocked}
        />
      </div>

      {/* Quota refusal — a designed steer to replays, never a dead wall. */}
      {quotaBlocked && <QuotaBlocked />}

      {/* A real failure (not quota) — clean, never a raw 500. Bear filament +
          dim wash; chroma is state (§3.4: error = bear). */}
      {hardError && state.error && (
        <div
          role="alert"
          className="panel relative flex items-start gap-3 overflow-hidden px-5 py-4"
          style={{ background: "var(--color-bear-dim)" }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[2px] bg-[var(--color-bear)]"
          />
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-[var(--color-bear)]"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-[var(--color-fg)]">
              Analysis interrupted
            </p>
            <p className="mt-0.5 font-mono text-xs text-[var(--color-fg-muted)]">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {/* The machine. Unlit at rest (the empty state IS the diagram);
          the live cockpit from the first event on. */}
      {hasRun && !quotaBlocked ? (
        <Cockpit state={state} modeHint={modeHint} />
      ) : (
        state.phase === "idle" && !quotaBlocked && <ArmedCanvas />
      )}
    </div>
  );
}
