# FinResearchAI — Final Product Thesis

*Council facilitator synthesis. Convergences adopted; splits ruled explicitly. Nothing below claims more confidence than the evidence carries.*

---

## 1. The authentic market gap

All four dossiers, independently, land on one hole: **no financial-information product at any price combines claim-level primary-source provenance with a public, self-graded track record of its own calls.**

Evidence: Perplexity audits at 37% misattribution (CJR); ChatGPT-4o hallucinates 20% of financial citations, Gemini 76.7%; TipRanks/Danelfin/Zacks sell scores with undisclosed weights; AlphaSense and Bloomberg cite documents but their agents' reasoning is unreplayable at $18k–$32k/yr. Every retail performance claim (+423%, +390%) is backtest theater, never live-audited. Meanwhile the one credible independent filings-grounded AI analyst — Fintool — vanished into Microsoft Office (April 2026), vacating the entire space between $20/mo generic chat and $18k/yr AlphaSense.

Who suffers it today: the **54% of AI-using retail investors who manually re-verify AI output against filings** (Investing.com, n=938) — unpaid labor they resent; the analyst/RIA segment for whom FINRA's 2026 report just made agentic-AI traceability a named compliance risk; and anyone burned by "right citation, wrong claim" semantic misrepresentation, which no product checks. A March 2026 working paper (arXiv 2603.19944) concludes LLM stock research works *only* with filings grounding and human oversight — verbatim, this architecture's design thesis.

The gap is not data (free by law) or AI (commoditized quarterly). It is the **verification layer** — unglamorous, and it accrues value only in calendar time, which is exactly why nobody built it.

## 2. The USP — why pay

**"Every number is one click from its SEC accession, FINRA settlement file, or FRED vintage — and every past call this system made is graded in public, forever."**

