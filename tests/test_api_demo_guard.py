# tests/test_api_demo_guard.py
"""WP-5 demo guard: daily per-IP/global live-run caps on POST /api/analyze,
layered ON TOP of the per-minute limiter, with an X-Admin-Token bypass for
BOTH, plus the GET /api/quota status endpoint.

Design under test (see src/api/demo_guard.py): increment-FIRST — the quota is
consumed atomically before the limit check, so an over-limit attempt still
counts (race-proof; no check-then-increment window).
"""
from __future__ import annotations

from datetime import UTC, datetime

import pytest
from starlette.testclient import TestClient

from src.api.main import create_app
from src.config import settings as settings_mod

BODY = {"ticker": "AAPL", "investor_mode": "Neutral"}


@pytest.fixture
def no_price_backfill(monkeypatch):
    """Warehouse enabled -> prices_stale() is True and refresh_prices would hit
    yfinance; patch it to an offline no-op (same pattern as test_api_stream)."""
    import src.agents.analysts.fundamentals as fund_mod

    async def _noop(*args, **kwargs):
        return 0

    monkeypatch.setattr(fund_mod, "refresh_prices", _noop)


@pytest.fixture
def guarded_app(offline_graph, api_sqlite_warehouse, no_price_backfill, monkeypatch):
    """App factory with warehouse-backed demo guard; returns (make_client, seed)."""

    def make_client(*, ip_cap=None, global_cap=None, admin_token=None, rate_limit=100):
        if ip_cap is not None:
            monkeypatch.setenv("DEMO_RUNS_PER_IP_PER_DAY", str(ip_cap))
        if global_cap is not None:
            monkeypatch.setenv("DEMO_RUNS_GLOBAL_PER_DAY", str(global_cap))
        if admin_token is not None:
            monkeypatch.setenv("ADMIN_TOKEN", admin_token)
        settings_mod.get_settings.cache_clear()
        return TestClient(create_app(rate_limit=rate_limit))

    return make_client, api_sqlite_warehouse


def _quota_rows(seed):
    async def _go(session):
        from sqlalchemy import select

        from src.warehouse.models import DemoQuota

        rows = (await session.execute(select(DemoQuota))).scalars().all()
        return [(r.key, r.day, r.count) for r in rows]

    return seed(_go)


# ----------------------------------------------------------------- daily caps


def test_under_limit_runs_succeed(guarded_app):
    make_client, _ = guarded_app
    with make_client(ip_cap=2) as client:
        assert client.post("/api/analyze", json=BODY).status_code == 200
        assert client.post("/api/analyze", json=BODY).status_code == 200


def test_ip_cap_429_with_scope_ip(guarded_app):
    make_client, _ = guarded_app
    with make_client(ip_cap=1, global_cap=100) as client:
        assert client.post("/api/analyze", json=BODY).status_code == 200
        resp = client.post("/api/analyze", json=BODY)
    assert resp.status_code == 429
    assert resp.json() == {
        "detail": "daily live-run limit reached", "scope": "ip", "limit": 1,
    }


def test_global_cap_429_with_scope_global(guarded_app):
    make_client, _ = guarded_app
    with make_client(ip_cap=100, global_cap=1) as client:
        assert client.post("/api/analyze", json=BODY).status_code == 200
        resp = client.post("/api/analyze", json=BODY)
    assert resp.status_code == 429
    assert resp.json() == {
        "detail": "daily live-run limit reached", "scope": "global", "limit": 1,
    }


def test_quota_keys_are_per_ip_and_utc_day(guarded_app):
    make_client, seed = guarded_app
    with make_client(ip_cap=5) as client:
        client.post("/api/analyze", json=BODY)
    rows = dict((key, (day, count)) for key, day, count in _quota_rows(seed))
    today = datetime.now(UTC).date()
    assert rows["ip:testclient"] == (today, 1)
    assert rows["global"] == (today, 1)


