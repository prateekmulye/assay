"""Async SSE generator that runs the compiled LangGraph and maps its stream to events.

We drive `build_graph(debate_mode).astream(input, stream_mode=["updates","messages","values"])`.
Because stream_mode is a LIST, LangGraph yields 2-tuples `(mode, chunk)` (verified
against langgraph 1.0.4):

  mode == "updates":  chunk is dict[node_name, state_delta]  -> node_start + node_complete
  mode == "messages": chunk is (message, metadata)           -> token (metadata.langgraph_node)
  mode == "values":   chunk is the full reducer-accumulated state snapshot (kept as final)

The stub graph emits no "messages" chunks (no LLM calls); token events appear once
real nodes land. The terminal `done` event carries final_report + final_decision +
run_metrics taken from the last "values" snapshot (the reducer-accumulated state, so
run_metrics holds all per-node entries — 12 for the on-topology stub graph).
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Any

from src.api.schemas import (
    done_payload,
    error_payload,
    node_complete_payload,
    node_start_payload,
    sse_event,
    start_payload,
    token_payload,
)
from src.graph import build_graph


def _node_from_messages_meta(metadata: dict[str, Any]) -> str:
    return metadata.get("langgraph_node", "unknown")


async def analyze_event_stream(
    *,
    ticker: str,
    investor_mode: str,
    debate_mode: str | None,
    run_id: str | None = None,
) -> AsyncIterator[dict[str, str]]:
    """Yield sse-starlette event dicts for one analysis run over the compiled graph."""
    run_id = run_id or uuid.uuid4().hex[:12]
    yield sse_event("start", start_payload(run_id, ticker, investor_mode))

    final_state: dict[str, Any] = {}
    seen_started: set[str] = set()
    try:
        graph = build_graph(debate_mode)
        inputs = {"ticker": ticker, "investor_mode": investor_mode, "run_id": run_id}

        async for mode, chunk in graph.astream(
            inputs, stream_mode=["updates", "messages", "values"]
        ):
            if mode == "updates":
                # chunk: {node_name: state_delta, ...}
                for node, delta in (chunk or {}).items():
                    if node not in seen_started:
                        seen_started.add(node)
                        yield sse_event("node_start", node_start_payload(run_id, node))
                    yield sse_event(
                        "node_complete", node_complete_payload(run_id, node, delta or {})
                    )
            elif mode == "messages":
                # chunk: (message, metadata)
                message, metadata = chunk
                text = getattr(message, "content", "") or ""
                if text:
                    yield sse_event(
                        "token", token_payload(run_id, _node_from_messages_meta(metadata), text)
                    )
            elif mode == "values":
                # full reducer-accumulated state snapshot; keep the latest.
                final_state = chunk or final_state

        decision = final_state.get("final_decision") or {}
        report = final_state.get("final_report", "")
        metrics = final_state.get("run_metrics", []) or []
        yield sse_event(
            "done",
            done_payload(run_id, final_report=report, final_decision=decision, run_metrics=metrics),
        )
    except Exception as exc:  # never leak a 500 mid-stream: emit a clean error event
        yield sse_event("error", error_payload(run_id, str(exc)))
