# src/memory/store.py
"""Thin embedded-Chroma wrapper used by the verdict cache and (stretch) reflection.

Design rules:
- The store holds a cross-run verdict cache + future reflection log ONLY.
  Research/analyst payloads live in typed state, never here.
- We supply our OWN precomputed embeddings (from an Embedder), so collections
  are created without a Chroma embedding_function.
- Recency/filtering is done via Chroma's metadata `where` filter (deterministic),
  never via similarity search.
"""
from __future__ import annotations

import uuid
from typing import Any

import chromadb

from src.config.settings import get_settings
from src.memory.embeddings import Embedder, get_embedder


class VectorStore:
    def __init__(
        self,
        persist_dir: str | None = None,
        collection: str = "verdicts",
        embedder: Embedder | None = None,
    ) -> None:
        self._dir = persist_dir or get_settings().chroma_dir
        self._embedder = embedder or get_embedder()
        self._client = chromadb.PersistentClient(path=self._dir)
        # No embedding_function: we always pass precomputed embeddings.
        self._collection = self._client.get_or_create_collection(collection)

    def add(self, doc: str, metadata: dict[str, Any]) -> str:
        """Add one document with precomputed embedding + scalar metadata.

        `metadata` values must be scalars (str/int/float/bool). Returns the id.
        """
        doc_id = uuid.uuid4().hex
        embedding = self._embedder.embed_one(doc)
        self._collection.add(
            ids=[doc_id],
            documents=[doc],
            metadatas=[metadata],
            embeddings=[embedding],
        )
        return doc_id

    def query_by(self, where: dict[str, Any]) -> list[dict[str, Any]]:
        """Deterministic metadata query (NOT similarity). Returns a list of
        {"id", "document", "metadata"} dicts (possibly empty)."""
        res = self._collection.get(where=where, include=["documents", "metadatas"])
        ids = res.get("ids") or []
        docs = res.get("documents") or []
        metas = res.get("metadatas") or []
        out: list[dict[str, Any]] = []
        for i in range(len(ids)):
            out.append(
                {
                    "id": ids[i],
                    "document": docs[i] if i < len(docs) else None,
                    "metadata": metas[i] if i < len(metas) else {},
                }
            )
        return out
