# tests/warehouse/test_db.py
"""Engine/session plumbing: enablement guard, memoization, session_scope semantics,
and reset_engine re-configuration. Uses sqlite+aiosqlite URLs (offline)."""
from __future__ import annotations

import pytest
from sqlalchemy import func, select

from src.config import settings as settings_mod
from src.warehouse.bootstrap import create_all
from src.warehouse.db import (
    get_engine,
    get_sessionmaker,
    reset_engine,
    session_scope,
    warehouse_enabled,
)
from src.warehouse.models import Instrument


@pytest.fixture(autouse=True)
async def _clean_warehouse(monkeypatch):
    """Scrub any real DATABASE_URL and clear the engine memo around every test.

    Follows the tests/test_settings.py pattern: env via monkeypatch + the
    get_settings lru_cache cleared (conftest's env_isolation clears it too, but we
    re-clear after our own setenv/delenv calls inside tests via _reload_settings).
    """
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DB_ECHO", raising=False)
    settings_mod.get_settings.cache_clear()
    await reset_engine()
    yield
    await reset_engine()
    settings_mod.get_settings.cache_clear()


def _set_url(monkeypatch, url: str | None) -> None:
    if url is None:
        monkeypatch.delenv("DATABASE_URL", raising=False)
    else:
        monkeypatch.setenv("DATABASE_URL", url)
    settings_mod.get_settings.cache_clear()


def test_warehouse_disabled_without_database_url():
    assert warehouse_enabled() is False


def test_get_engine_raises_when_disabled():
    with pytest.raises(RuntimeError, match="warehouse disabled: DATABASE_URL not set"):
        get_engine()


def test_get_sessionmaker_raises_when_disabled():
    with pytest.raises(RuntimeError, match="warehouse disabled: DATABASE_URL not set"):
        get_sessionmaker()


async def test_enabled_path_builds_memoized_engine_and_sessionmaker(monkeypatch, tmp_path):
    _set_url(monkeypatch, f"sqlite+aiosqlite:///{tmp_path}/wh.db")
    assert warehouse_enabled() is True
    engine = get_engine()
    maker = get_sessionmaker()
    assert get_engine() is engine  # memoized
    assert get_sessionmaker() is maker
    assert engine.url.get_backend_name() == "sqlite"


async def test_session_scope_commits_on_success(monkeypatch, tmp_path):
    _set_url(monkeypatch, f"sqlite+aiosqlite:///{tmp_path}/wh.db")
    await create_all(get_engine())

    async with session_scope() as session:
        session.add(Instrument(ticker="AAPL", exchange="NASDAQ", screener="america"))

    async with get_sessionmaker()() as session:
        n = (await session.execute(select(func.count()).select_from(Instrument))).scalar_one()
    assert n == 1


async def test_session_scope_rolls_back_on_error(monkeypatch, tmp_path):
    _set_url(monkeypatch, f"sqlite+aiosqlite:///{tmp_path}/wh.db")
    await create_all(get_engine())

    with pytest.raises(ValueError, match="boom"):
        async with session_scope() as session:
            session.add(Instrument(ticker="MSFT", exchange="NASDAQ", screener="america"))
            await session.flush()
            raise ValueError("boom")

    async with get_sessionmaker()() as session:
        n = (await session.execute(select(func.count()).select_from(Instrument))).scalar_one()
    assert n == 0


async def test_reset_engine_allows_reconfiguration(monkeypatch, tmp_path):
    _set_url(monkeypatch, f"sqlite+aiosqlite:///{tmp_path}/a.db")
    engine_a = get_engine()
    assert engine_a.url.database.endswith("a.db")

    await reset_engine()
    _set_url(monkeypatch, f"sqlite+aiosqlite:///{tmp_path}/b.db")
    engine_b = get_engine()
    assert engine_b is not engine_a
    assert engine_b.url.database.endswith("b.db")
