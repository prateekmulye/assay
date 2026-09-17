# Assay

An experimental application for inspecting multi-agent financial research.
Python/LangGraph coordinates parallel analysts, research debate, risk review, and
reporting. FastAPI streams progress to a React client; an optional PostgreSQL +
pgvector warehouse supports saved runs, replay, and research search.

Assay develops Prateek Mulye's contribution to the SuperDataScience CP044
FinResearch AI community project. The engineering focus is orchestration,
streaming, persistence, and evaluation. Generated BUY / SELL / HOLD labels are
research outputs, not validated investment recommendations or evidence of returns.

[![CI](https://github.com/prateekmulye/assay/actions/workflows/ci.yml/badge.svg)](https://github.com/prateekmulye/assay/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/python-3.11%20%7C%203.13-3776AB?logo=python&logoColor=white)](./pyproject.toml)
[![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)](./web/package.json)
[![Demo](https://img.shields.io/badge/demo-replay--first-6E56CF)](#quickstart)

[Hugging Face Space](https://huggingface.co/spaces/prateekmulye/FinResearchAI) ·
[Local demo without API keys](#a-zero-key-demo-no-api-keys) ·
[Portfolio](https://prateekmulye.dev/)

The local demo uses a deterministic fake LLM and canned market data. Hosted
availability and live-model quality are separate from source and offline-test coverage.

![Analyze cockpit — the 12-node pipeline resolving AAPL into a verdict](docs/assets/hero-cockpit.png)

Enter a ticker to follow analyst reports, opposing research theses, and risk review.
The interface exposes node progress, generated decisions, and recorded usage metrics.
When a warehouse is configured and persistence succeeds, saved runs remain available
for inspection and replay without another model call.

## How it works

```mermaid
flowchart LR
    router[router]
    subgraph analysts [parallel analysts]
        news[news analyst]
        fund[fundamentals analyst]
        tech[technicals analyst]
    end
    subgraph debate [research debate]
        bull[bull researcher]
        bear[bear researcher]
        facilitator[facilitator]
    end
    trader[trader]
    subgraph risk [risk debate]
        cons[conservative]
        aggr[aggressive]
        arbiter[risk arbiter]
    end
    reporter[reporter]

    router --> news
    router --> fund
    router --> tech
    news --> bull
    fund --> bull
    tech --> bull
    news --> bear
    fund --> bear
    tech --> bear
    bull --> facilitator
    bear --> facilitator
    facilitator --> trader
    trader --> cons
    trader --> aggr
    cons --> arbiter
    aggr --> arbiter
    arbiter --> reporter
```

That is the debate-**on** topology (12 nodes). `build_graph("off")` swaps the three
debate nodes for a single `research_synthesis` node (10 nodes) — the single-pass
baseline the [eval harness](#comparing-debate-and-single-pass-workflows) compares against.

- **Typed state.** `AgentState` (`src/state.py`) defines graph state, with explicit
  reducers for analyst reports, debate transcripts, and accumulated metrics.
- **Structured outputs.** Pydantic models define the expected shape of agent outputs.
  Schema validation does not establish factual correctness.
- **Failure paths.** Agent fallbacks and SSE error events expose failures. They do not
  guarantee that every run completes or that every error can be recovered.
- **Warehouse.** PostgreSQL stores market data, research runs, and recorded events.
  pgvector supports semantic search; keyword search provides a fallback when
  embeddings are unavailable.
- **Optional social signal.** The news analyst can use X data when
  `X_BEARER_TOKEN` is configured. Review provider billing and the application budget
  configuration before enabling it.
- **Research interface.** The React client includes graph progress, a research library,
  replay controls, and evaluation views. Design decisions are recorded in
  [web/DESIGN.md](web/DESIGN.md).
- **Quick/deep model tiers.** Provider-agnostic `ChatOpenAI` pointed at Ollama Cloud's
  OpenAI-compatible `/v1` — `gpt-oss:20b` for routing, analysts, and reporting;
  `gpt-oss:120b` for debate, trading, risk, and judging. No OpenAI key, no GPU.
- **Local embeddings.** fastembed BGE-small (384-dim) embeds news and report summaries at
  write time; semantic search is a pgvector cosine query with a keyword fallback. No
  embedding API key.

## Screenshots

![The armed bench — the unlit 12-die pipeline is the empty state](docs/assets/analyze-armed.png)

| Research library | Timeline replay |
| --- | --- |
| ![Research library — saved runs](docs/assets/library.png) | ![Replay theater — transport bar scrubbing a recorded run](docs/assets/replay.png) |

| Market dossier | Eval dashboard |
| --- | --- |
| ![Market dossier — candlesticks, fundamentals, news](docs/assets/market.png) | ![Eval dashboard — does the debate earn its cost?](docs/assets/eval.png) |

## Comparing debate and single-pass workflows

The design draws on *TradingAgents*
([arXiv 2412.20138](https://arxiv.org/abs/2412.20138)), including bull/bear debate,
quick/deep model routing, and structured state-passing. The evaluation harness
compares debate-on and debate-off workflows:

```bash
python -m src.eval.run --tickers evals/tickers.json --label demo
```

The command runs each ticker through both topologies — debate-on and debate-off — and reports
action agreement, a blind judge's reasoning preference, score deltas, and estimated
cost, summed node latency, and token usage, persisted to the warehouse and visualized on the
Eval page.

**Interpretation limits:** judge preference is a proxy, not realized P&L. The
harness runs no backtest and establishes no returns. The judge receives verdicts
in a fixed A/B order; failed pairs are excluded; summed node latency is not
end-to-end elapsed time. These limits prevent a blanket claim that debate improves
quality or earns its cost. See [harness.py](src/eval/harness.py) and
[judge.py](src/eval/judge.py).

## Features

- **Live cockpit** — the agent graph lights node by node from the SSE stream; bull/bear
  theses stream side by side; the decision reveals with a conviction gauge and a live
  cost ticker.
- **Run library + replay** — successfully persisted event streams can be inspected
  through a timeline scrubber with transport controls.
- **Market explorer + semantic search** — global instrument search, candlestick /
  fundamentals / news dossiers, and pgvector semantic search over accumulated research.
- **Eval dashboard** — the debate A/B results: judge preference, score deltas, and a
  cost-vs-quality scatter per ticker.
- **Demo guard** — daily per-IP and global caps use warehouse counters when available.
  Without the warehouse or during database failures, daily caps are bypassed; the
  hourly burst limiter remains. Configured administrator credentials bypass both
  protections. Saved library and replay access do not require a new LLM run.
- **Fake-LLM mode** — `APP_FAKE_LLM=1` uses deterministic model outputs and canned
  market data without live model calls. It powers the e2e suite and the local demo below.

## Quickstart

### a) Zero-key demo (no API keys)

Deterministic fake LLM + canned data — the full UI with nothing to sign up for.

```bash
pip install -e ".[all]"

# seed a throwaway SQLite warehouse with a few demo runs
APP_FAKE_LLM=1 DATABASE_URL=sqlite+aiosqlite:////tmp/finr.db \
    python scripts/seed_library.py

# backend
APP_FAKE_LLM=1 DATABASE_URL=sqlite+aiosqlite:////tmp/finr.db \
    uvicorn src.api.main:app --port 7860

# frontend (second terminal) → open http://localhost:5173
cd web && npm install && npm run dev
```

### b) Real mode (live LLMs + market data)

```bash
cp .env.example .env          # add OLLAMA_API_KEY and FIRECRAWL_API_KEY
pip install -e ".[all]"

export DATABASE_URL=postgresql+asyncpg://finresearch:finresearch@localhost:5433/finresearch
docker compose up -d db       # Postgres 16 + pgvector on localhost:5433
alembic upgrade head          # create the warehouse schema

uvicorn src.api.main:app --port 7860
cd web && npm install && npm run dev
```

The warehouse is optional — without `DATABASE_URL` the graph still runs and records
JSONL traces; you lose the library, market explorer, and search.

### c) Production

The deployment configuration uses three containers: Cloudflare Tunnel →
FastAPI (API and built SPA) → PostgreSQL. The application port is bound to
loopback and the database has no published host port. Hosting, model, and data
costs depend on your provider plans and usage; a zero-cost deployment is not guaranteed.

```bash
docker compose --profile tunnel -f docker-compose.prod.yml up -d --build
```

Full runbook — VM, tunnel setup, secrets, first-run checks, updates, backups,
and the gated GitHub Actions deploy pipeline — in [`docs/deploy.md`](./docs/deploy.md).

## API

Everything under `/api`, liveness at the root:

| Endpoint | What it does |
| --- | --- |
| `POST /api/analyze` | Run the graph; streams SSE (`start` / `node_start` / `node_complete` / `token` / `done` / `error`). |
| `GET /api/library` | Past runs, newest first, filterable by ticker/status. |
| `GET /api/runs/{run_id}` | Full run detail + the recorded event stream for replay. |
| `GET /api/market/instruments?q=` | Global instrument search across the watchlist. |
| `GET /api/market/{ticker}/prices` | Daily candles (also `/fundamentals`, `/news`). |
| `GET /api/eval/results` | Persisted debate A/B eval results. |
| `GET /api/search?q=` | Semantic (pgvector) search over news + run summaries, keyword fallback. |
| `GET /api/quota` | Remaining live-run demo quota for the caller. |
| `GET /healthz` | Liveness probe. |

## Stack

- **Backend:** Python 3.11+, LangGraph, FastAPI + sse-starlette, SQLAlchemy 2 (async) +
  Alembic, Postgres 16 + pgvector, fastembed (BGE-small), APScheduler
- **LLMs:** Ollama Cloud via `langchain-openai` (`gpt-oss:20b` quick / `gpt-oss:120b` deep)
- **Data:** yfinance, Firecrawl, tradingview-ta
- **Frontend:** React 19, Vite, TypeScript, Tailwind v4 + shadcn/ui, TanStack Query,
  @xyflow/react, lightweight-charts, Recharts, Motion
- **Ops:** Docker Compose, Cloudflare Tunnel (zero-inbound-port edge), GitHub Actions
  (5-job CI + gated deploy), Dependabot, gitleaks / pip-audit / Trivy

## Repository layout

```
src/            the application — graph, agents, llm, tools, api, warehouse, collector, eval, memory, obs
web/            React SPA (Vite + TS); design tokens in web/DESIGN.md
tests/          unit + integration suites
migrations/     Alembic schema for the warehouse
evals/          curated A/B ticker set; eval reports land here
scripts/        dev utilities (demo seeder, smoke test)
docker/         container entrypoint
docs/           deploy runbook, design history (docs/superpowers/), screenshots
.github/        CI + gated deploy workflows, Dependabot
```

## Testing

Backend tests use pytest; frontend tests use Vitest. Offline tests use mocked
models and tools. Separate live-model and PostgreSQL integration checks require
the corresponding services. Consult the current CI run for results; test counts
and source inspection do not establish deployed reliability or model quality.

```bash
python -m pytest -q                 # backend, offline
ruff check . && mypy src            # lint + types
cd web && npm run lint && npm run typecheck && npm run test:run && npm run build
```

Live tests (real Ollama Cloud + Firecrawl) are opt-in: `RUN_LIVE=1 python -m pytest -m live`.
Postgres integration tests: `docker compose up -d db`, then `python -m pytest -m db`.

## Design docs

The full design history — paper analysis, codebase assessment, work breakdown, and the
per-work-package plans behind both the original build and the flagship elevation — lives
in [`docs/superpowers/`](./docs/superpowers/). Contributions welcome: see
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
