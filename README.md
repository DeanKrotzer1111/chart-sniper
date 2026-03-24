# Chart Sniper - AI-Powered Trading Chart Analyzer

> Cut through the noise. Trade with precision.

**Chart Sniper** is an intelligent trading analysis terminal that uses large language models (LLMs) to analyze financial chart screenshots and generate risk-managed trade setups. Upload a chart, select your timeframe, and let AI identify patterns, reversals, and optimal entry/exit points — all with built-in risk management.

**Developed with AI by [Dean Krotzer](https://github.com/DeanKrotzer1111)**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

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

### Structured Prompt Engineering
The analysis pipeline uses carefully engineered system prompts that:
- Enforce raw JSON output (no markdown wrapping)
- Apply a priority-based decision rules engine across all 5 analysis steps
- Prevent directional bias by requiring evidence from multiple independent signals
- Cap confidence at 99% and require explicit reasoning for each step

### Risk Management Engine
Automatic calculation of position sizing and trade levels based on:
- Account balance and per-trade risk percentage
- Timeframe-specific stop loss and take profit parameters
- Risk:Reward ratio computation with TP1 and TP2 targets
- Full customization with manual overrides for SL, TP, and risk %

### Two Trading Modes

| Mode | Timeframes | Risk/Trade | Target R:R |
|------|-----------|-----------|-----------|
| **Scalp** | 1-sec to 5-min | 0.10% – 0.40% | 1.3:1 – 1.56:1 |
| **Swing** | 15-min to Monthly | 0.50% – 2.00% | 1.5:1 |

### Trade Journal & Performance Tracking
- Log every analysis with outcome (Win / Loss / Not Taken)
- Filter history by trading mode
- Track win rate, profit factor, and performance over time
- Visual statistics dashboard with win/loss breakdown

### Learning Hub
Built-in educational content covering:
- Smart Money Concepts
- Order Blocks & Fair Value Gaps
- Break of Structure / Change of Character
- Liquidity sweeps and institutional order flow

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  React Frontend                   │
│              (Single Page Application)            │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │Dashboard │  │ Trading  │  │  Journal/History │ │
│  │  Page    │  │  Page    │  │     Pages        │ │
│  └─────────┘  └────┬─────┘  └─────────────────┘ │
│                     │                              │
│            ┌────────▼────────┐                    │
│            │  Analysis Engine │                    │
│            │                  │                    │
│            │ ┌──────────────┐│                    │
│            │ │ Price Reader  ││                    │
│            │ └──────┬───────┘│                    │
│            │        ▼        │                    │
│            │ ┌──────────────┐│                    │
│            │ │ 5-Step Prompt ││ × 3 calls         │
│            │ │  Framework   ││ (consensus)        │
│            │ └──────┬───────┘│                    │
│            │        ▼        │                    │
│            │ ┌──────────────┐│                    │
│            │ │ Consensus    ││                    │
│            │ │ Voter        ││                    │
│            │ └──────┬───────┘│                    │
│            │        ▼        │                    │
│            │ ┌──────────────┐│                    │
│            │ │ Risk Manager ││                    │
│            │ └──────────────┘│                    │
│            └─────────────────┘                    │
│                     │                              │
├─────────────────────▼──────────────────────────────┤
│              LLM Provider Layer                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐ │
│  │ Claude │ │ GPT-4o │ │Minimax │ │ Local LLM  │ │
│  │  API   │ │  API   │ │  API   │ │  (proxy)   │ │
│  └────────┘ └────────┘ └────────┘ └────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## Technical Deep Dive

### LLM Provider Abstraction Layer

The provider layer implements a unified interface across four LLM backends. Each provider has different request/response schemas (Anthropic's Messages API vs. OpenAI's Chat Completions format), but the abstraction normalizes these into a single `callLLM()` function that accepts a system prompt, message array, and image payload. Switching providers requires zero changes to the analysis logic upstream.

### Multimodal Vision Pipeline

Chart images are converted to base64 and sent as inline image content blocks. The system handles provider-specific image encoding differences:
- **Anthropic** — Uses `image` content blocks with `source.type: "base64"`
- **OpenAI** — Uses `image_url` content blocks with data URI encoding
- **Local models** — Follows OpenAI-compatible format via proxy

### Structured Output & Error Recovery

LLM responses are notoriously inconsistent in format. The parsing layer handles:
- JSON wrapped in markdown code fences (strips `` ```json `` wrappers)
- Partial or malformed JSON from truncated responses
- Graceful fallback when the model ignores formatting instructions
- Timeout handling with 90-second per-call limits

### Security Considerations

- **No hardcoded secrets** — API keys are entered at runtime via the Settings UI and held in React state only (never persisted to disk or localStorage)
- **No `.env` files** — All sensitive configuration is ephemeral and memory-only
- **Proxy isolation** — Local LLM traffic is routed through Vite's dev proxy, keeping the backend endpoint unexposed to the browser
- **`.gitignore` protection** — `.env`, `*.local`, and `dist/` are excluded from version control

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18.2 (Hooks-based, no class components) |
| **Build Tool** | Vite 5.4 with HMR |
| **AI/LLM** | Claude API, OpenAI API, Minimax API, Local LLM |
| **Vision AI** | Base64 image encoding for multimodal LLM analysis |
| **Styling** | Custom CSS-in-JS with glassmorphism design system |
| **State** | React useState/useEffect (lightweight, no Redux) |
| **Proxy** | Vite dev server proxy for local LLM routing |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An API key from at least one supported provider (Anthropic, OpenAI, or Minimax) — or a local LLM server

### Installation

```bash
git clone https://github.com/DeanKrotzer1111/chart-sniper.git
cd chart-sniper
npm install
```

### Running the App

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

### Configuration

1. Navigate to **Settings** in the sidebar
2. Select your AI provider
3. Enter your API key
4. Set your account balance for risk calculations
5. Upload a chart and start analyzing

### Using a Local LLM

If running a self-hosted model (e.g., via Ollama, LM Studio, or vLLM):

1. Start your LLM server on port `8080` (or configure in Settings)
2. Select **"Local LLM"** as the provider
3. The Vite proxy routes `/llm` requests to your local server automatically

---

## How the AI Analysis Works

### Prompt Engineering Strategy

Each analysis call sends a carefully structured system prompt that forces the LLM through a **5-step evaluation framework** before making any directional call. This prevents common LLM failure modes like:

- **Anchoring bias** — The model must evaluate trend, patterns, levels, momentum, and structure independently before combining signals
- **Hallucinated confidence** — Confidence scores must be justified per-step and are capped at 99%
- **Format instability** — Strict JSON-only output instructions with no markdown wrapping

### Consensus Voting Algorithm

```
Call 1 → Direction + Confidence
Call 2 → Direction + Confidence
  ├── If Call 1 == Call 2 → Early exit (2/3 consensus, +5% confidence)
  └── If Call 1 != Call 2 → Run Call 3
Call 3 → Direction + Confidence
  ├── Majority vote wins (2/3 or 3/3)
  └── 3/3 unanimous → +12% confidence boost
```

This approach significantly reduces false signals compared to single-call analysis.

---

## Project Structure

```
chart-sniper/
├── App.jsx            # Core application — components, analysis engine, UI
├── main.jsx           # React DOM entry point
├── index.html         # HTML shell with viewport and meta tags
├── vite.config.js     # Vite config with proxy and port settings
├── package.json       # Dependencies and scripts
└── README.md          # Documentation
```

---

## AI Engineering Skills Demonstrated

| Competency | Implementation |
|-----------|---------------|
| **LLM API Integration** | Multi-provider support (Anthropic, OpenAI, Minimax) with unified calling interface and provider-specific request/response normalization |
| **Prompt Engineering** | Multi-step structured prompts with JSON output enforcement, bias mitigation, and priority-based decision rules |
| **Multimodal AI** | Vision model integration — base64 image encoding pipeline for chart-to-analysis workflows |
| **Consensus & Reliability** | Multi-call voting architecture with early-exit optimization and confidence calibration |
| **Structured Output Parsing** | Robust JSON extraction from non-deterministic LLM responses with fallback handling |
| **Provider Abstraction** | Swappable LLM backends (cloud and local) with zero changes to application logic |
| **AI Safety & Guardrails** | Confidence capping, bias prevention through independent signal evaluation, clear limitations disclosure |
| **Security Best Practices** | No hardcoded credentials, ephemeral API key handling, proxy isolation for local models |
| **Frontend Engineering** | React 18 SPA with hooks-based state management, responsive design, and polished glassmorphism UI |
| **Domain Modeling** | Financial risk management engine with timeframe-specific parameterization and position sizing |

---

## Roadmap

- [ ] Persistent storage backend (trade journal survives page reloads)
- [ ] User authentication and multi-user support
- [ ] Real-time market data integration via WebSocket
- [ ] Batch analysis across multiple timeframes
- [ ] Advanced analytics (win rate by pattern, by timeframe, by provider)
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
