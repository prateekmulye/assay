/**
 * DecisionReveal — FIRST LIGHT (DESIGN.md §8.11, choreography §6.3-3).
 * The Peak: when `done` lands the verdict materializes in one deliberate
 * sequence, total < 1.6s, and nothing else on screen animates during it:
 *
 *   T+0     the hero panel springs in (--spring-reveal); the page dims 6%
 *           around the cockpit ([data-revealing] — owned by AnalyzePage)
 *   T+120   SignalBadge + action word spring in (scale 0.92 -> 1)
 *   T+280   ConvictionGauge sweep (stroke-dashoffset on --spring-settle)
 *   T+420   the score counts up (rAF, 700ms, useCountUp)
 *   T+1120  count-end: the score's signal glow BLOOMS 0 -> 24px -> settles 8px
 *
 * This is the app's largest chroma moment and the only place --text-6xl
 * exists (§13.13). Reduced motion renders the final composed state instantly
 * (badge+gauge+score at rest, glow settled at 8px, no dimming pass — §6.4).
 */
import { Check, Copy } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";

import { SignalBadge } from "@/components/ui/signal-badge";
import type { AnalysisDone } from "@/hooks/useAnalysisStream";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Action, FinalDecision } from "@/lib/api";

import "./cockpit.css";
import { ConvictionGauge } from "./ConvictionGauge";
import { Markdown } from "./MarkdownView";
import { useCountUp } from "./useCountUp";

const TINT: Record<Action, string> = {
  BUY: "var(--color-bull)",
  SELL: "var(--color-bear)",
  HOLD: "var(--color-hold)",
};

/** §6.3-3 stage clock: 0 rise · 1 gauge · 2 score · 3 bloom (final). */
function useFirstLightStage(): number {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(() => (reduced ? 3 : 0));
  useEffect(() => {
    if (reduced) {
      setStage(3);
      return;
    }
    const timers = [
      setTimeout(() => setStage(1), 280),
      setTimeout(() => setStage(2), 420),
      setTimeout(() => setStage(3), 1120),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);
  return stage;
}

function ScoreBlock({
  score,
  action,
  stage,
}: {
  score: number;
  action: Action;
  stage: number;
}) {
  // The count starts at T+420 (stage 2); at count-end (stage 3) the signal
  // glow blooms and settles at 8px — light responds to the number landing.
  const ref = useCountUp(score, { duration: 700, active: stage >= 2 });
  return (
    <div
      className="flex flex-col items-start sm:items-end"
      style={{ "--fl-tint": TINT[action] } as CSSProperties}
    >
      {/* Screen readers hear the FINAL value once; the rAF count-up below is
          decorative and aria-hidden — a live region on a per-frame textContent
          mutation would announce dozens of intermediate numbers. */}
      <span className="sr-only" aria-live="polite">
        {score}
        /100
      </span>
      <span aria-hidden="true">
        <span
          ref={ref}
          className={
            "font-mono text-6xl tabular-nums text-[var(--color-fg)] [font-weight:560] " +
            (stage >= 3 ? "fl-score-glow fl-score-bloom" : "")
          }
          style={{ willChange: "contents" }}
        >
          0
        </span>
      </span>
      <span className="kicker mt-1">Score / 100</span>
    </div>
  );
}

function CopyMarkdownButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — silently no-op */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-transparent px-3 font-mono text-2xs uppercase tracking-[0.14em] text-[var(--color-fg-muted)] transition-colors duration-[150ms] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-[var(--color-bull)]" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden="true" />
          Copy markdown
        </>
      )}
    </button>
  );
}

export function DecisionReveal({
  done,
  ticker,
}: {
  done: AnalysisDone;
  ticker: string | null;
}) {
  const stage = useFirstLightStage();
  const decision: FinalDecision | null = done.finalDecision;
  if (!decision) {
    // A done with no decision (degraded arbiter) — still show the report.
    return (
      <article className="panel animate-verdict-in rounded-xl p-5 sm:p-6">
        <ReportBlock markdown={done.finalReport} />
      </article>
    );
  }

  const tint = TINT[decision.action];

  return (
    <article
      className="panel-raised animate-verdict-in rounded-xl p-5 sm:p-7"
      aria-label="Final verdict"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Left: the verdict word (§8.11) — badge + display action word,
            springing in at T+120 (animation-delay; 'both' holds the from-state). */}
        <div
          className="animate-verdict-in flex min-w-0 flex-1 flex-col gap-2"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <SignalBadge action={decision.action} size="lg" />
            <span className="kicker">{ticker} · final decision</span>
          </div>
          <p
            aria-hidden="true"
            className="text-2xl uppercase tracking-[0.08em] [font-weight:620]"
            style={{ color: tint }}
          >
            {decision.action}
          </p>
        </div>

        {/* Center: the dial — sweep begins at T+280. */}
        <ConvictionGauge
          conviction={decision.conviction}
          action={decision.action}
          active={stage >= 1}
        />

        {/* Right: the score — the only --text-6xl in the app. */}
        <ScoreBlock score={decision.score} action={decision.action} stage={stage} />
      </div>

      <hr className="my-6 border-[var(--color-line)]" />
      <p className="report-prose max-w-2xl text-sm leading-relaxed">
        {decision.rationale}
      </p>

      <ReportBlock markdown={done.finalReport} className="mt-6" />
    </article>
  );
}

function ReportBlock({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  if (!markdown?.trim()) return null;
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="kicker">Investment report</h3>
        <CopyMarkdownButton markdown={markdown} />
      </div>
      <Markdown source={markdown} />
    </div>
  );
}
