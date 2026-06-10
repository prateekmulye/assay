# src/warehouse/db.py
"""Async engine/session plumbing for the warehouse (guarded optional subsystem).

The warehouse is enabled iff ``DATABASE_URL`` is set (``get_settings().database_url``).
Engine and sessionmaker are lazily created and module-memoized; ``reset_engine``
disposes and clears the memo so tests (and config reloads) can swap URLs.

.. caution::
   The module-memoized ``AsyncEngine`` has event-loop affinity: its connection
   pool binds to the asyncio loop it first connects on, so the engine must not
   be reused across ``asyncio.run()`` loops. Call ``await reset_engine()``
   before switching loops (tests that spin up fresh loops must do this).
"""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import event
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


def enable_sqlite_fks(engine: AsyncEngine) -> None:
    """Enforce foreign keys on SQLite engines (no-op on every other dialect).

    SQLite ships with ``foreign_keys`` OFF per connection; without this pragma
    the offline suite silently diverges from PostgreSQL (orphan inserts succeed
    and ``ON DELETE CASCADE`` never fires). Registers a sync-engine ``connect``
    listener so every pooled connection gets ``PRAGMA foreign_keys=ON``. Call
    it on any directly-created test engine too (the test fixtures do).
    """
    if engine.sync_engine.dialect.name != "sqlite":
        return

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_fk_pragma(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_engine() -> AsyncEngine:
    """Return the memoized async engine, creating it on first use."""
    global _engine
    if _engine is None:
        settings = get_settings()
        if not settings.database_url:
            raise RuntimeError("warehouse disabled: DATABASE_URL not set")
        _engine = create_async_engine(settings.database_url, echo=settings.db_echo)
        enable_sqlite_fks(_engine)
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
