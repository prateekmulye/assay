# src/warehouse/types.py
"""Dialect-aware column types for the warehouse.

``EmbeddingVector(dim)`` stores a fixed-dimension embedding:
- on PostgreSQL it compiles to ``pgvector.sqlalchemy.Vector(dim)`` (real ANN-capable
  vector column);
- on every other dialect (SQLite in tests) it stores a JSON-serialized list in TEXT
  and returns ``list[float]`` on load, so the offline suite exercises the same model
  code without Postgres.
"""
from __future__ import annotations

import json
from typing import Any

from sqlalchemy import Text
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator


class EmbeddingVector(TypeDecorator):
    """Fixed-dimension float vector: pgvector on PostgreSQL, JSON-in-TEXT elsewhere."""

    impl = Text
    cache_ok = True

    def __init__(self, dim: int) -> None:
        super().__init__()
        self.dim = dim

    def load_dialect_impl(self, dialect: Dialect) -> Any:
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector

            return dialect.type_descriptor(Vector(self.dim))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value: Any, dialect: Dialect) -> Any:
        if value is None:
            return None
        if dialect.name == "postgresql":
            return value  # pgvector's own bind processing handles list/ndarray
        return json.dumps([float(x) for x in value])

    def process_result_value(self, value: Any, dialect: Dialect) -> list[float] | None:
        if value is None:
            return None
        if dialect.name == "postgresql":
            return [float(x) for x in value]  # pgvector returns an ndarray
        return [float(x) for x in json.loads(value)]
