"""Edge concerns moved off Caddy into the app itself (Cloudflare Tunnel era):
security headers on every response + the built SPA served with a
client-routing fallback. Cloudflare terminates TLS and compresses at the
edge, but the origin still owns its headers and static serving.
"""
from __future__ import annotations

from pathlib import Path

import pytest
from starlette.testclient import TestClient

from src.api.main import create_app


@pytest.fixture()
def dist(tmp_path: Path) -> Path:
    d = tmp_path / "dist"
    (d / "assets").mkdir(parents=True)
    (d / "index.html").write_text(
        '<!doctype html><title>Assay</title><div id="root"></div>',
        encoding="utf-8",
    )
    (d / "assets" / "app-abc123.js").write_text("console.log(1)", encoding="utf-8")
    return d


class TestSecurityHeaders:
    def test_all_edge_headers_on_api_responses(self) -> None:
        with TestClient(create_app()) as client:
            resp = client.get("/healthz")
        assert resp.headers["x-content-type-options"] == "nosniff"
        assert resp.headers["x-frame-options"] == "DENY"
        assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"
        assert "max-age=31536000" in resp.headers["strict-transport-security"]
        pp = resp.headers["permissions-policy"]
        for feature in ("camera=()", "microphone=()", "geolocation=()"):
            assert feature in pp, f"Permissions-Policy must disable {feature}"
        csp = resp.headers["content-security-policy"]
        assert "default-src 'self'" in csp
        assert "connect-src 'self'" in csp  # same-origin SSE must stay allowed
        assert "frame-ancestors 'none'" in csp
        assert "object-src 'none'" in csp

    def test_headers_present_even_on_404(self) -> None:
        with TestClient(create_app()) as client:
            resp = client.get("/api/definitely-not-a-route")
        assert resp.status_code == 404
        assert resp.headers["x-content-type-options"] == "nosniff"
        assert "content-security-policy" in resp.headers


class TestSpaServing:
    def test_root_serves_index_html(self, dist: Path) -> None:
        with TestClient(create_app(web_dist=str(dist))) as client:
            resp = client.get("/")
        assert resp.status_code == 200
        assert 'id="root"' in resp.text
        # index.html must revalidate or deploys strand clients on a stale
        # asset manifest.
        assert resp.headers["cache-control"] == "no-cache"

    def test_client_route_falls_back_to_index(self, dist: Path) -> None:
        with TestClient(create_app(web_dist=str(dist))) as client:
            resp = client.get("/library/some-run-id")
        assert resp.status_code == 200
        assert 'id="root"' in resp.text
        assert resp.headers["cache-control"] == "no-cache"

    def test_hashed_assets_are_immutable_cached(self, dist: Path) -> None:
        with TestClient(create_app(web_dist=str(dist))) as client:
            resp = client.get("/assets/app-abc123.js")
        assert resp.status_code == 200
        assert resp.text == "console.log(1)"
        cc = resp.headers["cache-control"]
        assert "immutable" in cc and "max-age=31536000" in cc

    def test_api_404_stays_json_not_index_fallback(self, dist: Path) -> None:
        with TestClient(create_app(web_dist=str(dist))) as client:
            resp = client.get("/api/definitely-not-a-route")
        assert resp.status_code == 404
        assert "root" not in resp.text

    def test_healthz_not_shadowed_by_spa(self, dist: Path) -> None:
        with TestClient(create_app(web_dist=str(dist))) as client:
            resp = client.get("/healthz")
        assert resp.json()["status"] == "ok"

    def test_traversal_cannot_escape_dist(self, dist: Path, tmp_path: Path) -> None:
        (tmp_path / "secret.txt").write_text("nope", encoding="utf-8")
        with TestClient(create_app(web_dist=str(dist))) as client:
            # Raw traversal path, no client-side normalization.
            resp = client.get("/assets/%2e%2e/%2e%2e/secret.txt")
        assert "nope" not in resp.text

    def test_no_dist_dir_means_api_only_mode(self, tmp_path: Path) -> None:
        with TestClient(create_app(web_dist=str(tmp_path / "missing"))) as client:
            assert client.get("/").status_code == 404
            assert client.get("/healthz").status_code == 200
