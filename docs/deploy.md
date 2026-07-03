# Deploying FinResearchAI — $0/month (Oracle Always-Free + Cloudflare Tunnel)

The production stack is `docker-compose.prod.yml`, three services:

```
Internet ──HTTPS──► Cloudflare edge (TLS, CDN, DDoS)
                        ▲ outbound-only connection — NO inbound ports on your box
                    cloudflared (tunnel connector container)
                        │ http://app:7860 on the compose network
                    app (FastAPI: serves the API *and* the built SPA,
                         runs Alembic migrations on boot)
                        │
                    db  (Postgres 16 + pgvector, fully internal)
```

There is no web server to run and no certificate to manage: Cloudflare
terminates TLS at its edge and reaches the app through a tunnel the box
itself dials out. The host needs **zero open inbound ports** (SSH aside).
Security headers and SPA serving live in the app (`src/api/edge.py`).

Total cost: **$0/month** — Oracle's Always Free VM + Cloudflare's free plan.
Any always-on Linux box works identically (Hetzner ~€4/mo, a home server, a
Raspberry Pi); only §1 changes.

## 1. Get the free VM (Oracle Cloud Always Free)

1. Sign up at <https://signup.oraclecloud.com> (a card is required for
   identity verification; Always Free resources never charge it).
2. Create an instance: **Compute → Instances → Create instance**.
   - Image: **Ubuntu 24.04**.
   - Shape: **Ampere → VM.Standard.A1.Flex**, 4 OCPUs + 24 GB RAM (the full
     Always-Free allowance — take all of it, it costs nothing).
   - Add your SSH public key.
3. If creation fails with "out of capacity": Ampere capacity in popular
   regions is a lottery — retry later, try another availability domain, or
   pick a less busy home region at signup.
4. You do **not** need to open ports 80/443 in the VCN security list — the
   tunnel is outbound. Leave only SSH (22) open.

```bash
ssh ubuntu@<vm-public-ip>
```

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version   # v2 with the compose plugin is required
```

## 3. Create the Cloudflare Tunnel

Your domain must already be on Cloudflare (nameservers pointed there).

1. <https://one.dash.cloudflare.com> → **Networks → Tunnels → Create a
   tunnel → Cloudflared**. Name it (e.g. `finresearch`).
2. On the connector page, **copy the token** from the install command (the
   long `eyJ...` string after `--token`). That token is `TUNNEL_TOKEN` in §4
   — don't run the install command itself; the compose stack runs the
   connector as a container.
3. **Public Hostnames → Add**:
   - Hostname: `finresearch.prateekmulye.dev`
   - Service: **HTTP** → `app:7860`  ← the compose-network name of the app
     container; cloudflared resolves it because it runs on the same network.
4. Saving the hostname auto-creates the DNS record for the subdomain — no
   manual A/CNAME record needed.

> The token only lets a connector join *this* tunnel. Treat it as a secret
> anyway: anyone holding it can serve traffic for the hostname.

## 4. Clone and configure

```bash
sudo mkdir -p /opt/finresearchai && sudo chown $USER /opt/finresearchai
git clone https://github.com/prateekmulye/FinResearchAI.git /opt/finresearchai
cd /opt/finresearchai
cp .env.example .env && chmod 600 .env
```

Edit `.env`. Every variable the prod stack reads:

| Variable            | Required | Purpose |
|---------------------|----------|---------|
| `TUNNEL_TOKEN`      | **yes**  | Cloudflare Tunnel connector token (§3.2). |
| `PUBLIC_DOMAIN`     | yes      | The public hostname (§3.3) — pins CORS. |
| `POSTGRES_PASSWORD` | **yes**  | Password for the in-stack Postgres. No default — compose refuses to start without it. Generate: `openssl rand -base64 24`. |
| `OLLAMA_API_KEY`    | yes      | Ollama Cloud key (LLM backbone). |
| `FIRECRAWL_API_KEY` | yes      | Firecrawl key (news analyst web research). |
| `ADMIN_TOKEN`       | recommended | `X-Admin-Token` header bypassing rate/daily-demo limits. Generate: `openssl rand -hex 24`. |
| `APP_FAKE_LLM`      | no (default `0`) | `1` = deterministic offline demo LLM. Leave `0` in production. |

Everything else (`TRUST_PROXY=1`, `COLLECTOR_ENABLED=1`, `DATABASE_URL`,
`ALLOWED_ORIGINS=https://$PUBLIC_DOMAIN`, `RUNS_DIR`) is wired inside
`docker-compose.prod.yml` — don't set those in `.env`.

