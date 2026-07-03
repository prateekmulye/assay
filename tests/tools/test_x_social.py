"""X social tool — cache-first, hard-budgeted, never-raise.

The X API is pay-per-use ($0.005 per post read), so every path that could
spend money is fenced: no token / no warehouse / fake mode never touch the
network; a warehouse-backed monthly post budget is consumed increment-FIRST
(deny happens before the paid call); fresh cached posts short-circuit the API
entirely; and any API failure degrades to [] — a run never dies over tweets.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import httpx
import pytest
import respx

from src.config import settings as settings_mod
from src.tools.x_social import SEARCH_URL, fetch_social_posts, month_budget_key


@pytest.fixture
def x_token(monkeypatch):
    monkeypatch.setenv("X_BEARER_TOKEN", "test-bearer")
    settings_mod.get_settings.cache_clear()
    yield
    settings_mod.get_settings.cache_clear()


def _api_payload() -> dict:
    return {
        "data": [
            {
                "id": "111",
                "text": "AAPL quietly shipping the best silicon roadmap in tech",
                "created_at": "2026-07-03T08:00:00.000Z",
                "public_metrics": {
                    "like_count": 5,
                    "retweet_count": 1,
                    "reply_count": 0,
                    "quote_count": 0,
                },
            },
            {
                "id": "222",
                "text": "$AAPL services margin is the story nobody prices in",
                "created_at": "2026-07-03T09:00:00.000Z",
                "public_metrics": {
                    "like_count": 90,
                    "retweet_count": 30,
                    "reply_count": 4,
                    "quote_count": 2,
                },
            },
        ],
        "meta": {"result_count": 2},
    }


@respx.mock
async def test_no_token_returns_empty_without_network(sqlite_warehouse):
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    assert await fetch_social_posts("AAPL") == []
    assert route.call_count == 0


@respx.mock
async def test_no_warehouse_returns_empty_without_network(x_token):
    # Budget can't be tracked without the warehouse -> never spend.
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    assert await fetch_social_posts("AAPL") == []
    assert route.call_count == 0


@respx.mock
async def test_fake_mode_is_deterministic_and_offline(monkeypatch):
    monkeypatch.setenv("APP_FAKE_LLM", "1")
    settings_mod.get_settings.cache_clear()
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    first = await fetch_social_posts("AAPL")
    second = await fetch_social_posts("AAPL")
    assert first and first == second
    assert all({"ts", "text", "url", "likes", "reposts"} <= set(p) for p in first)
    assert route.call_count == 0
    settings_mod.get_settings.cache_clear()


@respx.mock
async def test_happy_path_fetches_sorts_budgets_and_persists(sqlite_warehouse, x_token):
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    posts = await fetch_social_posts("AAPL")

    assert route.call_count == 1
    sent = route.calls[0].request
    assert sent.headers["authorization"] == "Bearer test-bearer"

    # Sorted by engagement, highest first.
    assert [p["url"] for p in posts] == [
        "https://x.com/i/web/status/222",
        "https://x.com/i/web/status/111",
    ]
    # reposts = retweets + quotes (30 + 2).
    assert posts[0]["likes"] == 90 and posts[0]["reposts"] == 32
    assert posts[0]["ts"].tzinfo is not None

    # Budget consumed increment-first, priced per requested post.
    from src.config.settings import get_settings
    from src.warehouse.db import session_scope
    from src.warehouse.repos import get_quota

    key, day = month_budget_key()
    async with session_scope() as session:
        spent = await get_quota(session, key, day)
    assert spent == get_settings().x_posts_per_fetch

    # Write-through: tweets land in news_items with source="x".
    from src.warehouse.repos import list_news_items, upsert_instrument

    async with session_scope() as session:
        inst = await upsert_instrument(
            session, ticker="AAPL", exchange="NASDAQ", screener="america"
        )
        rows = await list_news_items(session, inst.id, limit=10)
    assert {r.source for r in rows} == {"x"}
    assert {r.url for r in rows} == {p["url"] for p in posts}


@respx.mock
async def test_fresh_cache_short_circuits_the_paid_call(sqlite_warehouse, x_token):
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    first = await fetch_social_posts("AAPL")
    second = await fetch_social_posts("AAPL")
    assert route.call_count == 1, "second call must be served from the warehouse cache"
    assert {p["url"] for p in second} == {p["url"] for p in first}


@respx.mock
async def test_budget_cap_blocks_the_call_before_spending(sqlite_warehouse, x_token, monkeypatch):
    monkeypatch.setenv("X_POSTS_MONTHLY_CAP", "5")  # below one fetch's cost
    settings_mod.get_settings.cache_clear()
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))
    assert await fetch_social_posts("AAPL") == []
    assert route.call_count == 0


@respx.mock
async def test_budget_exhausted_serves_stale_cache(sqlite_warehouse, x_token, monkeypatch):
    # Seed an old cached tweet (outside the freshness TTL), then exhaust budget.
    from src.warehouse.ingest import record_news

    stale_ts = datetime.now(UTC) - timedelta(days=3)
    await record_news(
        "AAPL",
        "NASDAQ",
        "america",
        [
            {
                "title": "old but relevant take",
                "url": "https://x.com/i/web/status/999",
                "snippet": "old but relevant take",
                "source": "x",
                "published": stale_ts,
            }
        ],
    )
    monkeypatch.setenv("X_POSTS_MONTHLY_CAP", "5")
    settings_mod.get_settings.cache_clear()
    route = respx.get(SEARCH_URL).mock(return_value=httpx.Response(200, json=_api_payload()))

    posts = await fetch_social_posts("AAPL")
    assert route.call_count == 0
    assert [p["url"] for p in posts] == ["https://x.com/i/web/status/999"]


@respx.mock
async def test_api_failure_degrades_to_empty_never_raises(sqlite_warehouse, x_token):
    respx.get(SEARCH_URL).mock(return_value=httpx.Response(500, json={"title": "boom"}))
    assert await fetch_social_posts("AAPL") == []


@respx.mock
async def test_network_error_degrades_to_empty_never_raises(sqlite_warehouse, x_token):
    respx.get(SEARCH_URL).mock(side_effect=httpx.ConnectTimeout("nope"))
    assert await fetch_social_posts("AAPL") == []
