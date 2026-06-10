# tests/warehouse/test_types.py
"""Warehouse TypeDecorators.

- EmbeddingVector: JSON-in-TEXT on SQLite, pgvector Vector on PG, dim-checked binds.
- UTCDateTime: rejects naive binds, normalizes aware values to UTC, reattaches
  tzinfo=UTC on result rows when the dialect (SQLite) returns naive.

Offline tests cover the SQLite fallback path only; the PG path is exercised by
tests/warehouse/test_pg_integration.py (marker: db).
"""
from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import text
from sqlalchemy.exc import StatementError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.warehouse.types import EmbeddingVector, UTCDateTime


class _Base(DeclarativeBase):
    pass


class _Row(_Base):
    __tablename__ = "emb_rows"

    id: Mapped[int] = mapped_column(primary_key=True)
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector(384), nullable=True)


class _TsRow(_Base):
    __tablename__ = "ts_rows"

    id: Mapped[int] = mapped_column(primary_key=True)
    ts: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)


@pytest.fixture
async def engine():
    eng = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with eng.begin() as conn:
        await conn.run_sync(_Base.metadata.create_all)
    yield eng
    await eng.dispose()


async def test_embedding_vector_roundtrips_384_floats_on_sqlite(engine):
    vec = [float(i) / 384.0 for i in range(384)]
    async with AsyncSession(engine) as session:
        session.add(_Row(id=1, embedding=vec))
        await session.commit()

    async with AsyncSession(engine) as session:
        row = await session.get(_Row, 1)
        assert row is not None
        assert isinstance(row.embedding, list)
        assert len(row.embedding) == 384
        assert all(isinstance(x, float) for x in row.embedding)
        assert row.embedding == pytest.approx(vec)


async def test_embedding_vector_none_stays_none(engine):
    async with AsyncSession(engine) as session:
        session.add(_Row(id=2, embedding=None))
        await session.commit()

    async with AsyncSession(engine) as session:
        row = await session.get(_Row, 2)
        assert row is not None
        assert row.embedding is None


async def test_embedding_vector_stored_as_json_text_on_sqlite(engine):
    vec = [1.0, 2.0] + [0.0] * 382
    async with AsyncSession(engine) as session:
        session.add(_Row(id=3, embedding=vec))
        await session.commit()

    async with engine.connect() as conn:
        raw = (await conn.execute(text("SELECT embedding FROM emb_rows WHERE id = 3"))).scalar_one()
    assert isinstance(raw, str)
    assert json.loads(raw) == pytest.approx(vec)


def test_embedding_vector_is_cache_ok():
    assert EmbeddingVector.cache_ok is True
    assert EmbeddingVector(384).dim == 384


def test_embedding_vector_wrong_dim_raises_on_every_dialect():
    typ = EmbeddingVector(384)
    for name in ("sqlite", "postgresql"):
        dialect = SimpleNamespace(name=name)
        with pytest.raises(ValueError, match="384"):
            typ.process_bind_param([0.1, 0.2], dialect)


async def test_embedding_vector_wrong_dim_raises_through_session(engine):
    async with AsyncSession(engine) as session:
        session.add(_Row(id=9, embedding=[0.1] * 3))
        with pytest.raises(StatementError) as excinfo:
            await session.commit()
    assert isinstance(excinfo.value.orig, ValueError)


# ----------------------------------------------------------------- UTCDateTime


def test_utc_datetime_rejects_naive_bind_directly():
    typ = UTCDateTime()
    with pytest.raises(ValueError, match="naive"):
        typ.process_bind_param(datetime(2026, 6, 10, 12, 0, 0), SimpleNamespace(name="sqlite"))


async def test_utc_datetime_naive_bind_raises_through_session(engine):
    async with AsyncSession(engine) as session:
        session.add(_TsRow(id=1, ts=datetime(2026, 6, 10, 12, 0, 0)))  # naive
        with pytest.raises(StatementError) as excinfo:
            await session.commit()
    assert isinstance(excinfo.value.orig, ValueError)


async def test_utc_datetime_aware_non_utc_roundtrips_as_utc_instant(engine):
    ist = timezone(timedelta(hours=5, minutes=30))
    bound = datetime(2026, 6, 10, 17, 30, 0, tzinfo=ist)  # == 12:00:00 UTC
    async with AsyncSession(engine) as session:
        session.add(_TsRow(id=2, ts=bound))
        await session.commit()

    async with AsyncSession(engine) as session:  # fresh session -> result processing
        row = await session.get(_TsRow, 2)
        assert row is not None and row.ts is not None
        assert row.ts.tzinfo == UTC
        assert row.ts == bound  # same instant
        assert row.ts == datetime(2026, 6, 10, 12, 0, 0, tzinfo=UTC)


async def test_utc_datetime_none_stays_none(engine):
    async with AsyncSession(engine) as session:
        session.add(_TsRow(id=3, ts=None))
        await session.commit()

    async with AsyncSession(engine) as session:
        row = await session.get(_TsRow, 3)
        assert row is not None and row.ts is None
