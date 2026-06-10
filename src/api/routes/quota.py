"""GET /api/quota — today's demo-guard usage for the calling IP (WP-5).

Read-only: reports the UTC-day counters the demo guard increments, plus
whether the caller's X-Admin-Token grants the bypass. The UI uses this to
show "N live runs left today" and to steer capped users toward replays.
"""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request

from src.api.demo_guard import GLOBAL_QUOTA_KEY, is_admin, quota_key_for
from src.api.routes.deps import require_warehouse
from src.api.routes.dto import QuotaStatus
from src.config.settings import get_settings
from src.warehouse.db import session_scope
from src.warehouse.repos import get_quota

router = APIRouter(dependencies=[Depends(require_warehouse)])


@router.get("/quota", response_model=QuotaStatus)
async def quota(request: Request) -> QuotaStatus:
    settings = get_settings()
    day = datetime.now(UTC).date()
    async with session_scope() as session:
        ip_used = await get_quota(session, quota_key_for(request), day)
        global_used = await get_quota(session, GLOBAL_QUOTA_KEY, day)
    return QuotaStatus(
        ip_used=ip_used,
        ip_limit=settings.demo_runs_per_ip_per_day,
        global_used=global_used,
        global_limit=settings.demo_runs_global_per_day,
        admin=is_admin(request),
    )
