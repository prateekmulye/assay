# tests/collector/test_watchlist.py
"""Seed watchlist (WP-3): ~30 global instruments, screener vocabulary aligned
with the router conventions, and idempotent seeding."""
from __future__ import annotations

from sqlalchemy import func, select

from src.collector.watchlist import SEED_WATCHLIST, seed_watchlist
from src.warehouse.db import session_scope
from src.warehouse.models import Instrument

# Router prompt vocabulary (src/agents/router.py) for the markets it covers,
# plus TradingView screener names for the European seeds the router doesn't map.
_ALLOWED_SCREENERS = {
    "america", "india", "japan", "china", "hongkong",
    "germany", "france", "switzerland", "uk", "netherlands",
}

_SUFFIX_SCREENER = {
    ".NS": "india", ".T": "japan", ".SS": "china", ".SZ": "china", ".HK": "hongkong",
}


def test_seed_watchlist_is_global_and_well_formed():
    assert 28 <= len(SEED_WATCHLIST) <= 35, "watchlist should hold ~30 instruments"
    keys = {(s.ticker, s.exchange) for s in SEED_WATCHLIST}
    assert len(keys) == len(SEED_WATCHLIST), "duplicate (ticker, exchange) seed"
    for seed in SEED_WATCHLIST:
        assert seed.ticker and seed.exchange and seed.screener and seed.name and seed.country
        assert seed.screener in _ALLOWED_SCREENERS, f"unknown screener {seed.screener!r}"
        for suffix, screener in _SUFFIX_SCREENER.items():
            if seed.ticker.endswith(suffix):
                assert seed.screener == screener, (
                    f"{seed.ticker}: suffix {suffix} must use screener {screener!r}"
                )
    screeners = {s.screener for s in SEED_WATCHLIST}
    # Coverage: US, India, Japan, China, Hong Kong, and Europe.
    assert {"america", "india", "japan", "china", "hongkong"} <= screeners
    assert screeners & {"germany", "france", "switzerland", "uk", "netherlands"}


async def test_seed_watchlist_noop_when_disabled():
    # env_isolation (autouse) scrubbed DATABASE_URL -> warehouse disabled.
    assert await seed_watchlist() == 0


async def test_seed_watchlist_idempotent(sqlite_warehouse):
    first = await seed_watchlist()
    second = await seed_watchlist()  # run twice -> same instrument count
    assert first == len(SEED_WATCHLIST)
    assert second == len(SEED_WATCHLIST)

    async with session_scope() as session:
        total = (
            await session.execute(select(func.count()).select_from(Instrument))
        ).scalar_one()
        watched = (
            await session.execute(
                select(func.count()).select_from(Instrument).where(Instrument.watched.is_(True))
            )
        ).scalar_one()
    assert total == len(SEED_WATCHLIST)
    assert watched == len(SEED_WATCHLIST), "every seeded instrument must be watched"


async def test_seed_watchlist_db_error_degrades_to_zero(sqlite_warehouse, monkeypatch, caplog):
    from src.collector import watchlist as watchlist_mod

    def _boom():
        raise RuntimeError("db down")

    monkeypatch.setattr(watchlist_mod, "session_scope", _boom)
    with caplog.at_level("WARNING"):
        assert await seed_watchlist() == 0
