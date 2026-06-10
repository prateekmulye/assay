# src/warehouse/bootstrap.py
"""Schema bootstrap for non-Alembic paths (tests, SQLite scratch DBs).

Postgres deployments use Alembic migrations (``alembic upgrade head``); tests and
the SQLite fallback create the schema directly from the ORM metadata.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncEngine

from src.warehouse.models import Base


async def create_all(engine: AsyncEngine) -> None:
    """Create every warehouse table on ``engine`` (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
