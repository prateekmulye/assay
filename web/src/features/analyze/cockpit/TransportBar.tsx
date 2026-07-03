/**
 * TransportBar — the TAPE TRANSPORT (DESIGN.md §8.13). Not a generic video
 * bar: the track is a recessed channel milled into the panel (well + inverted
 * shadow) and its ticks ARE the pipeline timeline — 2px phase-tinted marks at
 * each node_complete, so scrubbing reads as moving through named agent stages
 * (kept from WP-8). The played region fills toward the verdict in beam light
 * (Goal-Gradient); the playhead is a 12px beam caret that lifts (scale 1.15)
 * while scrubbing. Keys are machined `panel` icon buttons ≥44px; speed is ONE
 * mono key cycling ×1/×2/×4/×8 (default ×4 — the recruiter cut).
 *
 * a11y: the track is a real ARIA slider (role=slider, valuemin/max/now,
 * label), keyboard-driven — Space toggles play, ←/→/↑/↓ step one event,
 * Home/End jump to the ends. Seek stays a pure re-reduce.
 */
import { Pause, Play, RotateCcw } from "lucide-react";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { nodeLabel, nodePhase } from "@/features/analyze/nodeLabels";
import { cn } from "@/lib/utils";

import { REPLAY_SPEEDS, type EventPlayerControls } from "./eventPlayer";
import { formatMs } from "./transportTime";

/** Phase -> tint (§8.9 phase tints), so ticks read as the run's structure. */
const PHASE_TINT: Record<string, string> = {
  Resolve: "var(--color-beam)",
  Analysts: "var(--color-conservative)",
  Debate: "var(--color-hold)",
  Trade: "var(--color-aggressive)",
  Risk: "var(--color-aggressive)",
  Report: "var(--color-bull)",
};

export function TransportBar({ player }: { player: EventPlayerControls }) {
  const {
    isActive,
    isEnded,
    play,
    pause,
    seekProgress,
    step,
    restart,
    setSpeed,
    speed,
    elapsedMs,
    durationMs,
    progress,
    stageTicks,
  } = player;

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [scrubbing, setScrubbing] = useState(false);

  const toggle = useCallback(() => {
    if (isActive) pause();
    else play();
  }, [isActive, play, pause]);

  const nextSpeed =
    REPLAY_SPEEDS[
      (REPLAY_SPEEDS.indexOf(speed) + 1) % REPLAY_SPEEDS.length
    ]!;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = (clientX - rect.left) / rect.width;
      seekProgress(Math.max(0, Math.min(1, p)));
    },
    [seekProgress],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      setScrubbing(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setScrubbing(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          toggle();
          break;
        // ARIA slider pattern: Right/Up increase, Left/Down decrease.
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          step(1);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          step(-1);
          break;
        case "Home":
          e.preventDefault();
          seekProgress(0);
          break;
        case "End":
          e.preventDefault();
          seekProgress(1);
          break;
      }
    },
    [toggle, step, seekProgress],
  );

  // Space toggles play/pause from anywhere on the page (the media convention),
  // unless the user is typing in a field, focused on the slider (which owns
  // its own handler), or focused on an interactive control — Space must
  // ACTIVATE a focused button (Restart, speed) or link (Back to library),
  // not hijack it into a play/pause toggle.
  useEffect(() => {
    const onSpace = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable;
      const onSlider = t?.getAttribute("role") === "slider";
      const onControl = Boolean(t?.closest?.("button, a"));
      if (typing || onSlider || onControl) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onSpace);
    return () => window.removeEventListener("keydown", onSpace);
  }, [toggle]);

  const pct = Math.round(progress * 100);

  return (
    <div
      className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
      aria-label="Replay transport"
    >
      {/* Transport keys — machined panel keys (Fitts: big, leading). */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="panel"
          size="icon"
          type="button"
          onClick={toggle}
          aria-label={isActive ? "Pause replay" : "Play replay"}
          aria-pressed={isActive}
        >
          {isActive ? (
            <Pause className="size-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="size-5 translate-x-px fill-current" aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="panel"
          size="icon"
          type="button"
          onClick={restart}
          aria-label="Restart replay from the beginning"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {/* The pipeline-mapped scrubber. */}
      <div className="flex flex-1 items-center gap-3">
        <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-muted)]">
          {formatMs(elapsedMs)}
        </span>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Replay timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${formatMs(elapsedMs)} of ${formatMs(durationMs)}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          className={cn(
            "group relative h-11 flex-1 cursor-pointer select-none touch-none",
            "focus-visible:outline-none",
          )}
        >
          {/* The recessed channel (§8.13): a well milled into the panel. */}
          <div className="well absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full">
            {/* Played fill — beam light racing the verdict (Goal-Gradient). */}
            <div
              className="h-full rounded-full transition-[width] duration-75 ease-linear"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, color-mix(in oklch, var(--color-beam) 60%, transparent), var(--color-beam))",
              }}
            />
          </div>

          {/* Stage ticks — 2px phase-tinted marks at each node_complete. */}
          {durationMs > 0 &&
            stageTicks.map((t, i) => {
              const left = (t.offsetMs / durationMs) * 100;
              const reached = t.offsetMs <= elapsedMs + 0.5;
              return (
                <span
                  key={`${t.node}-${i}`}
                  className="pointer-events-none absolute top-1/2 h-2 w-[2px] -translate-x-1/2 -translate-y-1/2 transition-colors duration-[180ms]"
                  style={{
                    left: `${left}%`,
                    background: reached
                      ? (PHASE_TINT[nodePhase(t.node)] ?? "var(--color-fg-muted)")
                      : "var(--color-line-strong)",
                  }}
                  title={nodeLabel(t.node)}
                />
              );
            })}

          {/* Playhead — the 12px beam caret; lifts while scrubbing. */}
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-beam)]",
              "shadow-[var(--shadow-glow-beam)] transition-[left,scale] duration-75 ease-linear",
              scrubbing && "scale-[1.15]",
              "group-focus-visible:scale-[1.15]",
            )}
            style={{ left: `${pct}%` }}
          />
        </div>

        <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
          {formatMs(durationMs)}
        </span>
      </div>

      {/* Speed — ONE mono key cycling ×1/×2/×4/×8 (§8.13, Hick's Law: one
          affordance, one decision). */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="kicker">Speed</span>
        <Button
          variant="panel"
          size="sm"
          type="button"
          onClick={() => setSpeed(nextSpeed)}
          aria-label={`Playback speed ${speed} times. Change to ${nextSpeed} times`}
          className="min-w-12 font-mono tabular-nums"
        >
          {speed}×
        </Button>
      </div>

      {isEnded && (
        <span className="sr-only" role="status">
          Replay finished
        </span>
      )}
    </div>
  );
}
