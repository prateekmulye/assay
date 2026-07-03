/**
 * ConvictionGauge — the 0..1 radial for First Light (DESIGN.md §8.11):
 * a 120px ring, track --color-line, 6px signal-tinted stroke, BUTT caps —
 * a machined dial, not a rounded progress toy. The sweep rides the settle
 * spring (stroke-dashoffset); the §6.3-3 stage timing is driven by the
 * parent flipping `active` at T+280. Reduced motion renders the final arc
 * and value instantly.
 */
import { useEffect, useRef } from "react";

import type { Action } from "@/lib/api";
import { useReducedMotion } from "@/hooks/useReducedMotion";

import { useCountUp } from "./useCountUp";

const TINT: Record<Action, string> = {
  BUY: "var(--color-bull)",
  SELL: "var(--color-bear)",
  HOLD: "var(--color-hold)",
};

const SIZE = 120;
const R = 50;
const CIRC = 2 * Math.PI * R;
// A 270° dial (¾ circle), gap at the bottom.
const SWEEP = 0.75;
const TRACK_LEN = CIRC * SWEEP;

export function ConvictionGauge({
  conviction,
  action,
  active,
}: {
  conviction: number; // 0..1
  action: Action;
  /** Flipped by the parent at its choreography stage (§6.3-3 T+280). */
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const arcRef = useRef<SVGCircleElement | null>(null);
  const clamped = Math.max(0, Math.min(1, conviction));
  const pct = Math.round(clamped * 100);
  const valueRef = useCountUp(pct, { duration: 700, active });

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    const filled = TRACK_LEN * clamped;
    if (!active) {
      arc.style.strokeDashoffset = String(TRACK_LEN);
      return;
    }
    if (reduced) {
      arc.style.transition = "none";
      arc.style.strokeDashoffset = String(TRACK_LEN - filled);
      return;
    }
    // Start empty, then sweep to filled on the next frame so the transition
    // runs — on the settle spring (§6.1: springs animate transforms/lengths).
    arc.style.transition = "none";
    arc.style.strokeDashoffset = String(TRACK_LEN);
    const raf = requestAnimationFrame(() => {
      arc.style.transition = "stroke-dashoffset var(--spring-settle)";
      arc.style.strokeDashoffset = String(TRACK_LEN - filled);
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped, active, reduced]);

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="-rotate-[135deg]"
        aria-hidden="true"
      >
        {/* track — a hairline rule bent into a dial */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="6"
          strokeLinecap="butt"
          strokeDasharray={`${TRACK_LEN} ${CIRC}`}
        />
        {/* filled arc — the verdict's signal, machined butt caps */}
        <circle
          ref={arcRef}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={TINT[action]}
          strokeWidth="6"
          strokeLinecap="butt"
          strokeDasharray={`${TRACK_LEN} ${CIRC}`}
          strokeDashoffset={TRACK_LEN}
          style={{ filter: `drop-shadow(0 0 6px ${TINT[action]})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          ref={valueRef}
          className="font-mono text-2xl font-semibold tabular-nums text-[var(--color-fg)]"
          style={{ willChange: "contents" }}
        >
          0
        </span>
        <span className="kicker">conviction</span>
      </div>
    </div>
  );
}
