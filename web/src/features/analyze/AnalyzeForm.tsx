/**
 * AnalyzeForm — THE LENS (DESIGN.md §8.4/§8.17): the command bench's hero
 * milled well. The ticker input is a h-14 mono command line sunken into the
 * bench (well fill + inverted shadow — the light comes from above), with the
 * ONE `key` button seated inside its right edge. Beneath it, the mode
 * controls are machined segmented keys in wells — the selected segment pops
 * up (surface-3 + milled edge) and slides on the shared-layout press spring.
 *
 * POWER-UP T+0 (§6.3-1): on submit the well's rim flips to the beam and
 * glows within one frame — the instrument acknowledges before the stream
 * even connects. The CTA flips to a Stop affordance while a run is active
 * (destructive = panel + bear text + glyph, never a red fill).
 */
import { Loader2, Play, Search, Square } from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { type DebateMode, type InvestorMode } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface AnalyzeFormValues {
  ticker: string;
  investorMode: InvestorMode;
  debateMode?: DebateMode;
}

const INVESTOR_MODES: InvestorMode[] = ["Neutral", "Bullish", "Bearish"];

/** A machined segmented control (§8.4): key-shaped segments in a well; the
 *  selected key pops up and slides between positions on the press spring. */
function SegmentedKeys<T extends string>({
  legend,
  layoutId,
  options,
  value,
  onChange,
  format = (v) => v,
}: {
  legend: string;
  layoutId: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  const reduced = useReducedMotion();
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      <span className="kicker whitespace-nowrap">{legend}</span>
      <div className="well inline-flex items-center gap-0.5 p-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              "relative rounded-md px-2.5 py-1 font-mono text-2xs font-medium uppercase tracking-wide",
              "transition-colors duration-[100ms]",
              value === opt
                ? "text-[var(--color-fg)]"
                : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]",
            )}
          >
            {value === opt && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-[var(--color-surface-3)] shadow-[inset_0_1px_0_0_var(--edge-light)]"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", visualDuration: 0.18, bounce: 0 }
                }
              />
            )}
            <span className="relative">{format(opt)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AnalyzeForm({
  onSubmit,
  onStop,
  isActive,
  disabled,
  initialTicker,
}: {
  onSubmit: (values: AnalyzeFormValues) => void;
  onStop: () => void;
  isActive: boolean;
  disabled?: boolean;
  /** Prefill the ticker (e.g. a replay's "Run this ticker live" deep link). */
  initialTicker?: string;
}) {
  const tickerId = useId();
  const [ticker, setTicker] = useState(initialTicker?.toUpperCase() || "AAPL");
  const [investorMode, setInvestorMode] = useState<InvestorMode>("Neutral");
  const [debate, setDebate] = useState<"default" | DebateMode>("default");
  // POWER-UP acknowledgment: the rim lights the instant a run is asked for.
  const [ignited, setIgnited] = useState(false);
  const igniteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (igniteTimer.current) clearTimeout(igniteTimer.current);
    },
    [],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = ticker.trim().toUpperCase();
    if (!trimmed) return;
    setIgnited(true);
    if (igniteTimer.current) clearTimeout(igniteTimer.current);
    igniteTimer.current = setTimeout(() => setIgnited(false), 700);
    onSubmit({
      ticker: trimmed,
      investorMode,
      ...(debate !== "default" ? { debateMode: debate } : {}),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label="Start an equity analysis"
    >
      {/* The lens — the hero milled well with the key seated inside. */}
      <div>
        <label htmlFor={tickerId} className="kicker mb-2 block">
          Ticker
        </label>
        <div
          className={cn(
            "well relative flex h-14 items-center transition-[box-shadow,border-color] duration-[180ms] ease-[var(--ease-out)]",
            "border border-[var(--color-line)]",
            "focus-within:border-[var(--color-beam)] focus-within:shadow-[var(--shadow-well),var(--shadow-glow-beam)]",
            ignited &&
              "border-[var(--color-beam)] shadow-[var(--shadow-well),var(--shadow-glow-beam)]",
          )}
        >
          <Search
            className="pointer-events-none absolute left-4 size-4 text-[var(--color-fg-subtle)]"
            aria-hidden="true"
          />
          <input
            id={tickerId}
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="AAPL · RELIANCE.NS · 0700.HK"
            autoComplete="off"
            spellCheck={false}
            maxLength={15}
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent pl-11 pr-3",
              "font-mono text-lg font-medium uppercase tracking-wide text-[var(--color-fg)]",
              "caret-[var(--color-beam)]",
              "placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--color-fg-subtle)]",
              "focus:outline-none focus-visible:outline-none",
            )}
          />
          <div className="pr-1.5">
            {isActive ? (
              <Button
                type="button"
                variant="panel"
                onClick={onStop}
                className="text-[var(--color-bear)]"
              >
                <Square className="fill-current" />
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                variant="key"
                disabled={disabled || !ticker.trim()}
                className={cn(ignited && "scale-[0.97]")}
              >
                {disabled ? <Loader2 className="animate-spin" /> : <Play />}
                Run analysis
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mode keys — machined segments (§8.4). */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <SegmentedKeys
          legend="Investor lens"
          layoutId="lens-investor-key"
          options={INVESTOR_MODES}
          value={investorMode}
          onChange={setInvestorMode}
        />
        <SegmentedKeys
          legend="Debate"
          layoutId="lens-debate-key"
          options={["default", "on", "off"] as const}
          value={debate}
          onChange={setDebate}
        />
      </div>
    </form>
  );
}
