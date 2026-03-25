# Chart Sniper - AI-Powered Trading Chart Analyzer

> Cut through the noise. Trade with precision.

**Chart Sniper** is a full-stack AI trading analysis system that uses large language models to analyze financial chart screenshots and generate risk-managed trade setups. It features a FastAPI backend with consensus voting, a versioned prompt engineering framework, vector similarity search (RAG), structured observability logging, and an evaluation/benchmarking pipeline — all containerized with Docker and tested with 107 automated tests (unit + integration) across frontend and backend.

**Developed with AI by [Dean Krotzer](https://github.com/DeanKrotzer1111)**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Tests](https://img.shields.io/badge/tests-121%20passing-brightgreen)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green)
![CI](https://github.com/DeanKrotzer1111/chart-sniper/actions/workflows/ci.yml/badge.svg)

---

## Why I Built This

Most retail trading tools either overwhelm users with lagging indicators or offer black-box signals with no reasoning. I wanted to build something different — a system that uses LLMs not just as classifiers, but as **structured reasoning engines** that break down chart analysis into discrete, auditable steps.

The core engineering challenge was reliability: LLMs are non-deterministic, and a single API call can hallucinate patterns or flip direction based on prompt phrasing. Chart Sniper solves this with a **consensus voting pipeline** that runs multiple independent analyses, a **5-step evaluation framework** that prevents anchoring bias, and **structured output enforcement** that guarantees parseable results. The result is an AI system that explains *why* it sees a trade, not just *what* it sees.

---

## Key Features

### Multi-Provider LLM Integration
- **Claude (Anthropic)** — `claude-sonnet-4-20250514` with vision capabilities
- **GPT-4o (OpenAI)** — Multimodal chart understanding
- **Minimax** — `MiniMax-Text-01` alternative provider
- **Local LLM** — Self-hosted model support via configurable proxy

The system is provider-agnostic: swap between cloud APIs and local models without changing any analysis logic.

### Consensus-Based AI Analysis Pipeline
Chart Sniper doesn't rely on a single AI call. It implements a **multi-call consensus voting system** to improve signal reliability:

1. **Price Extraction** — LLM reads OHLC data directly from the chart image
2. **5-Step Technical Analysis** — Each call evaluates:
   - **Trend identification** (UP / DOWN / RANGE)
   - **Reversal candlestick pattern detection** (engulfing, doji, pin bars, etc.)
   - **Key level interaction** (support/resistance proximity and behavior)
   - **Momentum exhaustion signals** (wick rejection, volume divergence)
   - **Structure breaks** (Change of Character / Break of Structure)
3. **Consensus Vote** — Runs up to 3 independent analyses; early-exits if the first 2 agree. Agreement boosts confidence scores (+5% for 2/3, +12% for 3/3 consensus).

### Versioned Prompt Engineering
Prompts are stored as versioned text templates (`v1/`, `v2/`, etc.) with a registry system that supports:
- Template variable substitution (timeframe, mode)
- LRU-cached loading for performance
- Metadata tracking (version, description, creation date, changelog)
- A/B testing across prompt versions with tracked results

### FastAPI Backend with SSE Streaming
Production-grade Python backend:
- **REST API** — `/api/analyze`, `/api/history`, `/api/eval`
- **Server-Sent Events** — `/api/analyze/stream` for real-time step-by-step updates
- **Async throughout** — `httpx.AsyncClient` for non-blocking LLM calls
- **SQLite persistence** — Analysis logs, trade journal, evaluation runs
- **Structured logging** — Every LLM call tracked with latency, provider, consensus stats, and image hash

### Vector Similarity Search (RAG)
ChromaDB-powered vector store for finding similar past analyses:
- Embeds completed analyses with metadata (direction, confidence, timeframe, outcome)
- Retrieves similar historical setups when analyzing new charts
- Filterable by trading mode and timeframe
- Enables few-shot learning from past successful analyses

### Evaluation & Benchmarking Framework
Systematic measurement of AI analysis quality:
- Labeled dataset of chart examples with expected directions
- Automated benchmark runner that scores accuracy, precision, recall per direction
- Confidence calibration scoring (does higher confidence correlate with correctness?)
- Results persisted to DB for tracking prompt version improvements over time

### Risk Management Engine
Automatic calculation of position sizing and trade levels:
- 15 timeframe presets across scalp and swing modes
- Stop Loss, Take Profit (TP1 + TP2), and dollar risk calculation
- Risk:Reward ratio computation
- Full customization with manual overrides

### Two Trading Modes

| Mode | Timeframes | Risk/Trade | Target R:R |
|------|-----------|-----------|-----------|
| **Scalp** | 1-sec to 5-min | 0.10% – 0.40% | 1.3:1 – 1.56:1 |
| **Swing** | 15-min to Monthly | 0.50% – 2.00% | 1.5:1 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│   Dashboard │ Trading │ Journal │ History │ Learning │ Settings  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / SSE
┌──────────────────────────▼──────────────────────────────────────┐
│                      FastAPI Backend                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │   /api/      │  │  Services    │  │   Data Layer           ││
│  │  analyze     │  │              │  │                        ││
│  │  analyze/    │  │ ┌──────────┐ │  │ ┌──────────────────┐  ││
│  │   stream     │──│ │   LLM    │ │  │ │  SQLite (logs,   │  ││
│  │  history     │  │ │ Provider │ │  │ │  trades, evals)  │  ││
│  │  history/    │  │ └──────────┘ │  │ └──────────────────┘  ││
│  │   stats      │  │ ┌──────────┐ │  │ ┌──────────────────┐  ││
│  │  eval/run    │  │ │Consensus │ │  │ │  ChromaDB        │  ││
│  │  eval/       │  │ │  Voter   │ │  │ │  (vector store)  │  ││
│  │   results    │  │ └──────────┘ │  │ └──────────────────┘  ││
│  └──────────────┘  │ ┌──────────┐ │  └────────────────────────┘│
│                    │ │   Risk   │ │                              │
│  ┌──────────────┐  │ │ Manager  │ │  ┌────────────────────────┐│
│  │   Prompt     │  │ └──────────┘ │  │   Eval Framework      ││
│  │  Registry    │  │ ┌──────────┐ │  │  Benchmark runner     ││
│  │  v1/ v2/ ... │  │ │ Vector   │ │  │  Metrics calculator   ││
│  └──────────────┘  │ │  Store   │ │  │  Labeled datasets     ││
│                    │ └──────────┘ │  └────────────────────────┘│
│                    └──────────────┘                              │
├─────────────────────────────────────────────────────────────────┤
│                    LLM Provider Layer                            │
│     Claude API  │  OpenAI API  │  Minimax API  │  Local LLM    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.2, Vite 5.4, CSS-in-JS |
| **Backend** | FastAPI 0.115, Python 3.9+, async/await |
| **AI/LLM** | Claude API, OpenAI API, Minimax API, Local LLM |
| **Vision AI** | Base64 image encoding for multimodal analysis |
| **Vector DB** | ChromaDB 0.5 for similarity search (RAG) |
| **Database** | SQLite via aiosqlite (async) |
| **HTTP Client** | httpx (async, non-blocking) |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions (tests, lint, Docker build) |
| **Caching** | In-memory LRU with TTL for LLM response deduplication |
| **Rate Limiting** | slowapi (10 req/min on analysis endpoints) |
| **Cost Tracking** | Per-call token estimation and USD cost per provider |
| **Observability** | OpenTelemetry FastAPI instrumentation |
| **Testing** | Vitest (frontend), pytest + pytest-asyncio (backend) |
| **Linting** | Ruff (Python) |

---

## Getting Started

### Quick Start with Docker

```bash
git clone https://github.com/DeanKrotzer1111/chart-sniper.git
cd chart-sniper
cp .env.example .env
# Add your API keys to .env
docker compose up --build
```

Frontend: `http://localhost:3000` | Backend API: `http://localhost:8000/health`

### Manual Setup

**Frontend:**
```bash
npm install
npm run dev          # → http://localhost:3000
```

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Running Tests

```bash
# All tests (107 total)
make test

# Or individually:
npm test                    # Frontend: 46 unit tests
cd backend && make test     # Backend: 61 tests (unit + integration)
```

### Configuration

1. Copy `.env.example` to `.env` and add API keys, OR
2. Use the **Settings** page in the UI to enter keys at runtime (memory-only, never saved to disk)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/api/analyze` | Run chart analysis with consensus voting |
| `POST` | `/api/analyze/stream` | Stream analysis progress via SSE |
| `GET` | `/api/history` | List all trade records |
| `POST` | `/api/history` | Save a trade record |
| `GET` | `/api/history/stats` | Aggregated trade statistics |
| `POST` | `/api/eval/run` | Run evaluation benchmark |
| `GET` | `/api/eval/results` | List past evaluation runs |
| `GET` | `/api/cache/stats` | LLM response cache hit/miss statistics |

### Example API Usage

```bash
# Health check
curl http://localhost:8000/health

# Run chart analysis
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your-api-key-here" \
  -d '{
    "provider": "claude",
    "image_base64": "<base64-encoded-chart-image>",
    "timeframe": "1-Min",
    "mode": "scalp",
    "account_balance": 10000,
    "strategy": "cost_optimized"
  }'

# Check usage and billing
curl http://localhost:8000/api/billing/usage \
  -H "Authorization: Bearer your-jwt-token"

# Get cache statistics
curl http://localhost:8000/api/cache/stats

# Interactive API docs
# Visit http://localhost:8000/docs for Swagger UI
# Visit http://localhost:8000/redoc for ReDoc
```

---

## Technical Deep Dive

### LLM Provider Abstraction Layer

The `LLMProvider` class normalizes four different API formats behind a single `call()` method. Anthropic uses a Messages API with image content blocks; OpenAI uses Chat Completions with `image_url` data URIs. The abstraction handles these differences so the consensus engine never needs to know which provider it's talking to.

### Consensus Voting Algorithm

```
Call 1 → Direction + Confidence
Call 2 → Direction + Confidence
  ├── If Call 1 == Call 2 → Early exit (2/3 consensus, +5% confidence)
  └── If Call 1 != Call 2 → Run Call 3
Call 3 → Direction + Confidence
  ├── Majority vote wins (2/3 or 3/3)
  └── 3/3 unanimous → +12% confidence boost (capped at 99%)
```

### Structured Output Parsing

LLM responses are notoriously inconsistent. The `parse_json()` function handles:
- JSON wrapped in markdown code fences
- Trailing commas (common LLM mistake)
- JSON embedded in surrounding explanatory text
- Graceful `None` return on unparseable responses

### Prompt Versioning System

```
backend/app/prompts/
├── v1/
│   ├── analysis.txt    # 5-step framework with {timeframe} and {mode} vars
│   ├── price_read.txt  # OHLC extraction prompt
│   ├── system.txt      # JSON-only system prompt
│   └── meta.json       # Version metadata and changelog
├── v2/                 # Future prompt experiments
└── registry.py         # Load, render, and version-manage prompts
```

### Observability & Logging

Every analysis call is logged to SQLite with:
- Provider used, prompt version, timeframe, mode
- Direction, confidence, consensus agreement ratio
- Latency in milliseconds
- Image hash (for deduplication, not the image itself)

### Security

- **No hardcoded secrets** — API keys from env vars or runtime UI input
- **No `.env` in git** — `.gitignore` blocks `.env`, `*.local`, `backend/data/`
- **Proxy isolation** — Local LLM traffic routed through server-side proxy
- **No API keys persisted** — Frontend holds keys in React state only (memory)

---

## Project Structure

```
chart-sniper/
├── App.jsx                          # React frontend application
├── analysis.js                      # Extracted analysis logic (testable)
├── analysis.test.js                 # Frontend unit tests (46 tests)
├── main.jsx                         # React entry point
├── index.html                       # HTML shell
├── vite.config.js                   # Vite config with proxy
├── package.json                     # Frontend dependencies
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app with lifespan, CORS, routers
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── analysis.py          # /api/analyze + SSE streaming
│   │   │   ├── history.py           # /api/history CRUD
│   │   │   └── eval.py              # /api/eval benchmark runner
│   │   ├── services/
│   │   │   ├── llm.py               # Multi-provider LLM abstraction
│   │   │   ├── consensus.py         # Voting engine + JSON parser
│   │   │   ├── risk.py              # Risk management + timeframe params
│   │   │   ├── vector.py            # ChromaDB vector store (RAG)
│   │   │   ├── cache.py             # LRU response cache with TTL
│   │   │   └── cost.py              # Token usage + cost estimation
│   │   ├── prompts/
│   │   │   ├── registry.py          # Prompt version management
│   │   │   ├── v1/                  # 5-step analysis framework
│   │   │   └── v2/                  # Simplified 3-step with confidence calibration
│   │   ├── db/
│   │   │   └── database.py          # SQLite async (logs, trades, evals)
│   │   └── eval/
│   │       ├── benchmark.py         # Evaluation framework
│   │       └── datasets/labels.json # Labeled test data
│   ├── tests/                       # Backend tests (61 tests)
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Backend container
│
├── docker-compose.yml               # Full-stack orchestration
├── Dockerfile.frontend              # Frontend container (nginx)
├── nginx.conf                       # Reverse proxy config
├── Makefile                         # Dev, test, lint, docker commands
├── BLOG.md                          # Technical blog post
├── .github/workflows/ci.yml         # CI pipeline
├── .env.example                     # Environment template
├── LICENSE                          # MIT License
└── README.md
```

---

## AI Engineering Skills Demonstrated

| Competency | Implementation |
|-----------|---------------|
| **LLM API Integration** | Multi-provider abstraction (Anthropic, OpenAI, Minimax, Local) with unified async interface |
| **Prompt Engineering** | Versioned multi-step prompts with bias mitigation, structured output enforcement, and A/B testability |
| **Multimodal AI** | Vision model pipelines — base64 image encoding with provider-specific format handling |
| **Consensus Systems** | Multi-call voting with early-exit optimization and confidence calibration |
| **RAG (Retrieval-Augmented Generation)** | ChromaDB vector store for semantic similarity search over past analyses |
| **AI Evaluation** | Benchmark framework with accuracy, precision, recall, and confidence calibration metrics |
| **Structured Output Parsing** | Robust JSON extraction from non-deterministic LLM responses |
| **AI Observability** | Per-call logging with latency, provider, consensus stats, and prompt version tracking |
| **LLM Cost Management** | Per-call token estimation and USD cost tracking by provider |
| **Response Caching** | LRU cache with TTL keyed by image hash + provider + prompt version |
| **Rate Limiting** | slowapi-based request throttling on analysis endpoints |
| **Backend Engineering** | FastAPI with async SQLite, SSE streaming, Pydantic validation, OpenTelemetry |
| **DevOps** | Docker Compose, GitHub Actions CI (tests + lint + build), nginx reverse proxy, Makefile |
| **Testing** | 107 automated tests: unit tests (Vitest + pytest) and integration tests with mocked LLM |
| **Security** | No hardcoded credentials, ephemeral key handling, proxy isolation, rate limiting |

---

## Roadmap

- [x] FastAPI backend with persistent storage
- [x] Versioned prompt engineering framework
- [x] Vector similarity search (RAG) with ChromaDB
- [x] Evaluation/benchmarking pipeline
- [x] Docker containerization
- [x] CI/CD with GitHub Actions
- [x] 107 automated tests (unit + integration)
- [x] Component-based frontend architecture (14 modules)
- [x] v2 prompt version with confidence calibration
- [x] LLM response caching with hit rate tracking
- [x] Cost estimation per analysis call
- [x] Rate limiting on API endpoints
- [x] OpenTelemetry instrumentation
- [x] Makefile for dev workflow
- [x] Technical blog post
- [ ] User authentication and multi-user support
- [ ] Real-time market data integration via WebSocket
- [ ] Batch analysis across multiple timeframes
- [ ] Advanced analytics dashboard (win rate by pattern, provider, timeframe)
- [ ] Mobile-responsive layout

---

## Disclaimer

This tool is for **educational purposes only**. Nothing produced by Chart Sniper constitutes financial advice. Always do your own research and consult with a qualified financial advisor before making any trading decisions. **NFA** (Not Financial Advice).

---

## Author

**Dean Krotzer** — AI Engineer

- GitHub: [github.com/DeanKrotzer1111](https://github.com/DeanKrotzer1111)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