What users cannot get free, even trying hard:
- **Claim-level provenance**, pipeline-enforced. Free tools cite links; nothing resolves each *clause* to a pinned source artifact with a quote-and-check pass against fetched source text. Perplexity/Gemini structurally can't retrofit this — it indicts their single-pass answers.
- **A replayable, permanent research record.** No competitor at any price offers "replay this analysis event-by-event, forever." We already persist full SSE streams.
- **A forward-dated, methodology-published verdict ledger.** Track records (TipRanks' moat) cannot be backfilled by any entrant, including us — which is why starting now matters.
- **Compounding per-company language baselines** (filing-diff history) that make month-24 output unreplicable at month 1.

Why *this* architecture is the credible producer: structured-outputs-only discipline makes claim-pinning an extension, not a rewrite; the write-through warehouse + `verdicts` table make grading a join against `price_bars` (verified in code review, not asserted); per-node cost metering is the inference-unit-economics story VCs now diligence; and the debate-on/off eval harness proves an honesty culture that grading-in-public requires. The multi-agent debate is *plumbing that earns its keep* — the bear node arguing the 10b5-1 confound, persisted and replayable, is what makes provenance more than a bibliography — but it is no longer the headline. All four councilors converged here: nobody pays for topology.

**Honest limits of the defensibility argument:** the moat is time-accrued trust artifacts, not technology — LangGraph is replicable in weeks; Microsoft/Google can bundle "good enough" from both ends, and "they won't prioritize honesty features" is a bet, not a law. The track record is a *liability* for its first ~year (thin looks worse than absent — Designer's sharpest point, adopted unanimously). And one caught mis-attributed provenance chip in a "verifiable" product is existential.

## 3. Target user + wedge

**Not "investors."** The wedge buyer is the **verification-burdened professional-adjacent researcher**: RIA/analyst-prep users who must document research process (FINRA traceability pressure), plus **AI-agent builders** who need provenance-pinned, licensed-clean financial reasoning as a feed — the one segment consumable today with near-zero sales cycle (via MCP).

Wedge market: the vacated mid-market — serious, filings-grounded research between $20/mo chat and $18k/yr AlphaSense. Retail prosumers are free top-of-funnel and public-ledger audience, never the revenue thesis (Atom Finance's grave, cited by all four).

**Council split, ruled:** Growth's revision and Skeptic-VC say pilot-first (institutional/agent-builder); PO's original said pay-per-run retail-adjacent first. **Ruling: pilot-first.** Skeptic-VC's rebuttal stands — the 54% doing unpaid verification won't pay per-unit for research they distrust, and no dossier cites one surviving retail micropayment example. Per-run cost *transparency* stays as a trust artifact; per-run *pricing* as the lead motion is rejected.

## 4. The product, the loop, the 90 days

**What it becomes:** an auditable research engine — a system that watches the statutory record (EDGAR, FINRA, FRED), produces adversarially-tested analyses where every clause is a clickable provenance chip, and stakes its reputation on a public graded ledger. Sold twice (Quartr pattern): as a workflow surface and as a feed.

**User loop.** Daily: alert-shaped triggers only when the legal record moves — Form 4 cluster (2-day statutory freshness), 8-K arrival — each line a provenance chip; empty states designed as rigor ("nothing fired"), not dead product. Weekly: deep runs for position/coverage prep, replayed and shareable; ledger updated nightly as grades resolve; FINRA short-interest refresh every ~2 weeks gives a recurring cadence.

**90-day plan on existing rails:**
- **Weeks 1–4 — EDGAR watcher + yfinance quarantine.** Form 4/8-K/full-text collector extending the existing APScheduler collector and the `ingest.py` never-raises contract. Fundamentals analyst moves to XBRL companyfacts with accession provenance. yfinance/Finnhub demoted to demo-mode behind a code-level "not for production provenance" boundary — today they sit in the *production* fundamentals path, so "legally clean" is currently a destination, not a fact (Skeptic-VC's catch, adopted).
- **Weeks 2–8 — Provenance chips.** A `claims` join table; reporter emits per-clause pinned citations; a quote-and-check node validates each claim against stored source text. This is real per-node pipeline work, *then* UX (Designer's correction of Growth's "just rendering" framing, adopted) — the chip interaction (hover → source panel → verify/flag) is designed, not engineer-scoped.
- **Weeks 4–10 — Verdict Ledger.** Join `verdicts` against `price_bars`; retroactive grades labeled retroactive, forward grades dated, methodology published, graded-wrong shown with equal visual weight. **Launch gated behind minimum-N + methodology doc, or not at all** (Skeptic's gate, adopted over Growth/Designer's day-one public ledger — split ruled: a 40-call public ledger is diligence ammunition against us).
- **Weeks 6–12 — MCP server + pilot motion.** Expose warehouse/graded-verdicts/provenance feed; run pilot conversations from day 1, not day 90.
- **Weeks 8–12 (stretch, cut first) — Fusion 1: Insider Conviction vs. Narrative Divergence** (Form 4 clusters × filing-language diff via existing BGE embeddings × budgeted X sampling). **Split ruled:** PO cut it as scope creep; Skeptic/Designer kept it. Ruling: keep as the demo artifact pilots need to *see*, explicitly below chips+ledger, first casualty if the quarter slips. PO is right that five build streams is over-scoped for this team; the refusal list (no UI polish, no new nodes, no model tiers) is a hard intake guardrail.

## 5. Monetization + pricing architecture

**Free (precisely drawn):** limited runs/month (existing quota infra), full replay of any historical run, provenance browsing, and — once minimum-N gated — the public Verdict Ledger. Free = trust surface and top-of-funnel, never the business.

**Paid line:** (1) **API/MCP tier — the revenue thesis**: provenance-pinned research feed + graded-verdict dataset licensed to agent builders, RIA platforms, brokers (TipRanks/Quartr embedded pattern; retail eyeballs monetize best resold to institutions). Priced per pilot, not per rate card, until one exists. (2) **Prosumer tier (~$29–49/mo, deferred)**: custom watchlist alerts-with-reasoning, unlimited deep runs with visible unit cost, ledger analytics. Deferred because no dossier evidences WTP at that band for an unproven track record (Growth's own self-correction) — it enters only after the ledger has gradable history. Billing honesty (monthly, painless cancel, no dark patterns) is a stated commitment: it is the #1 incumbent churn driver.

## 6. Business pros/cons ledger

**Verification-as-product positioning.** *For:* attacks all thirteen competitors' documented weakness at once; regulatory tailwind (FINRA); bundlers structurally can't copy without self-indictment. *Against:* converts skeptics and professionals, not casual retail — distribution is entirely unearned; trust features aren't dopamine features; raises the stakes of any single error to existential.

**Pilot-first / API-led monetization.** *For:* matches the only exit patterns that worked (embedded distribution, data networks); agent builders buy with near-zero sales cycle; avoids Atom's death shape. *Against:* institutional cycles are long for a solo founder; a single pilot is fragile concentration; retail deferral means near-zero revenue for 2+ quarters. *Eval:* a pilot forces ground-truth accountability early — good and brutal.

**Public Verdict Ledger.** *For:* the one non-backfillable asset; converts judge-proxy eval (a grad-project tell) into the evidence class buyers reward. *Against:* 12–18-month cold start; flirts with the backtest theater we condemn unless forward-dated and methodology-published; a mediocre graded record is public evidence against the product. *Eval:* outcome-grading is strictly more honest than incumbents' claims — and strictly more falsifiable.

**EDGAR-only provenance core.** *For:* public domain, redistribution-safe, survives acquisition diligence; statutory freshness beats most paid feeds. *Against:* Form 4 clusters are episodic on a 30-ticker watchlist (quiet demos); X at $8/mo is decorative depth; licensed price data eventually required for the ledger's grading credibility.

**Demoting the debate architecture to plumbing.** *For:* every dossier says architecture-as-headline is fatal. *Against:* it was built as the flagship story — a real internal repositioning cost; the persisted adversarial reasoning is genuinely differentiating and must not be buried entirely.

## 7. Risks + kill-criteria

- **Data ToS:** yfinance/Finnhub in production = diligence red flag. *Mitigation:* quarantine in weeks 1–4 (non-negotiable); EDGAR/FINRA/FRED core; store-IDs-hydrate-on-display for X. StockTwits dropped.
- **Investment-advice line:** public graded BUY/SELL calls sharpen it; AI-enhanced pitches measurably increase fraud susceptibility (OSC). *Mitigation:* publisher's-exclusion posture reviewed by real counsel this quarter, not vibes; no alpha claims anywhere; every ledger surface labeled outcome-proxy, not advice.
- **Incumbent copy-speed:** features copyable in a quarter. *Mitigation:* the only defense is time-accrued assets (ledger history, language baselines, replay corpus) — start the clock now; accept this is a bet.
- **LLM commoditization:** favors us (open-weight, provider-agnostic, cost-metered) — model progress lowers our COGS while eroding pure-AI competitors' differentiation.
- **Cold-start trust:** thin ledger reads as evidence against. *Mitigation:* minimum-N gate, retroactive-vs-forward visual framing, calibration chart.

**Kill-criteria (falsifiable, adopted from Skeptic-VC and Growth):** (1) No scoped pilot *conversation* with a named buyer by day 60 → institutional thesis is wrong; re-scope to a narrow single-persona free tool. (2) No signed pilot or 3+ seriously engaged prospects by day 90 → stop funding this direction. (3) First 100 forward-graded verdicts calibrate no better than coin-flip → the trust product collapses; retreat to honest aggregator. (4) Any mis-attributed provenance chip surfacing in testing → ship-stop until the quote-and-check gate provably holds.

## 8. VC-readiness

**A partner meeting in 6 months must see:** one named paying (or LOI) pilot — RIA platform or agent builder; a public, forward-dated Verdict Ledger with published methodology and a non-embarrassing calibration chart; provenance-chip coverage ≥ ~95% of report claims with a zero-critical-misattribution audit; usage metrics (weekly active researchers, alert→run conversion, replay engagement), not test counts; inference gross margin per run (the metering already exists — surface it); and a clean data-rights story (EDGAR-core, yfinance quarantined) that survives diligence.

**What reads as grad-project today, and the fix:** the pitch leads with "12-node LangGraph, 555+280 tests, node latencies" — architecture-as-headline, demo-mode metrics, "investors" as buyer, judge-proxy presented as validation, ToS-gray data inside a "verifiable" product, $0/mo hobby deploy. Fixes: lead every external artifact with the ledger and the chip demo; name the buyer segment; never show judge-proxy without its ground-truth companion; move topology and test counts to an appendix; publish one audited benchmark (the Fintool playbook — its exit proves capability + benchmark credibility is an acquirable asset even pre-revenue).

**The one-paragraph honest summary:** this is currently superb engineering in the historically losing shape — free-data aggregation, retail-flavored, architecture-forward. It holds exactly three seeds of the winning shape: a run-warehouse that can become the first public AI-analyst track record, unit economics already instrumented, and an honesty culture that grading-in-public requires. The next 90 days convert those seeds or falsify the thesis — and the kill-criteria above are the contract that we will say which one happened.