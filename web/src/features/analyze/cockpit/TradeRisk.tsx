/**
 * TradeRisk — the trade proposal + the risk debate, stacked as the bento's
 * 4-col desk column beside the DebateTheater (DESIGN.md §10-Analyze). The
 * causal read runs top-to-bottom: the trader sizes the call, the conservative
 * and aggressive desks (persona filaments, §8.10) state opposing stances, and
 * the arbiter resolves them — its bridge earning the beam edge-light on
 * completion, mirroring the debate theater's synthesis language.
 */
import { Flame, Scale, ShieldHalf } from "lucide-react";

import { SignalBadge } from "@/components/ui/signal-badge";
import { cn } from "@/lib/utils";

import { SkippedNote, Tile, TokenStream } from "./panelKit";
import type { NodeStatus, RiskPanel, TradePanel } from "./pipeline";

function StanceTile({
  side,
  status,
  text,
  stance,
}: {
  side: "conservative" | "aggressive";
  status: NodeStatus;
  text: string;
  stance: string | null;
}) {
  const tint =
    side === "conservative"
      ? "var(--color-conservative)"
      : "var(--color-aggressive)";
  const Icon = side === "conservative" ? ShieldHalf : Flame;
  const settled = status === "complete" && stance;
  return (
    <Tile
      title={side === "conservative" ? "Conservative" : "Aggressive"}
      phase="Risk desk"
      status={status}
      accent={tint}
      filament="always"
      flash
    >
      <div className="mb-1.5 flex items-center gap-1">
        <Icon className="size-3.5" style={{ color: tint }} aria-hidden="true" />
        <span
          className="font-mono text-2xs uppercase tracking-[0.16em]"
          style={{ color: tint }}
        >
          {side === "conservative" ? "Preserve" : "Press"}
        </span>
      </div>
      {settled ? (
        <p className="animate-rise-in text-xs leading-relaxed text-[var(--color-fg-muted)]">
          {stance}
        </p>
      ) : status === "pending" ? (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          awaiting trade proposal…
        </p>
      ) : status === "skipped" ? (
        <SkippedNote />
      ) : text ? (
        <TokenStream text={text} />
      ) : (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          stating stance…
        </p>
      )}
    </Tile>
  );
}

function TradeCard({ trade }: { trade: TradePanel }) {
  const settled = trade.status === "complete" && trade.action;
  return (
    <Tile
      title="Trade proposal"
      phase="Trader"
      status={trade.status}
      accent="var(--color-aggressive)"
      flash
    >
      {settled ? (
        <div className="animate-rise-in space-y-2">
          <div className="flex items-center gap-2">
            <SignalBadge action={trade.action!} score={trade.score ?? undefined} />
            {trade.conviction != null && (
              <span className="font-mono text-2xs tabular-nums text-[var(--color-fg-subtle)]">
                conv {(trade.conviction * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {trade.rationale && (
            <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
              {trade.rationale}
            </p>
          )}
        </div>
      ) : trade.status === "pending" ? (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          awaiting debate verdict…
        </p>
      ) : trade.status === "skipped" ? (
        <SkippedNote />
      ) : trade.text ? (
        <TokenStream text={trade.text} />
      ) : (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          sizing the trade…
        </p>
      )}
    </Tile>
  );
}

function ArbiterBridge({ status, text }: { status: NodeStatus; text: string }) {
  const settled = status === "complete" && text;
  return (
    <div
      className={cn(
        "panel-raised relative flex flex-col justify-center overflow-hidden px-4 py-3.5",
        settled && "animate-rise-in",
      )}
      style={{
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
        <span className="kicker">Arbiter resolution</span>
      </div>
      {settled ? (
        <p className="text-xs leading-relaxed text-[var(--color-fg)]">{text}</p>
      ) : status === "running" ? (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          reconciling the desks…
        </p>
      ) : status === "skipped" ? (
        <SkippedNote />
      ) : (
        <p className="font-mono text-xs text-[var(--color-fg-subtle)]">
          resolution pending
        </p>
      )}
    </div>
  );
}

export function TradeRisk({
  trade,
  risk,
}: {
  trade: TradePanel;
  risk: RiskPanel;
}) {
  return (
    <section
      aria-label="Trade and risk"
      className="flex h-full flex-col space-y-2.5"
    >
      <h3 className="kicker">Trade desk · risk arbitration</h3>
      <div className="flex flex-1 flex-col gap-2">
        <TradeCard trade={trade} />
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <StanceTile
            side="conservative"
            status={risk.conservative.status}
            text={risk.conservative.text}
            stance={risk.conservative.stance}
          />
          <StanceTile
            side="aggressive"
            status={risk.aggressive.status}
            text={risk.aggressive.text}
            stance={risk.aggressive.stance}
          />
        </div>
        <ArbiterBridge
          status={risk.arbiter.status}
          text={risk.arbiter.resolution ?? ""}
        />
      </div>
    </section>
  );
}
