# tests/warehouse/test_types.py
"""EmbeddingVector TypeDecorator: JSON-in-TEXT on SQLite, pgvector Vector on PG.

Offline tests cover the SQLite fallback path only; the PG path is exercised by
tests/warehouse/test_pg_integration.py (marker: db).
"""
from __future__ import annotations

import json

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.warehouse.types import EmbeddingVector


class _Base(DeclarativeBase):
    pass


class _Row(_Base):
    __tablename__ = "emb_rows"

    id: Mapped[int] = mapped_column(primary_key=True)
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingVector(384), nullable=True)


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
