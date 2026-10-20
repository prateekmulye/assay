# syntax=docker/dockerfile:1
# Production image. Three stages:
#   web-builder -> Vite build of the SPA (dist lands in the runtime stage)
#   py-builder  -> self-contained venv with the runtime extras
#   runtime     -> FastAPI serving the API + the built SPA (compose: app)
# TLS/edge is Cloudflare's (Tunnel) — no in-stack web server anymore.

# ---- Stage 1: build the Vite SPA ------------------------------------------
FROM node:26-slim AS web-builder
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---- Stage 2: build the python runtime into a self-contained venv ---------
FROM python:3.13-slim AS py-builder
WORKDIR /build
# setuptools package discovery (include = ["src*", "scripts*"]) needs the
# source tree present to build/install the project.
COPY pyproject.toml ./
COPY src ./src
COPY scripts ./scripts
# api+db is the floor (src/api imports src/warehouse, so a bare ".[api]" image
# dies on import — the WP-5 regression). web+data are needed too: the analysts'
# tools (firecrawl, yfinance, tradingview) and the COLLECTOR_ENABLED=1 sweep
# call those SDKs at runtime; without them every analysis degrades to empty.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir ".[api,db,web,data]"

# ---- Stage 3: slim runtime (compose service: app) --------------------------
FROM python:3.13-slim AS runtime
RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY --from=py-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    RUNS_DIR=/app/runs \
    PORT=7860 \
    # fastembed 0.8 resolves its cache from FASTEMBED_CACHE_PATH (default is
    # $TMPDIR/fastembed_cache, which tmpfs mounts would wipe). Pin it somewhere
    # appuser owns so the build-time bake below survives into runtime.
    FASTEMBED_CACHE_PATH=/home/appuser/.cache/fastembed
COPY src ./src
# alembic.ini + migrations ship in the image: docker/entrypoint.sh runs
# `alembic upgrade head` against DATABASE_URL before starting the API.
COPY alembic.ini ./alembic.ini
COPY migrations ./migrations
COPY docker/entrypoint.sh ./docker/entrypoint.sh
# The built SPA (dist only, never web source): src/api/edge.py serves it with
# the client-routing fallback. WEB_DIST matches the app's default lookup.
COPY --from=web-builder /web/dist ./web/dist
ENV WEB_DIST=/app/web/dist
RUN mkdir -p /app/runs \
 && chmod +x /app/docker/entrypoint.sh \
 && chown -R appuser:appuser /app
USER appuser
# Bake the fastembed ONNX model (BGE-small) at build time so the first
# /api/search and news-embedding calls never stall on a ~130MB download.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5')"
EXPOSE 7860
# One worker keeps the in-memory rate limiter coherent; scale out via the
# Redis seam + more replicas if needed.
ENTRYPOINT ["/app/docker/entrypoint.sh"]
