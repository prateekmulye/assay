# src/warehouse package — Postgres 16 + pgvector persistence layer (WP-1).
"""Guarded optional subsystem: enabled only when DATABASE_URL is set.

Public API: ``warehouse_enabled``, ``get_engine``, ``get_sessionmaker``,
``session_scope``, ``reset_engine``, plus the ``models`` module.
"""
from src.warehouse import models
from src.warehouse.db import (
    get_engine,
    get_sessionmaker,
    reset_engine,
    session_scope,
    warehouse_enabled,
)

__all__ = [
    "get_engine",
    "get_sessionmaker",
    "models",
    "reset_engine",
    "session_scope",
    "warehouse_enabled",
]
