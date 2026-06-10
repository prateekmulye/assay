import json

import pytest

from src.api.stream import _node_from_messages_meta, analyze_event_stream


async def _collect(gen):
    return [ev async for ev in gen]


@pytest.mark.asyncio
async def test_stream_starts_and_ends_with_done(offline_graph):
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-x"
        )
    )
    names = [e["event"] for e in events]
    assert names[0] == "start"
    assert names[-1] == "done"


@pytest.mark.asyncio
async def test_stream_emits_node_complete_for_every_stub_node(offline_graph):
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-y"
        )
    )
    completed = {
        json.loads(e["data"])["node"] for e in events if e["event"] == "node_complete"
    }
    # The 12-node stub graph: every node reports completion.
    assert {
        "router",
        "news_analyst",
        "fundamentals_analyst",
        "technicals_analyst",
        "bull",
        "bear",
        "facilitator",
        "trader",
        "risk_conservative",
        "risk_aggressive",
        "risk_arbiter",
        "reporter",
    } <= completed


@pytest.mark.asyncio
async def test_done_event_carries_report_decision_and_metrics(offline_graph):
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-z"
        )
    )
    done = json.loads(events[-1]["data"])
    assert done["type"] == "done"
    assert done["run_id"] == "run-z"
    assert isinstance(done["final_report"], str) and done["final_report"]
    assert done["final_decision"]["action"] in {"BUY", "SELL", "HOLD"}
    # "on" topology = 12 nodes -> at least one metric per node. The real facilitator
    # contributes extra entries (debate turns + verdict), so assert >= 12.
    assert len(done["run_metrics"]) >= 12


@pytest.mark.asyncio
async def test_every_event_data_is_json_with_run_id(offline_graph):
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-q"
        )
    )
    for e in events:
        payload = json.loads(e["data"])
        assert payload["run_id"] == "run-q"
        assert payload["type"] == e["event"]


@pytest.mark.asyncio
async def test_stream_emits_error_event_on_graph_failure(monkeypatch):
    import src.api.stream as stream_mod

    def boom(*a, **k):
        raise RuntimeError("kaboom")

    # _compiled_graph memoizes per debate_mode; clear it so the patched build_graph
    # is actually invoked instead of a graph cached by an earlier test.
    stream_mod._compiled_graph.cache_clear()
    monkeypatch.setattr(stream_mod, "build_graph", boom)
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-e"
        )
    )
    assert events[-1]["event"] == "error"
    assert "kaboom" in json.loads(events[-1]["data"])["message"]


def test_node_from_messages_meta_reads_langgraph_node():
    assert _node_from_messages_meta({"langgraph_node": "bull"}) == "bull"
    assert _node_from_messages_meta({}) == "unknown"


# ---------------------------------------------------------------------------
# WP-4: warehouse run persistence — every analysis run lands as a runs row plus
# the full ordered SSE event stream in run_events; the warehouse never affects
# streaming (disabled or broken DB -> stream unchanged).
# ---------------------------------------------------------------------------


@pytest.fixture
def no_price_backfill(monkeypatch):
    """Neutralize the fundamentals analyst's WP-3 price backfill: with the
    warehouse ENABLED, prices_stale() is True and refresh_prices would hit
    yfinance — patch it to an offline no-op."""
    import src.agents.analysts.fundamentals as fund_mod

    async def _noop(*args, **kwargs):
        return 0

    monkeypatch.setattr(fund_mod, "refresh_prices", _noop)


async def _persisted(run_id: str):
    from src.warehouse.db import session_scope
    from src.warehouse.repos import get_run, get_run_events

    async with session_scope() as session:
        run = await get_run(session, run_id)
        rows = await get_run_events(session, run_id)
    return run, rows


def _assert_rows_match_stream(rows, events) -> None:
    """run_events rows must match the emitted SSE stream 1:1, in order."""
    assert [row.seq for row in rows] == list(range(len(events)))
    assert [row.event["name"] for row in rows] == [e["event"] for e in events]
    assert [row.event["data"] for row in rows] == [json.loads(e["data"]) for e in events]
    ts = [row.event["ts_ms"] for row in rows]
    assert all(isinstance(t, int) for t in ts)
    assert ts == sorted(ts)  # capture-time ordering powers the replay scrubber


@pytest.mark.asyncio
async def test_stream_persists_finished_run_with_full_event_stream(
    offline_graph, sqlite_warehouse, no_price_backfill
):
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-wh1"
        )
    )
    assert events[-1]["event"] == "done"

    run, rows = await _persisted("run-wh1")
    assert run is not None
    assert run.status == "finished"
    assert run.ticker == "AAPL"
    assert run.debate_mode == "on"
    assert run.finished_at is not None
    assert run.final_decision and run.final_decision["action"] in {"BUY", "SELL", "HOLD"}
    assert isinstance(run.report, str) and run.report
    assert run.metrics and len(run.metrics) >= 12  # one entry per node minimum
    assert run.embedding is None  # WP-9 owns embeddings
    _assert_rows_match_stream(rows, events)


@pytest.mark.asyncio
async def test_stream_resolves_none_debate_mode_for_persistence(
    offline_graph, sqlite_warehouse, no_price_backfill
):
    # debate_mode=None means "settings default" (on): the runs row must store
    # the resolved value, never null.
    await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode=None, run_id="run-wh2"
        )
    )
    run, _ = await _persisted("run-wh2")
    assert run is not None
    assert run.debate_mode == "on"


@pytest.mark.asyncio
async def test_stream_error_persists_error_status_and_events(sqlite_warehouse, monkeypatch):
    import src.api.stream as stream_mod

    def boom(*a, **k):
        raise RuntimeError("kaboom")

    stream_mod._compiled_graph.cache_clear()
    monkeypatch.setattr(stream_mod, "build_graph", boom)
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-wh3"
        )
    )
    assert [e["event"] for e in events] == ["start", "error"]

    run, rows = await _persisted("run-wh3")
    assert run is not None
    assert run.status == "error"
    assert run.finished_at is not None
    assert run.final_decision is None  # no payload on the error path
    assert run.report is None
    _assert_rows_match_stream(rows, events)


@pytest.mark.asyncio
async def test_stream_client_disconnect_persists_aborted(
    offline_graph, sqlite_warehouse, no_price_backfill
):
    gen = analyze_event_stream(
        ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-wh4"
    )
    first = await anext(gen)
    assert first["event"] == "start"
    await gen.aclose()  # client disconnected before done/error

    run, rows = await _persisted("run-wh4")
    assert run is not None
    assert run.status == "aborted"
    assert run.finished_at is not None
    assert run.final_decision is None
    assert [row.event["name"] for row in rows] == ["start"]


@pytest.mark.asyncio
async def test_stream_without_warehouse_is_unchanged(offline_graph):
    # env_isolation (autouse) scrubbed DATABASE_URL -> warehouse disabled. The
    # stream must be exactly the pre-WP-4 contract: same event names, valid JSON
    # payloads, no error events, nothing raised.
    from src.warehouse.db import warehouse_enabled

    assert warehouse_enabled() is False
    events = await _collect(
        analyze_event_stream(
            ticker="AAPL", investor_mode="Neutral", debate_mode="on", run_id="run-wh5"
        )
    )
    names = [e["event"] for e in events]
    assert names[0] == "start"
    assert names[-1] == "done"
    assert "error" not in names
    for e in events:
        assert set(e) == {"event", "data"}  # no extra envelope keys leaked
        assert json.loads(e["data"])["run_id"] == "run-wh5"
