# src/collector/service.py
"""One collector sweep (WP-3): refresh prices + fundamentals for watched tickers.

News is deliberately NOT collected here — it stays on-run (the news analyst's
write-through) to protect the Firecrawl quota. Per-instrument failures are
isolated: one bad ticker is logged + recorded in ``errors`` and the sweep
continues. The sweep itself never raises.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from src.warehouse.db import session_scope, warehouse_enabled
from src.warehouse.ingest import (
    FetchBars,
    fundamentals_stale,
    record_fundamentals,
    refresh_prices,
)
from src.warehouse.repos import list_watched

_LOG = logging.getLogger(__name__)

FetchFundamentals = Callable[[str], Awaitable[dict[str, Any]]]


async def _default_fundamentals_fetch(ticker: str) -> dict[str, Any]:
    """Default fundamentals fetcher: the existing yfinance tool, off the loop."""
    from src.tools.yfinance import fetch_fundamentals

    f = await asyncio.to_thread(fetch_fundamentals, ticker)
    return f.to_dict()


async def collect_once(
    *,
    fetch: FetchBars | None = None,
    fundamentals_fetch: FetchFundamentals | None = None,
) -> dict[str, Any]:
    """Sweep every watched instrument: incremental price refresh + (when stale)
    a fresh fundamentals snapshot. Returns a summary dict and never raises.

    ``fetch`` is passed through to ``refresh_prices`` (daily OHLCV bars);
    ``fundamentals_fetch`` replaces the yfinance tool — both injectable for tests.
    """
    summary: dict[str, Any] = {
        "instruments": 0, "prices_rows": 0, "fundamentals": 0, "errors": [],
    }
    if not warehouse_enabled():
        return summary

    try:
        async with session_scope() as session:
            watched = [
                (inst.ticker, inst.exchange, inst.screener)
                for inst in await list_watched(session)
            ]
    except Exception as exc:
        _LOG.warning("collector: could not list watched instruments: %s", exc, exc_info=exc)
        return summary

    fetch_fund = fundamentals_fetch or _default_fundamentals_fetch
    for ticker, exchange, screener in watched:
        try:
            summary["prices_rows"] += await refresh_prices(
                ticker, exchange, screener, fetch=fetch
            )
            if await fundamentals_stale(ticker, exchange):
                snapshot = await fetch_fund(ticker)
                if await record_fundamentals(ticker, exchange, screener, snapshot):
                    summary["fundamentals"] += 1
            summary["instruments"] += 1
        except Exception as exc:
            # One bad ticker never stops the sweep.
            _LOG.warning("collector: sweep failed for %s: %s", ticker, exc, exc_info=exc)
            summary["errors"].append(ticker)

    _LOG.info(
        "collector sweep complete: %d instruments, %d price rows, %d fundamentals, "
        "%d errors %s",
        summary["instruments"], summary["prices_rows"], summary["fundamentals"],
        len(summary["errors"]), summary["errors"],
    )
    return summary
