# src/collector package — scheduled warehouse collector (WP-3).
"""In-process daily collector keeping ~30 watched global tickers fresh
(prices + fundamentals; news stays on-run to protect the Firecrawl quota).

Guarded optional subsystem: every entry point no-ops unless the warehouse is
enabled, and the scheduler additionally requires ``collector_enabled``.
"""
from src.collector.scheduler import create_scheduler, start_collector, stop_collector
from src.collector.service import collect_once
from src.collector.watchlist import SEED_WATCHLIST, seed_watchlist

__all__ = [
    "SEED_WATCHLIST",
    "collect_once",
    "create_scheduler",
    "seed_watchlist",
    "start_collector",
    "stop_collector",
]
