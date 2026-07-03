"""X (Twitter) social signal — cache-first, hard-budgeted, never-raise.

The X API is pay-per-use (US$0.005 per post read), so this tool is built
around not calling it:

  fake mode      -> canned deterministic posts, zero network
  no token       -> [] (feature off)
  no warehouse   -> [] (spend can't be tracked -> never spend)
  fresh cache    -> posts served from news_items (source="x"), zero spend
  budget check   -> a monthly post counter in demo_quota, incremented BEFORE
                    the paid call (increment-first, same race-safe pattern as
                    the demo guard); over cap -> serve stale cache or []
  API call       -> ONE search/recent request pricing x_posts_per_fetch reads
  any failure    -> log + [] — a run never dies over tweets

Fetched posts write through to news_items (source="x", deduped by url_hash,
embedded by the ingest layer) so they surface in the market news feed and
/api/search for free, and become the next call's cache.
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime, timedelta
from typing import Any

import httpx

from src.config.settings import get_settings
from src.warehouse.db import session_scope, warehouse_enabled
from src.warehouse.ingest import record_news
from src.warehouse.repos import increment_quota_by, list_news_items, upsert_instrument

SEARCH_URL = "https://api.x.com/2/tweets/search/recent"
_BUDGET_KEY = "x_posts"
_LOG = logging.getLogger(__name__)


def month_budget_key() -> tuple[str, date]:
    """The (key, day) pair the monthly post budget lives under — day is pinned
    to the first of the current UTC month so one demo_quota row spans it."""
    today = datetime.now(UTC).date()
    return _BUDGET_KEY, today.replace(day=1)


def _post(ts: datetime, text: str, url: str, likes: int = 0, reposts: int = 0) -> dict[str, Any]:
    return {"ts": ts, "text": text, "url": url, "likes": likes, "reposts": reposts}


async def _cached_posts(
    ticker: str, exchange: str, screener: str, *, since: datetime | None, limit: int
) -> list[dict[str, Any]]:
    async with session_scope() as session:
        inst = await upsert_instrument(
            session, ticker=ticker, exchange=exchange, screener=screener
        )
        rows = await list_news_items(
            session, inst.id, limit=limit, source="x", since=since
        )
    # Engagement metrics aren't persisted — cached posts carry zeros; the
    # analyst treats metrics as optional garnish.
    return [_post(row.ts, row.snippet or row.title, row.url) for row in rows]


async def fetch_social_posts(
    ticker: str, exchange: str = "NASDAQ", screener: str = "america"
) -> list[dict[str, Any]]:
    """Recent high-engagement posts about ``ticker``, newest budget-safe view.

    Returns dicts of {ts, text, url, likes, reposts}, sorted by engagement
    (fresh fetches) or recency (cache reads). Never raises.
    """
    settings = get_settings()
    if settings.fake_llm:
        from src.tools.fake_data import fake_social_posts

        return fake_social_posts(ticker)
    if not settings.x_bearer_token:
        return []
    if not warehouse_enabled():
        # No warehouse -> no budget ledger -> refuse to spend.
        _LOG.info("x_social: warehouse disabled, skipping paid fetch")
        return []

    limit = max(10, min(int(settings.x_posts_per_fetch), 100))
    ttl = timedelta(hours=settings.x_cache_ttl_hours)

    try:
        fresh = await _cached_posts(
            ticker, exchange, screener, since=datetime.now(UTC) - ttl, limit=limit
        )
        if fresh:
            return fresh

        # Increment-first: the budget row moves BEFORE the paid call, so two
        # concurrent runs can't both sneak under the cap.
        key, day = month_budget_key()
        async with session_scope() as session:
            spent = await increment_quota_by(session, key, day, limit)
        if spent > settings.x_posts_monthly_cap:
            _LOG.warning(
                "x_social: monthly post budget exhausted (%d > %d) — serving stale cache",
                spent,
                settings.x_posts_monthly_cap,
            )
            return await _cached_posts(ticker, exchange, screener, since=None, limit=limit)

        query = f'("{ticker}" OR ${ticker} OR #{ticker}) lang:en -is:retweet'
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                SEARCH_URL,
                params={
                    "query": query,
                    "max_results": limit,
                    "tweet.fields": "created_at,public_metrics",
                },
                headers={"Authorization": f"Bearer {settings.x_bearer_token}"},
            )
        resp.raise_for_status()
        data = resp.json().get("data") or []

        posts: list[dict[str, Any]] = []
        for item in data:
            metrics = item.get("public_metrics") or {}
            created = item.get("created_at")
            ts = (
                datetime.fromisoformat(created).astimezone(UTC)
                if created
                else datetime.now(UTC)
            )
            posts.append(
                _post(
                    ts,
                    item.get("text") or "",
                    f"https://x.com/i/web/status/{item.get('id')}",
                    likes=int(metrics.get("like_count") or 0),
                    reposts=int(metrics.get("retweet_count") or 0)
                    + int(metrics.get("quote_count") or 0),
                )
            )
        posts.sort(key=lambda p: (p["likes"] + p["reposts"], p["ts"]), reverse=True)

        # Write-through: becomes the news feed + semantic search + next cache.
        await record_news(
            ticker,
            exchange,
            screener,
            [
                {
                    "title": p["text"][:120],
                    "url": p["url"],
                    "snippet": p["text"],
                    "source": "x",
                    "published": p["ts"],
                }
                for p in posts
            ],
        )
        return posts
    except Exception as exc:
        _LOG.warning("x_social: degraded to no social signal: %s", exc, exc_info=exc)
        return []
