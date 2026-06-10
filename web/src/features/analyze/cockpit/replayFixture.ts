/**
 * replayFixture — a small, representative recorded event stream for tests.
 * Shape mirrors the warehouse store exactly: `{ name, data: {type, …}, ts_ms }`
 * (validated against a live fake-LLM run). Deliberately tiny but covers a
 * start, a couple of node lifecycles, a token event, and a terminal done.
 */
import type { ReplayEvent } from "@/lib/api";

const RUN = "fixture-run";

export const fixtureEvents: ReplayEvent[] = [
  { name: "start", ts_ms: 1000, data: { type: "start", run_id: RUN, ticker: "AAPL", investor_mode: "Neutral" } },
  { name: "node_start", ts_ms: 1010, data: { type: "node_start", run_id: RUN, node: "router" } },
  { name: "node_complete", ts_ms: 1020, data: { type: "node_complete", run_id: RUN, node: "router", delta: { resolved_ticker: "AAPL", screener: "america" } } },
  { name: "node_start", ts_ms: 1030, data: { type: "node_start", run_id: RUN, node: "reporter" } },
  { name: "token", ts_ms: 1035, data: { type: "token", run_id: RUN, node: "reporter", text: "# AAPL " } },
  { name: "token", ts_ms: 1040, data: { type: "token", run_id: RUN, node: "reporter", text: "report" } },
  { name: "node_complete", ts_ms: 1050, data: { type: "node_complete", run_id: RUN, node: "reporter", delta: {} } },
  {
    name: "done",
    ts_ms: 1060,
    data: {
      type: "done",
      run_id: RUN,
      final_report: "# AAPL report\n\nBuy.",
      final_decision: { action: "BUY", conviction: 0.82, score: 86, rationale: "strong" },
      run_metrics: [
        { node: "router", prompt_tokens: 10, completion_tokens: 5, latency_s: 0.5, cost_usd: 0 },
        { node: "reporter", prompt_tokens: 40, completion_tokens: 30, latency_s: 0.9, cost_usd: 0 },
      ],
    },
  },
];
