/**
 * DebateTheater — the centerpiece organ (DESIGN.md §8.10). Bull (left) and
 * Bear (right) wear their persona filaments ALWAYS — the identity is the 2px
 * top thread of signal light — and stream their theses in mono; the verdict
 * bridge between them is graphite until the facilitator completes, when it
 * gains the beam edge-light (interaction light, not hue). Opposition ->
 * convergence, isolated by chroma rationing (Von Restorff).
 *
 * Debate-off collapses to a single Research Synthesis bridge (same slot).
 */
import { ArrowDownRight, ArrowUpRight, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

import { Tile, TokenStream } from "./panelKit";
import type { DebatePanel, NodeStatus } from "./pipeline";

const BULL = "var(--color-bull)";
const BEAR = "var(--color-bear)";

function ThesisColumn({
  side,
  status,
  text,
  thesis,
}: {
  side: "bull" | "bear";
  status: NodeStatus;
  text: string;
  thesis: string | null;
}) {
  const tint = side === "bull" ? BULL : BEAR;
  const Icon = side === "bull" ? ArrowUpRight : ArrowDownRight;
  const settled = status === "complete" && thesis;
  return (
    <Tile
      title={side === "bull" ? "Bull" : "Bear"}
      phase="Researcher"
      status={status}
      accent={tint}
      filament="always"
      flash
      className="min-h-[7.5rem]"
    >
      <div className="mb-1.5 flex items-center gap-1">
        <Icon className="size-3.5" style={{ color: tint }} aria-hidden="true" />
        <span
          className="font-mono text-2xs uppercase tracking-[0.16em]"
          style={{ color: tint }}
        >
          {side === "bull" ? "Accumulate" : "Patience"}
        </span>
      </div>
      {settled ? (
        <p className="animate-rise-in text-xs leading-relaxed text-[var(--color-fg-muted)]">
          {thesis}
        </p>
      ) : status === "pending" ? (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          awaiting analysts…
        </p>
      ) : text ? (
        <TokenStream text={text} />
      ) : (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          building thesis…
        </p>
      )}
    </Tile>
  );
}

function VerdictBridge({
  status,
  text,
  label,
}: {
  status: NodeStatus;
  text: string;
  label: string;
}) {
  const settled = status === "complete" && text;
  return (
    <div
      className={cn(
        "panel-raised relative flex flex-col justify-center overflow-hidden px-4 py-3.5",
        settled && "animate-rise-in",
      )}
      style={{
        // §8.10: the bridge gains a beam edge-light when the facilitator
        // completes — emission marks the live/finished synthesis, never a hue.
        boxShadow:
          status === "complete"
            ? "inset 0 1px 0 0 var(--fin-edge-light-2), var(--shadow-panel), var(--shadow-glow-beam)"
            : status === "running"
              ? "inset 0 1px 0 0 var(--fin-edge-light-2), var(--shadow-panel)"
              : undefined,
      }}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Scale className="size-3.5 text-[var(--color-beam)]" aria-hidden="true" />
        <span className="kicker">{label}</span>
      </div>
      {settled ? (
        <p className="text-xs leading-relaxed text-[var(--color-fg)]">{text}</p>
      ) : status === "running" ? (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          weighing the debate…
        </p>
      ) : (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          verdict pending
        </p>
      )}
    </div>
  );
}

export function DebateTheater({ panel }: { panel: DebatePanel }) {
  if (panel.mode === "off") {
    return (
      <section aria-label="Research synthesis" className="space-y-2.5">
        <h3 className="kicker">Research · synthesis (debate off)</h3>
        <VerdictBridge
          status={panel.verdict.status}
          text={panel.verdict.text}
          label="Synthesis verdict"
        />
      </section>
    );
  }

  return (
    <section aria-label="Bull versus bear debate" className="space-y-2.5">
      <h3 className="kicker">Debate theater · bull vs bear</h3>
      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_1.1fr_1fr]">
        <ThesisColumn
          side="bull"
          status={panel.bull.status}
          text={panel.bull.text}
          thesis={panel.bull.thesis}
        />
        <VerdictBridge
          status={panel.verdict.status}
          text={panel.verdict.text}
          label="Facilitator verdict"
        />
        <ThesisColumn
          side="bear"
          status={panel.bear.status}
          text={panel.bear.text}
          thesis={panel.bear.thesis}
        />
      </div>
    </section>
  );
}
