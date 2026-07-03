/**
 * EvalStates — the page-level loading / error / empty chrome for the eval
 * dashboard, kept out of the page so its render stays a thin state machine
 * (mirrors LibraryStates / ExplorerStates).
 *
 * The empty state is the one that matters: a recruiter who lands here before any
 * eval has run must see EXACTLY how to produce one — so the real command sits in
 * a milled command well (a sunken mono surface, §8.4), not a dead end. No
 * decorative chroma: the traffic-light theater is gone (One Rule clause 1).
 */
import { AlertTriangle, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Full-page shimmer skeleton matching the rail → verdict-band → scatter
 *  rhythm (heights mirror the real components so nothing jumps on load). */
export function EvalSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Run rail — the segmented well */}
      <div className="well animate-shimmer h-[4.25rem] w-full max-w-xl overflow-hidden" />
      {/* Verdict band bento */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="panel-raised animate-shimmer col-span-2 h-44 overflow-hidden lg:row-span-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="panel animate-shimmer h-[5.25rem] overflow-hidden"
          />
        ))}
      </div>
      {/* Scatter */}
      <div className="panel animate-shimmer h-[24rem] overflow-hidden" />
    </div>
  );
}

/** The eval read failed (not a 503 — the page guards that separately). */
export function EvalError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      badge="Could not load eval results"
      title="The eval index didn’t respond"
      description="Usually a cold backend. The A/B results live in the warehouse — retry in a moment, or check that the API is up."
    >
      <Button variant="key" onClick={onRetry}>
        Retry
      </Button>
    </EmptyState>
  );
}

/** The honest empty state: there are no stored eval runs yet. Shows the exact
 *  command in a milled command well, so the path forward is obvious. */
export function EvalEmpty() {
  return (
    <EmptyState
      icon={FlaskConical}
      badge="No eval runs yet"
      title="Run the ablation to see it here"
      description="The debate-on vs debate-off A/B hasn’t been recorded yet. Run the harness against the curated ticker snapshot and its summary + per-ticker comparison land on this screen."
    >
      <div className="well mt-1 w-full max-w-lg overflow-hidden text-left">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="kicker">run the eval</span>
          <span
            className="font-mono text-2xs text-[var(--color-fg-subtle)]"
            aria-hidden="true"
          >
            sh
          </span>
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-fg)]">
          <span className="select-none text-[var(--color-fg-subtle)]">$ </span>
          python -m src.eval.run \{"\n"}
          {"    "}--tickers evals/tickers.json \{"\n"}
          {"    "}--label demo
        </pre>
      </div>
    </EmptyState>
  );
}

/** The warehouse is disabled (the API guard returns 503): the eval store can’t
 *  exist at all. Distinct from "no runs yet" — it's a config state, not a
 *  do-this-next state. */
export function EvalUnavailable() {
  return (
    <EmptyState
      icon={FlaskConical}
      badge="Eval store offline"
      title="The results warehouse is disabled"
      description="This deployment is running without a database (DATABASE_URL unset), so stored eval runs can’t be served. The live Analyze pipeline still works — eval persistence needs the warehouse enabled."
    />
  );
}
