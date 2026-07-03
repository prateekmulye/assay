"""Edge concerns the app now owns itself (post-Caddy, Cloudflare-Tunnel era).

Caddy used to terminate TLS, set the security headers, and serve the built
SPA. Cloudflare now terminates TLS at its edge and reaches the app through an
outbound-only tunnel — so the headers and static serving moved here, where
they are unit-testable and can't drift from the API.

Two pieces:
  * ``SecurityHeadersMiddleware`` — pure ASGI (no BaseHTTPMiddleware: it must
    never buffer the /api/analyze SSE stream). Stamps the security headers on
    every response and owns the cache policy: hashed ``/assets/*`` are
    immutable-forever, everything else (index.html and API responses without
    an explicit policy) revalidates.
  * ``mount_spa`` — a catch-all GET serving the Vite ``dist/`` with the
    client-routing fallback to index.html. /api/* and /healthz are never
    shadowed; paths that resolve outside dist are treated as SPA routes.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Mirrors the retired Caddyfile header block. The SPA is fully self-contained
# (hashed JS/CSS + self-hosted woff2 under /assets, SSE to /api on the same
# origin). style-src keeps 'unsafe-inline' for the style attributes
# recharts/motion emit; script stays 'self'-only.
SECURITY_HEADERS: dict[str, str] = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    # The app never uses these browser features; deny them outright.
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
        "font-src 'self' data:; connect-src 'self'; object-src 'none'; "
        "base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    ),
}

_IMMUTABLE = "public, max-age=31536000, immutable"
_REVALIDATE = "no-cache"


class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                for name, value in SECURITY_HEADERS.items():
                    headers[name] = value
                if "cache-control" not in headers:
                    # Vite emits content-hashed filenames under /assets ->
                    # cache forever; everything else must revalidate.
                    headers["Cache-Control"] = (
                        _IMMUTABLE if path.startswith("/assets/") else _REVALIDATE
                    )
            await send(message)

        await self.app(scope, receive, send_with_headers)


def mount_spa(app: FastAPI, dist: Path) -> None:
    """Register the SPA catch-all. Call AFTER the /api routers so explicit
    routes always win; the catch-all still refuses to shadow /api and
    /healthz so unknown API paths stay JSON 404s."""
    root = dist.resolve()
    index = root / "index.html"

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> FileResponse:
        if path == "healthz" or path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = (root / path).resolve()
        # Anything escaping dist (traversal) or missing is a client route.
        if candidate.is_relative_to(root) and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index)
