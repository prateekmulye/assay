# tests/integration/test_fake_llm_e2e.py
"""WP-5 crown jewel: APP_FAKE_LLM=1 + sqlite warehouse drives the REAL compiled
graph end-to-end through the API with NO network and NO mocks/monkeypatched
nodes — the fake LLM (src/llm/fake.py) and canned tool data (src/tools/
fake_data.py) are reached purely through their production call-time seams.

POST /api/analyze streams a full SSE run to `done`; the warehouse lands the
finished run + its event stream + instrument + fundamentals + news + price
bars; GET /api/library lists it and GET /api/runs/{id} replays it.
"""
from __future__ import annotations

import json

from sqlalchemy import func, select
from starlette.testclient import TestClient

from src.api.main import create_app
from src.config import settings as settings_mod


def _parse_sse(raw: str):
    raw = raw.replace("\r\n", "\n").replace("\r", "\n")
    events = []
    for block in raw.strip().split("\n\n"):
        name, data_lines = None, []
        for line in block.splitlines():
            if line.startswith("event:"):
                name = line[len("event:"):].strip()
            elif line.startswith("data:"):
                data_lines.append(line[len("data:"):].strip())
        if name and data_lines:
            events.append((name, json.loads("".join(data_lines))))
    return events


def test_fake_llm_full_run_persists_and_replays(
    api_sqlite_warehouse, monkeypatch, tmp_path
):
    monkeypatch.setenv("APP_FAKE_LLM", "1")
    settings_mod.get_settings.cache_clear()

    with TestClient(create_app(runs_dir=str(tmp_path))) as client:
        # ---- live SSE run over the real 12-node graph (zero network) --------
        resp = client.post(
            "/api/analyze", json={"ticker": "AAPL", "investor_mode": "Neutral"}
        )
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        events = _parse_sse(resp.text)
        names = [name for name, _ in events]
        assert names[0] == "start"
        assert names[-1] == "done"
        assert "error" not in names

        completed = {p["node"] for name, p in events if name == "node_complete"}
        assert {
            "router", "news_analyst", "fundamentals_analyst", "technicals_analyst",
            "bull", "bear", "facilitator", "trader",
            "risk_conservative", "risk_aggressive", "risk_arbiter", "reporter",
        } <= completed  # the full debate-on topology actually ran

        run_id = events[0][1]["run_id"]
        done = events[-1][1]
        assert done["final_decision"]["action"] == "BUY"  # AAPL demo reads bullish
        assert done["final_decision"]["score"] >= 70
        assert "AAPL" in done["final_report"]
        assert len(done["run_metrics"]) >= 12  # every node emitted its trace line

        # ---- the library lists it ------------------------------------------
        library = client.get("/api/library").json()
        assert library["total"] == 1
        summary = library["runs"][0]
        assert summary["run_id"] == run_id
        assert summary["ticker"] == "AAPL"
        assert summary["status"] == "finished"
        assert summary["final_decision"]["action"] == "BUY"
        assert summary["cost"]["total_tokens"] > 0  # fake fires CostTracker callbacks

        # ---- and the run replays --------------------------------------------
        detail = client.get(f"/api/runs/{run_id}").json()
        assert detail["source"] == "warehouse"
        assert detail["status"] == "finished"
        assert detail["report"] == done["final_report"]
        assert [e["name"] for e in detail["events"]] == names  # full ordered stream
        ts = [e["ts_ms"] for e in detail["events"]]
        assert ts == sorted(ts)

        # ---- market data landed via the analyst write-throughs --------------
        prices = client.get("/api/market/AAPL/prices").json()
        assert len(prices["bars"]) > 200  # ~252 business days of fake bars
        fundamentals = client.get("/api/market/AAPL/fundamentals").json()
        assert fundamentals["pe_ratio"] is not None
        assert fundamentals["payload"]
        news = client.get("/api/market/AAPL/news").json()
        assert len(news["items"]) == 5
        assert all(n["url"].startswith("https://demo.finresearch.ai/") for n in news["items"])

    # ---- raw warehouse row counts (post-shutdown, throwaway session) --------
    async def _counts(session):
        from src.warehouse.models import (
            FundamentalsSnapshot,
            Instrument,
            NewsItem,
            PriceBar,
            Run,
            RunEvent,
        )

        async def count(model):
            return (
                await session.execute(select(func.count()).select_from(model))
            ).scalar_one()

        run = (
            await session.execute(select(Run).where(Run.run_id == run_id))
        ).scalar_one()
        return {
            "run_status": run.status,
            "instruments": await count(Instrument),
            "fundamentals": await count(FundamentalsSnapshot),
            "news": await count(NewsItem),
            "bars": await count(PriceBar),
            "events": await count(RunEvent),
        }

    counts = api_sqlite_warehouse(_counts)
    assert counts["run_status"] == "finished"
    assert counts["instruments"] == 1  # AAPL upserted once across all hooks
    assert counts["fundamentals"] >= 1
    assert counts["news"] == 5
    assert counts["bars"] > 200
    assert counts["events"] == len(events)


def test_fake_llm_runs_are_deterministic_per_ticker(api_sqlite_warehouse, monkeypatch, tmp_path):
    monkeypatch.setenv("APP_FAKE_LLM", "1")
    settings_mod.get_settings.cache_clear()
    with TestClient(create_app(runs_dir=str(tmp_path), rate_limit=10)) as client:
        # Different tickers produce different (but valid) decisions/reports.
        first = _parse_sse(
            client.post("/api/analyze", json={"ticker": "MSFT"}).text
        )[-1][1]
        second = _parse_sse(
            client.post("/api/analyze", json={"ticker": "GOOGL"}).text
        )[-1][1]
    assert first["final_decision"]["action"] in {"BUY", "SELL", "HOLD"}
    assert second["final_decision"]["action"] in {"BUY", "SELL", "HOLD"}
    assert first["final_decision"]["score"] != second["final_decision"]["score"]
    assert "MSFT" in first["final_report"] and "GOOGL" in second["final_report"]