def test_over_limit_attempt_still_consumes_quota(guarded_app):
    # Increment-first: the 429'd attempt itself counted (documented choice).
    make_client, seed = guarded_app
    with make_client(ip_cap=1) as client:
        client.post("/api/analyze", json=BODY)
        client.post("/api/analyze", json=BODY)  # 429, but still incremented
    rows = {key: count for key, _, count in _quota_rows(seed)}
    assert rows["ip:testclient"] == 2


def test_invalid_body_does_not_consume_quota(guarded_app):
    # The guard declares the body, so a 422 fires before any increment.
    make_client, seed = guarded_app
    with make_client(ip_cap=5) as client:
        assert client.post("/api/analyze", json={"ticker": "; DROP"}).status_code == 422
    assert _quota_rows(seed) == []


# --------------------------------------------------------------- admin bypass


def test_admin_token_bypasses_daily_caps_and_minute_limiter(guarded_app):
    make_client, seed = guarded_app
    # rate_limit=0: the per-minute limiter rejects EVERYTHING without the bypass.
    with make_client(ip_cap=0, global_cap=0, admin_token="s3cr3t", rate_limit=0) as client:
        denied = client.post("/api/analyze", json=BODY)
        allowed = client.post(
            "/api/analyze", json=BODY, headers={"X-Admin-Token": "s3cr3t"}
        )
        again = client.post(
            "/api/analyze", json=BODY, headers={"X-Admin-Token": "s3cr3t"}
        )
    assert denied.status_code == 429
    assert allowed.status_code == 200
    assert again.status_code == 200
    assert _quota_rows(seed) == []  # admin runs never touch the quota table


def test_bad_admin_token_is_not_a_bypass(guarded_app):
    make_client, _ = guarded_app
    with make_client(ip_cap=0, admin_token="s3cr3t") as client:
        resp = client.post(
            "/api/analyze", json=BODY, headers={"X-Admin-Token": "wrong"}
        )
    assert resp.status_code == 429


def test_admin_header_without_configured_token_is_not_a_bypass(guarded_app):
    # No ADMIN_TOKEN configured (empty/None) -> no bypass possible.
    make_client, _ = guarded_app
    with make_client(ip_cap=0) as client:
        resp = client.post(
            "/api/analyze", json=BODY, headers={"X-Admin-Token": ""}
        )
    assert resp.status_code == 429


# -------------------------------------------------------- warehouse disabled


def test_guard_noops_when_warehouse_disabled(offline_graph, monkeypatch):
    # env_isolation scrubs DATABASE_URL; only the per-minute limiter applies.
    monkeypatch.setenv("DEMO_RUNS_PER_IP_PER_DAY", "0")
    settings_mod.get_settings.cache_clear()
    with TestClient(create_app(rate_limit=2)) as client:
        assert client.post("/api/analyze", json=BODY).status_code == 200
        assert client.post("/api/analyze", json=BODY).status_code == 200
        assert client.post("/api/analyze", json=BODY).status_code == 429  # minute limiter


# ------------------------------------------------------------------ /api/quota


def test_quota_endpoint_reflects_usage(guarded_app):
    make_client, _ = guarded_app
    with make_client(ip_cap=3, global_cap=25) as client:
        before = client.get("/api/quota").json()
        client.post("/api/analyze", json=BODY)
        after = client.get("/api/quota").json()
    assert before == {
        "ip_used": 0, "ip_limit": 3, "global_used": 0, "global_limit": 25,
        "admin": False,
    }
    assert after["ip_used"] == 1
    assert after["global_used"] == 1


def test_quota_endpoint_reports_admin_flag(guarded_app):
    make_client, _ = guarded_app
    with make_client(admin_token="s3cr3t") as client:
        anon = client.get("/api/quota").json()
        admin = client.get("/api/quota", headers={"X-Admin-Token": "s3cr3t"}).json()
        wrong = client.get("/api/quota", headers={"X-Admin-Token": "nope"}).json()
    assert anon["admin"] is False
    assert admin["admin"] is True
    assert wrong["admin"] is False


def test_quota_endpoint_503_when_warehouse_disabled():
    with TestClient(create_app()) as client:
        resp = client.get("/api/quota")
    assert resp.status_code == 503
    assert resp.json()["detail"] == "warehouse disabled"