> **Secrets hygiene — do this before going live:**
> - **Rotate/revoke any Ollama and Firecrawl keys that were ever used in
>   development or committed anywhere.** Issue fresh keys for the deployment.
> - Use a **strong random `POSTGRES_PASSWORD`** (it's embedded in the app's
>   `DATABASE_URL`).
> - Set a **strong random `ADMIN_TOKEN`** — anyone holding it bypasses every
>   rate limit and demo quota.
> - `.env` is gitignored; keep it that way. `chmod 600 .env`.

## 5. First start

```bash
docker compose --profile tunnel -f docker-compose.prod.yml up -d --build
```

(`--profile tunnel` includes the cloudflared connector; without the flag the
stack runs app+db only, for local testing.)

The first build takes a few minutes: it `npm ci && npm run build`s the SPA,
installs the Python runtime, and bakes the fastembed BGE-small model into the
image so first-search latency is flat. On boot the app container runs
`alembic upgrade head` (retrying while Postgres finishes initializing), then
starts uvicorn serving the API and the SPA together.

First-run checks:

```bash
docker compose --profile tunnel -f docker-compose.prod.yml ps   # all Up, app (healthy)
curl -fsS http://localhost:7860/healthz                          # {"status":"ok"} on-box
curl -I https://finresearch.prateekmulye.dev/                    # 200 through the tunnel
docker compose -f docker-compose.prod.yml logs app | head -30
#   -> "entrypoint: migrations up to date", watchlist seeded, collector started
docker compose -f docker-compose.prod.yml logs cloudflared | head -20
#   -> "Registered tunnel connection" (×4)
```

Then open the site, run an analysis, and confirm it appears under the Library.

Recommended one-time Cloudflare dashboard settings for the zone:
**SSL/TLS → Full**, and **Always Use HTTPS: on**.

## 6. Updating

```bash
cd /opt/finresearchai && git pull
docker compose --profile tunnel -f docker-compose.prod.yml up -d --build
```

Rebuilds the images and recreates only what changed. Migrations re-run
automatically (no-op when already at head). The tunnel token never changes
across deploys.

## 7. Backups

All durable state is in named volumes — back up `pgdata_prod` (runs, market
data, news + embeddings, verdict cache) at minimum:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U finresearch -Fc finresearch > finresearch-$(date +%F).dump
```

Cron that daily and ship the dump off-box. `app_runs` (JSONL traces) is
nice-to-have, not critical.

## 8. CI/CD (GitHub Actions)

CI (`.github/workflows/ci.yml`) runs five parallel jobs on every PR/push:
backend matrix (`test`), frontend (`web`), real-Postgres `db-integration`
(pgvector service + `pytest -m db`), `security` (gitleaks + pip-audit +
`npm audit`), and — on pushes to main + manual dispatch only — `e2e-smoke`,
which builds the prod compose stack with `APP_FAKE_LLM=1` (cloudflared stays
off: no token in CI), curl-smokes `/`, `/healthz`, the `/api/analyze` SSE
stream, `/api/library`, and the security headers on `localhost:7860`, and
Trivy-scans the app image (CRITICAL/HIGH gate). No real API keys ever reach CI.

The deploy pipeline (`.github/workflows/deploy.yml`) triggers after a green CI
run on main (plus manual dispatch) but is **inert by default** — every job is
skipped until you arm it. To enable, in the GitHub repo go to *Settings →
Secrets and variables → Actions* and set:

1. **Variable** `DEPLOY_ENABLED` = `true` (a variable, not a secret —
   `if:` conditions can only read the `vars` context).
2. **Secrets** `VPS_HOST` (the VM's public IP), `VPS_USER` (`ubuntu` on
   Oracle's image), `VPS_SSH_KEY` (the private key whose public half is in
   the VM's `~/.ssh/authorized_keys`).

The VM must have the repo cloned at `/opt/finresearchai` with `.env`
configured per §4. Once armed, each deploy:

- pushes the app image to GHCR (`ghcr.io/prateekmulye/finresearchai-app`,
  tagged `latest` + commit sha) — the rollback artifact;
- SSHes to the VM and runs `git fetch origin main` + a detached
  `git checkout` of the exact CI-validated commit SHA, then
  `docker compose --profile tunnel -f docker-compose.prod.yml up -d --build`
  (§6's update path: the host builds from source; it does not pull GHCR).

Note: a **manually dispatched** deploy (`workflow_dispatch`) skips the
CI-success check — it builds and ships whatever `github.sha` points at, so only
dispatch it from a ref you know is green.

To pause deploys, set `DEPLOY_ENABLED` to anything but `true` — the workflow
goes back to green no-op. Dependabot (`.github/dependabot.yml`) files weekly
grouped update PRs for pip, npm (`web/`), GitHub Actions, and Docker base
images.

## Local stack testing (no domain, no tunnel)

```bash
POSTGRES_PASSWORD=test APP_FAKE_LLM=1 \
  docker compose -f docker-compose.prod.yml up -d --build
# app on http://localhost:7860/ (loopback only)
```
