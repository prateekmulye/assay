"""Dev-only: seed a SQLite warehouse with real fake-LLM runs for the WP-8 library.

NOT part of the app or test suite — a throwaway local harness. Runs a few
analyses through the real graph (APP_FAKE_LLM stub LLM + canned market data) via
the streaming endpoint so the warehouse gets the FULL recorded event stream
(start/node_start/node_complete/token/done), then leaves the DB for uvicorn.

Usage:
    APP_FAKE_LLM=1 DATABASE_URL=sqlite+aiosqlite:////tmp/finr.db \
        python scripts/seed_library.py
"""

from __future__ import annotations

import asyncio
import os

os.environ.setdefault("APP_FAKE_LLM", "1")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/finr.db")

from starlette.testclient import TestClient  # noqa: E402

from src.api.main import create_app  # noqa: E402
from src.warehouse.bootstrap import create_all  # noqa: E402
from src.warehouse.db import get_engine  # noqa: E402

RUNS = [
    {"ticker": "AAPL", "investor_mode": "Neutral", "debate_mode": "on"},
    {"ticker": "NVDA", "investor_mode": "Bullish", "debate_mode": "on"},
    {"ticker": "TSLA", "investor_mode": "Bearish", "debate_mode": "off"},
    {"ticker": "MSFT", "investor_mode": "Neutral", "debate_mode": "on"},
    {"ticker": "GOOGL", "investor_mode": "Bullish", "debate_mode": "off"},
]


async def _bootstrap() -> None:
    await create_all(get_engine())


def main() -> None:
    asyncio.run(_bootstrap())
    app = create_app()
    with TestClient(app) as client:
        for spec in RUNS:
            with client.stream("POST", "/api/analyze", json=spec) as resp:
                frames = 0
                for _ in resp.iter_lines():
                    frames += 1
                print(f"  seeded {spec['ticker']:6s} debate={spec['debate_mode']:3s} "
                      f"({frames} lines)")
        lib = client.get("/api/library").json()
        print(f"library total = {lib['total']}")
        for run in lib["runs"]:
            fd = run.get("final_decision") or {}
            print(f"  {run['run_id'][:12]}  {run['ticker']:6s} "
                  f"{run['status']:9s} {fd.get('action', '?')}")


if __name__ == "__main__":
    main()
