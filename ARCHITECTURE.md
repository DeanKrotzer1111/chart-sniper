# Chart Sniper -- Architecture Document

**Author:** Dean Krotzer

---

## 1. System Overview

Chart Sniper is an AI-powered futures trading analysis tool. A user uploads a chart screenshot, and the system returns a directional call (BUY/SELL/NEUTRAL), confidence score, risk levels, and structured reasoning -- all derived from multi-pass LLM consensus voting over the chart image.

The high-level architecture is a three-tier system:

```
+------------------+       +------------------------+       +-------------------+
|  React Frontend  | ----> |  FastAPI Backend        | ----> |  LLM Providers    |
|                  |       |                        |       |                   |
|  - Chart upload  |  POST |  - Rate limiting       |  API  |  - Anthropic      |
|  - API key mgmt  |  /api |  - Smart model routing |  calls|  - OpenAI         |
|  - Results view  |  /... |  - Consensus pipeline  |       |  - MiniMax        |
|  - Trade journal |       |  - Risk management     |       |  - Local (llama)  |
+------------------+       |  - SQLite + ChromaDB   |       +-------------------+
                           +------------------------+
```

The frontend is a Vite-bundled React app. The backend is a Python FastAPI service with async I/O throughout. LLM calls go out to whichever provider the user has configured, abstracted behind a unified `LLMProvider` class that normalizes Anthropic's Messages API and OpenAI's Chat Completions API into a single `call()` interface.

---

## 2. Design Decisions

### Why Consensus Voting?

Single LLM calls are unreliable for financial decisions. The same model given the same chart can return BUY on one call and SELL on the next. Running 3 independent analysis passes and voting on the majority direction reduces the false signal rate significantly.

The key optimization: **early exit**. If the first 2 calls agree on direction, we skip the 3rd. In practice, this triggers roughly 60-70% of the time, cutting latency and cost by ~33% on the average request. When all calls agree, confidence is boosted by +12 points (capped at 99). When 2/3 agree, it gets +5. This produces calibrated output -- unanimous agreement genuinely correlates with higher-quality signals.

The consensus result picks the highest-confidence analysis that matches the majority direction, so we get the best reasoning text alongside the voted direction.

### Why Multi-Provider Support?

Four providers are supported: Claude (Anthropic), GPT-4o (OpenAI), MiniMax, and local LLMs via an OpenAI-compatible endpoint (e.g., llama.cpp).

The reasons are practical:

- **No vendor lock-in.** If Anthropic raises prices or has an outage, switch to OpenAI with one parameter change.
- **Different strengths.** In practice, Claude produces better structured reasoning; GPT-4o has strong vision capabilities. Users can pick what works for their charts.
- **Local LLM support.** Privacy-sensitive users can run everything on-device. Developers can iterate at zero cost without burning API credits.
- **Abstraction layer.** The `LLMProvider` class normalizes Anthropic's content-block format (`type: "image"` with base64 source) and OpenAI's format (`type: "image_url"` with data URI) behind a single `call(system_prompt, content, max_tokens)` method. Adding a new provider means implementing one format conversion method.

### Why Smart Model Routing?

Vision API calls are expensive. A single chart analysis with Claude Sonnet costs roughly $0.02-0.04 in tokens; with Opus, $0.08+. Multiply by 3 consensus passes and it adds up.

The router implements a **try-cheap-first** strategy:

1. Run consensus analysis with the cheap model (Haiku at $0.001/1K input, or GPT-4o-mini at $0.00015/1K input)
2. If the result confidence >= 60, accept it
3. If confidence < 60, escalate to the standard tier (Sonnet/GPT-4o)

Three routing strategies are available: `cost_optimized` (cheap then escalate), `quality_first` (skip straight to standard), and `balanced` (standard only, no escalation). In `cost_optimized` mode, roughly 60-70% of analyses resolve at the cheap tier, yielding ~80% cost savings on those requests. This is the same pattern used by production AI systems at scale -- classify request difficulty first, then allocate resources accordingly.

### Why Prompt Versioning?

Prompts are code. The `prompts/registry.py` module loads prompt templates from versioned directories (`v1/`, `v2/`, etc.) as text files with `{placeholder}` substitution. Each analysis result is tagged with its `prompt_version`, so you can trace exactly which prompt produced which output. This enables A/B testing different prompt strategies and makes prompts reviewable in code review, not buried in Python strings.

### Why SQLite over Postgres?

This is a single-user or small-team tool, not a SaaS platform (yet). SQLite with `aiosqlite` gives us:

- **Zero configuration.** No database server to install, configure, or maintain.
- **Async access.** `aiosqlite` wraps SQLite in a thread pool, so it doesn't block the FastAPI event loop.
- **Portable.** The entire database is one file at `data/chart_sniper.db`.
- **Migration-ready.** The schema uses standard SQL. Swapping to Postgres later means changing the driver and connection string, not rewriting queries.

---

## 3. Data Flow

Complete flow from chart upload to result:

