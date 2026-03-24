# Chart Reaper - AI-Powered Trading Chart Analyzer

> Cut through the noise. Trade with precision.

**Chart Reaper** is an intelligent trading analysis terminal that uses large language models (LLMs) to analyze financial chart screenshots and generate risk-managed trade setups. Upload a chart, select your timeframe, and let AI identify patterns, reversals, and optimal entry/exit points — all with built-in risk management.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Key Features

### Multi-Provider LLM Integration
- **Claude (Anthropic)** — `claude-sonnet-4-20250514` with vision capabilities
- **GPT-4o (OpenAI)** — Multimodal chart understanding
- **Minimax** — `MiniMax-Text-01` alternative provider
- **Local LLM** — Self-hosted model support via configurable proxy

The system is provider-agnostic: swap between cloud APIs and local models without changing any analysis logic.

### Consensus-Based AI Analysis Pipeline
Chart Reaper doesn't rely on a single AI call. It implements a **multi-call consensus voting system** to improve signal reliability:

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
git clone https://github.com/YOUR_USERNAME/chart-reaper.git
cd chart-reaper
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
chart-reaper/
├── App.jsx            # Core application — components, analysis engine, UI
├── main.jsx           # React DOM entry point
├── index.html         # HTML shell with viewport and meta tags
├── vite.config.js     # Vite config with proxy and port settings
├── package.json       # Dependencies and scripts
└── README.md          # Documentation
```

---

## Skills Demonstrated

This project showcases the following AI engineering competencies:

- **LLM API Integration** — Multi-provider support (Anthropic, OpenAI, Minimax) with unified interface
- **Prompt Engineering** — Structured multi-step prompts with JSON output enforcement and bias mitigation
- **Multimodal AI** — Vision model integration for image-to-analysis pipelines
- **Consensus Systems** — Multi-call voting architecture for improved reliability
- **AI Output Parsing** — Robust JSON extraction from LLM responses with error handling
- **Provider Abstraction** — Swappable LLM backends without changing application logic
- **Risk-Aware Design** — Confidence scoring, bias prevention, and clear limitations disclosure
- **Full-Stack Development** — React SPA with API integration, state management, and polished UI/UX

---

## Disclaimer

This tool is for **educational purposes only**. Nothing produced by Chart Reaper constitutes financial advice. Always do your own research and consult with a qualified financial advisor before making any trading decisions. **NFA** (Not Financial Advice).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
