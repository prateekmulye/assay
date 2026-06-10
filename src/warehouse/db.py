# src/warehouse/db.py
"""Async engine/session plumbing for the warehouse (guarded optional subsystem).

The warehouse is enabled iff ``DATABASE_URL`` is set (``get_settings().database_url``).
Engine and sessionmaker are lazily created and module-memoized; ``reset_engine``
disposes and clears the memo so tests (and config reloads) can swap URLs.
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.config.settings import get_settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def warehouse_enabled() -> bool:
    """True iff the warehouse is configured (DATABASE_URL set)."""
    return bool(get_settings().database_url)


def get_engine() -> AsyncEngine:
    """Return the memoized async engine, creating it on first use."""
    global _engine
    if _engine is None:
        settings = get_settings()
        if not settings.database_url:
            raise RuntimeError("warehouse disabled: DATABASE_URL not set")
        _engine = create_async_engine(settings.database_url, echo=settings.db_echo)
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Return the memoized async_sessionmaker bound to the warehouse engine."""
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _sessionmaker


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Yield an AsyncSession with commit-on-success / rollback-on-error."""
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except BaseException:
            await session.rollback()
            raise


async def reset_engine() -> None:
    """Dispose the memoized engine (if any) and clear the memo.

    Async because AsyncEngine.dispose() must run on the event loop; tests await
    this between URL swaps.
    """
    global _engine, _sessionmaker
    engine = _engine
    _engine = None
    _sessionmaker = None
    if engine is not None:
        await engine.dispose()