```
User uploads chart
        |
        v
[1] React frontend converts image to base64
        |
        v
[2] POST /api/analyze  {provider, image_base64, timeframe, mode, strategy}
        |
        v
[3] SlowAPI rate limiter checks: 10 requests/min per IP
        |
        v
[4] Cache lookup: hash(image) + provider + prompt_version + timeframe + mode
    HIT  --> return cached result immediately
    MISS --> continue
        |
        v
[5] Resolve API key (X-Api-Key header, then env var fallback)
        |
        v
[6] Smart router selects model tier based on strategy
        |
        v
[7] Consensus pipeline:
    a. Price extraction call (1 LLM call, max_tokens=32)
       --> regex parse first number from response
    b. Analysis call 1 --> parse JSON --> extract direction + confidence
    c. Analysis call 2 --> parse JSON --> compare direction with call 1
    d. If calls 1 & 2 agree --> early exit (skip call 3)
       If they disagree  --> run analysis call 3
    e. Vote: majority direction wins
       Boost: +12 confidence if unanimous, +5 if 2/3 agree
        |
        v
[8] If cost_optimized and confidence < 60: escalate to next model tier,
    repeat step 7 with the better model
        |
        v
[9] Risk management: calc_levels(price, direction, timeframe_params, balance)
    --> SL, TP1, TP2, dollar risk, R:R ratio
        |
        v
[10] Cost estimation from approximate token counts
        |
        v
[11] Log to SQLite (analysis_logs table)
        |
        v
[12] Store in LRU cache (max 100 entries, 1hr TTL)
        |
        v
[13] Store in ChromaDB for similarity search on future analyses
        |
        v
[14] Return AnalysisResponse:
     {direction, confidence, currentPrice, levels, consensus,
      reasoning, pattern, support/resistance, cost, routing metadata}
```

The streaming endpoint (`POST /api/analyze/stream`) follows the same pipeline but sends SSE events at each step, so the frontend can show real-time progress ("Reading price...", "Analysis pass 2/3...", "Early consensus reached").

---

## 4. Security Model

| Layer | Implementation |
|-------|---------------|
| **API keys** | Never stored on disk. The frontend holds keys in React state (memory only, lost on refresh). The backend reads from env vars or the `X-Api-Key` header per request. |
| **Authentication** | Supabase JWT validation via `/auth/v1/user` endpoint. Falls back to an anonymous `User(id="anonymous")` when `SUPABASE_URL` is not configured (dev mode). |
| **Rate limiting** | 10 req/min per IP on analysis endpoints via SlowAPI. Prevents accidental cost blowouts and abuse. |
| **CORS** | Open in development. Must be locked to the production domain before deployment. |
| **Image data** | Chart images are base64-encoded and sent to external LLM APIs. Users should understand that chart data is processed by third-party services unless using the local provider. |

---

## 5. Cost Model

Approximate cost per single analysis (3 consensus passes + 1 price read = 4 LLM calls):

| Provider | Model | Cost/Analysis | With Early Exit (~67%) |
|----------|-------|--------------|----------------------|
| Anthropic | Haiku (cheap) | ~$0.005 | ~$0.004 |
| Anthropic | Sonnet (standard) | ~$0.04 | ~$0.03 |
| Anthropic | Opus (premium) | ~$0.15 | ~$0.11 |
| OpenAI | GPT-4o-mini (cheap) | ~$0.003 | ~$0.002 |
| OpenAI | GPT-4o (standard) | ~$0.04 | ~$0.03 |
| Local | Any | $0.00 | $0.00 |

**Smart routing impact:** With `cost_optimized` strategy, ~60-70% of analyses resolve at the cheap tier. Average cost per analysis drops from ~$0.04 (always Sonnet) to ~$0.01-0.015 (Haiku with occasional Sonnet escalation). That is a 60-70% reduction.

**Pricing tiers:** Free tier allows 5 analyses/day. Pro tier at $29/month is unlimited. At 1,000 analyses/day with `cost_optimized` routing, estimated monthly LLM cost is ~$300-500 depending on escalation rate and provider mix.

---

## 6. Scaling Considerations

**Current state:** SQLite + single FastAPI process. This handles ~100 concurrent users comfortably. LLM calls are the bottleneck -- each has a 90-second timeout, and the consensus pipeline makes 3-4 sequential calls per analysis. A single analysis takes 5-15 seconds in practice.

**Next steps if scaling is needed:**

1. **Database:** Swap SQLite for Postgres. The schema is standard SQL; only the driver changes (`asyncpg` instead of `aiosqlite`).
2. **Cache:** Replace the in-memory LRU cache with Redis. The current singleton cache does not survive restarts and is not shared across workers.
3. **Workers:** Run multiple Uvicorn workers behind a reverse proxy (nginx config already exists). The backend is stateless -- all persistent state lives in the DB and cache.
4. **Horizontal scaling:** Stateless backend instances behind a load balancer, shared Postgres + Redis. ChromaDB would need to move to a centralized instance or be replaced with pgvector.

The key insight: LLM API latency (2-8 seconds per call, up to 90 seconds on timeout) dominates total request time. Application-level optimizations matter far less than reducing LLM calls (which is exactly what early exit does).

---

## 7. Trade-offs

| Decision | Upside | Downside |
|----------|--------|----------|
| **Consensus voting** | Reduces false signals, calibrated confidence | 2-3x latency vs. single call, 2-3x cost before early exit |
| **Smart model routing** | 60-70% cost reduction on average | Adds complexity; cheap and expensive models may disagree, producing inconsistent behavior across tiers |
| **SQLite** | Zero config, portable, async-friendly | No concurrent write support; single-writer bottleneck under load |
| **In-memory LRU cache** | Simple, fast, no external dependencies | Lost on restart; not shared across workers; stale results on rapidly moving markets (1hr TTL) |
| **Multi-provider abstraction** | Flexibility, no lock-in | Each provider has quirks (token counting, image handling, rate limits) that the abstraction can't fully hide |
| **Prompt versioning** | Auditable, A/B testable | Extra indirection; currently the consensus module still has inline prompt strings alongside the registry |
| **ChromaDB for similarity search** | Enables few-shot prompting from historical analyses | Another stateful service to manage; embedding quality depends on the default model |

The overall philosophy: optimize for **correctness of trading signals** first (consensus voting), **cost** second (smart routing + early exit), and **simplicity** third (SQLite, in-memory cache, single process). Complexity is added only when it directly improves signal quality or reduces cost.
