# tests/test_run_persistence.py
"""Run persistence ingest API (WP-4): runs-row lifecycle (running -> finished/
error/aborted), bulk run_events ordering + idempotency + chunking, disabled
no-ops, degrade-on-error, and the verdict-cache non-interplay guarantee.

Seq contract under test: ``record_run_events`` assigns ``seq`` by 0-based list
position — callers pass the FULL ordered event stream in one call; replaying the
same (or a prefix-extended) list is idempotent via ON CONFLICT (run_id, seq)
DO NOTHING.
"""
from __future__ import annotations

from sqlalchemy import func, select

from src.memory.cache import get_cached_verdict
from src.warehouse.db import session_scope
from src.warehouse.ingest import (
    record_run_events,
    record_run_finish,
    record_run_start,
)
from src.warehouse.models import RunEvent
from src.warehouse.repos import get_run, get_run_events


def _events(n: int, *, offset: int = 0) -> list[dict]:
    return [
        {"name": f"ev-{offset + i}", "data": {"i": offset + i}, "ts_ms": 1000 + offset + i}
        for i in range(n)
    ]


async def _event_count(run_id: str) -> int:
    async with session_scope() as session:
        return (
            await session.execute(
                select(func.count()).select_from(RunEvent).where(RunEvent.run_id == run_id)
            )
        ).scalar_one()


# ------------------------------------------------------------- run lifecycle


async def test_record_run_start_creates_running_row(sqlite_warehouse):
    assert await record_run_start("r1", "AAPL", "on") is True
    async with session_scope() as session:
        run = await get_run(session, "r1")
    assert run is not None
    assert run.ticker == "AAPL"
    assert run.debate_mode == "on"
    assert run.status == "running"
    assert run.started_at.tzinfo is not None
    assert run.finished_at is None
    assert run.final_decision is None
    assert run.embedding is None  # WP-9 owns embeddings; WP-4 must leave it None


async def test_record_run_finish_finished_with_payload(sqlite_warehouse):
    decision = {"action": "BUY", "conviction": 0.8, "score": 70, "rationale": "r"}
    metrics = [{"node": "router", "cost_usd": 0.0}]
    await record_run_start("r1", "AAPL", "on")
    assert (
        await record_run_finish(
            "r1", status="finished", final_decision=decision, report="# AAPL", metrics=metrics
        )
        is True
    )
    async with session_scope() as session:
        run = await get_run(session, "r1")
    assert run is not None
    assert run.status == "finished"
    assert run.finished_at is not None
    assert run.final_decision == decision
    assert run.report == "# AAPL"
    assert run.metrics == metrics


async def test_record_run_finish_error_and_aborted_without_payload(sqlite_warehouse):
    for run_id, status in (("r-err", "error"), ("r-abort", "aborted")):
        await record_run_start(run_id, "AAPL", "on")
        assert await record_run_finish(run_id, status=status) is True
        async with session_scope() as session:
            run = await get_run(session, run_id)
        assert run is not None
        assert run.status == status
        assert run.finished_at is not None
        assert run.final_decision is None
        assert run.report is None
        assert run.metrics is None


async def test_record_run_finish_missing_run_returns_false(sqlite_warehouse):
    assert await record_run_finish("nope", status="finished") is False


# ---------------------------------------------------------------- run events


async def test_record_run_events_roundtrips_in_order(sqlite_warehouse):
    await record_run_start("r1", "AAPL", "on")
    events = _events(3)
    assert await record_run_events("r1", events) == 3
    async with session_scope() as session:
        rows = await get_run_events(session, "r1")
    assert [row.seq for row in rows] == [0, 1, 2]
    assert [row.event for row in rows] == events


async def test_record_run_events_double_call_is_idempotent(sqlite_warehouse):
    await record_run_start("r1", "AAPL", "on")
    events = _events(4)
    await record_run_events("r1", events)
    # Replaying the same full list must not duplicate rows (ON CONFLICT DO NOTHING).
    await record_run_events("r1", events)
    assert await _event_count("r1") == 4

    # A prefix-extended replay only adds the new tail.
    await record_run_events("r1", events + _events(2, offset=4))
    assert await _event_count("r1") == 6
    async with session_scope() as session:
        rows = await get_run_events(session, "r1")
    assert [row.seq for row in rows] == list(range(6))


async def test_record_run_events_chunks_large_streams(sqlite_warehouse):
    # 2500 events crosses the 2000-row chunk boundary: all rows must land.
    await record_run_start("r1", "AAPL", "on")
    events = _events(2500)
    assert await record_run_events("r1", events) == 2500
    assert await _event_count("r1") == 2500
    async with session_scope() as session:
        rows = await get_run_events(session, "r1")
    assert [row.seq for row in rows] == list(range(2500))
    assert rows[0].event == events[0]
    assert rows[-1].event == events[-1]


async def test_record_run_events_empty_list_is_noop(sqlite_warehouse):
    await record_run_start("r1", "AAPL", "on")
    assert await record_run_events("r1", []) == 0
    assert await _event_count("r1") == 0


# ------------------------------------------------------- disabled => no-ops


async def test_disabled_warehouse_run_functions_noop():
    # env_isolation (autouse) scrubbed DATABASE_URL -> warehouse disabled.
    assert await record_run_start("r1", "AAPL", "on") is False
    assert await record_run_events("r1", _events(2)) == 0
    assert await record_run_finish("r1", status="finished") is False


# --------------------------------------------------------- degrade on error


async def test_run_functions_db_error_degrades(sqlite_warehouse, monkeypatch, caplog):
    from src.warehouse import ingest as ingest_mod

    def _boom():
        raise RuntimeError("db down")

    monkeypatch.setattr(ingest_mod, "session_scope", _boom)
    with caplog.at_level("WARNING"):
        assert await record_run_start("r1", "AAPL", "on") is False
        assert await record_run_events("r1", _events(2)) == 0
        assert await record_run_finish("r1", status="finished") is False
    messages = [r.message for r in caplog.records]
    assert any("record_run_start" in m for m in messages)
    assert any("record_run_events" in m for m in messages)
    assert any("record_run_finish" in m for m in messages)


async def test_record_run_events_fk_violation_degrades(sqlite_warehouse, caplog):
    # No runs row -> FK violation inside the insert; must degrade, never raise.
    with caplog.at_level("WARNING"):
        assert await record_run_events("ghost", _events(1)) == 0
    assert any("record_run_events" in r.message for r in caplog.records)


# ------------------------------------------------- verdict-cache interplay


async def test_finished_run_does_not_feed_verdict_cache(sqlite_warehouse):
    """Runs and verdicts are separate tables: persisting a finished run must not
    create a cached verdict (only the risk arbiter's store_verdict does)."""
    decision = {"action": "BUY", "conviction": 0.9, "score": 80, "rationale": "r"}
    await record_run_start("r1", "AAPL", "on")
    await record_run_finish("r1", status="finished", final_decision=decision)
    assert await get_cached_verdict("AAPL", max_age_min=60) is None
