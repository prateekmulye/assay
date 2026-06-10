# src/warehouse package — Postgres 16 + pgvector persistence layer (WP-1).
"""Guarded optional subsystem: enabled only when DATABASE_URL is set.

Public API: ``warehouse_enabled``, ``get_engine``, ``get_sessionmaker``,
``session_scope``, ``reset_engine``, plus the ``models`` module.
"""
from src.warehouse import models

__all__ = ["models"]
