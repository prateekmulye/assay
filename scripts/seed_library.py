"""Dev-only: seed a SQLite warehouse with real fake-LLM runs for the WP-8 library.

NOT part of the app or test suite — a throwaway local harness. Runs a few
analyses through the real graph (APP_FAKE_LLM stub LLM + canned market data) via
the streaming endpoint so the warehouse gets the FULL recorded event stream
(start/node_start/node_complete/token/done), then leaves the DB for uvicorn.

A guard refuses to run against anything that smells like a real environment
(an exported non-sqlite DATABASE_URL, or APP_FAKE_LLM disabled) unless --force
is passed.

Usage:
    APP_FAKE_LLM=1 DATABASE_URL=sqlite+aiosqlite:////tmp/finr.db \
        python scripts/seed_library.py [--force]
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys

RUNS = [
    {"ticker": "AAPL", "investor_mode": "Neutral", "debate_mode": "on"},
    {"ticker": "NVDA", "investor_mode": "Bullish", "debate_mode": "on"},
    {"ticker": "TSLA", "investor_mode": "Bearish", "debate_mode": "off"},
    {"ticker": "MSFT", "investor_mode": "Neutral", "debate_mode": "on"},
    {"ticker": "GOOGL", "investor_mode": "Bullish", "debate_mode": "off"},
]


def _guard_env(force: bool) -> None:
    """Refuse exported real-looking env (a leaked prod DB / live LLM) sans --force."""
    reasons: list[str] = []
    db = os.environ.get("DATABASE_URL", "")
    if db and not db.startswith("sqlite+aiosqlite"):
        reasons.append(
            f"DATABASE_URL is not a sqlite+aiosqlite dev database: {db!r} "
            "— seeding would write demo runs into a real warehouse."
        )
    fake = os.environ.get("APP_FAKE_LLM")
    if fake is not None and fake != "1":
        reasons.append(
            f"APP_FAKE_LLM={fake!r} — seeding would call real LLM providers "
            "and spend tokens."
        )
    if reasons and not force:
        print("seed_library: refusing to seed:", file=sys.stderr)
        for reason in reasons:
            print(f"  - {reason}", file=sys.stderr)
        print("seed_library: pass --force to override.", file=sys.stderr)
        raise SystemExit(2)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed a dev SQLite warehouse with fake-LLM demo runs."
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="bypass the dev-environment guard (non-sqlite DB / real LLM)",
    )
    args = parser.parse_args()
    _guard_env(args.force)

    os.environ.setdefault("APP_FAKE_LLM", "1")
    os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:////tmp/finr.db")

    # Imported after the env is pinned so settings resolve to the dev values.
    from starlette.testclient import TestClient

    from src.api.main import create_app
    from src.warehouse.bootstrap import create_all
    from src.warehouse.db import get_engine

    asyncio.run(create_all(get_engine()))
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
