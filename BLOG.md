# Building a Consensus Voting System for LLM Reliability: Lessons from Chart Sniper

*By Dean Krotzer*

---

I spent the last several months building [Chart Sniper](https://github.com/deankrotzer/chart-sniper), an AI-powered trading chart analysis tool. The core problem sounds simple: show an LLM a candlestick chart, get back a directional call (BUY, SELL, or NEUTRAL) with a confidence score. In practice, making this reliable enough to be useful taught me more about production AI engineering than any tutorial ever could.

Here is what I learned.

## The Problem: Single LLM Calls Are Not Reliable Enough

Ask Claude or GPT-4o to analyze the same chart image three times and you will get three different answers. Not slightly different -- sometimes diametrically opposed. One call says "BUY at 85% confidence," the next says "SELL at 72% confidence." Same image, same prompt, same model.

This is not a bug. LLMs are non-deterministic by design (temperature > 0), they hallucinate patterns that are not there, and their confidence scores are essentially uncalibrated. An LLM saying "90% confidence" does not mean it is right 90% of the time. It means the token sequence "90" had high probability given the preceding tokens.

For a system where the output drives actual decisions -- trading or otherwise -- a single LLM call is not good enough. You need a mechanism to filter noise from signal.

## The Architecture: Consensus Voting

The approach I landed on is conceptually simple: make multiple independent calls to the same LLM, parse each response, and vote on the result. It is the same intuition behind ensemble methods in classical ML, applied to prompt-based systems.

The pipeline works in three stages:

**Stage 1: Price extraction.** A separate, focused LLM call reads just the current price from the chart. This is isolated from the main analysis to avoid anchoring -- I do not want the model's price read to influence its directional reasoning in the same context window.

**Stage 2: Multi-pass analysis.** The system runs up to three independent analysis calls, each receiving the same chart image and prompt. Each call returns structured JSON with a direction, confidence score, reasoning, pattern identification, support/resistance levels, and more.

**Stage 3: Consensus resolution.** The results are voted on. The majority direction wins. The highest-confidence result matching that direction becomes the base response, with confidence adjusted based on agreement level.

Here is the core consensus algorithm:

```python
def resolve_consensus(parsed: list[dict]) -> dict | None:
    directions = [p.get("direction", "NEUTRAL").upper() for p in parsed]
    counts = Counter(directions)
    majority_dir, majority_count = counts.most_common(1)[0]
    total = len(parsed)

    # Pick the highest-confidence result matching the majority
    candidates = [
        p for p in parsed if p.get("direction", "").upper() == majority_dir
    ]
    winner = max(candidates, key=lambda p: p.get("confidence", 0))
    result = dict(winner)

    # Confidence adjustments based on agreement
    if majority_count == total and total >= 3:
        result["confidence"] = min(99, result.get("confidence", 50) + 12)
    elif majority_count >= 2:
        result["confidence"] = min(95, result.get("confidence", 50) + 5)

    result["consensus"] = {
        "agree": majority_count,
        "total": total,
        "direction": majority_dir,
    }
    return result
```

The key optimization is **early exit**: if the first two analysis passes agree on direction, the third call is skipped entirely. This cuts latency and cost by roughly a third in the common case.

```python
# Early exit: if first 2 analyses agree on direction, skip the 3rd
if len(results) == 2:
    d1 = results[0].get("direction", "").upper()
    d2 = results[1].get("direction", "").upper()
    if d1 == d2:
        break
```

When they disagree, the third call acts as a tiebreaker. When all three agree, confidence gets a +12 boost (capped at 99). Two out of three agreement gets +5 (capped at 95). No agreement means the result ships with a "no consensus" flag and no confidence boost.

## Prompt Engineering for Structured Reasoning

The analysis prompt asks the model to return a structured JSON object with specific fields: direction, confidence (1-99 integer), market trend, reversal detection, reasoning array, chart patterns, volume assessment, momentum, support/resistance levels, and order blocks.

Several design decisions here are deliberate countermeasures against known LLM failure modes:

**Preventing anchoring bias.** The prompt provides the current price as context but requires independent assessments of trend, momentum, and volume. If you instead asked "Is this chart bullish or bearish? And what is your confidence?" the model would anchor on its first assessment and inflate confidence to match.

**Format stability.** The prompt ends with `Return ONLY valid JSON, no markdown fences, no commentary.` This works about 85% of the time. The other 15% is why `parse_json` exists.

**Confidence calibration.** Confidence is constrained to a 1-99 integer. No 100% -- ever. Models love to output round numbers like 80 or 90, and capping at 99 at least prevents the false certainty of "100% confident."

## The Provider Abstraction Problem

Chart Sniper supports Claude, GPT-4o, Minimax, and local models (via llama.cpp or similar). This sounds like a simple interface, but the details are surprisingly annoying.

Anthropic and OpenAI use fundamentally different API shapes. Claude takes a top-level `system` field and a `content` array with typed blocks. OpenAI takes a `messages` array with `system` and `user` roles. Images are encoded differently too -- Claude wants a `source` object with `type: "base64"` and `media_type`, while OpenAI wants an `image_url` with a data URI.

```python
# Claude: structured content blocks
[
    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
    {"type": "text", "text": "Analyze this chart."},
]

# OpenAI-compatible: image_url format
[
    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
    {"type": "text", "text": "Analyze this chart."},
]
```

I solved this with a `LLMProvider` class that routes calls to provider-specific methods (`_call_claude` vs `_call_openai_compatible`) and handles content formatting internally. Minimax and local models both use the OpenAI chat completions format, so three of the four providers share the same code path. The caller never thinks about API differences -- they just call `llm.call(system_prompt, content, max_tokens)`.

Error handling also differs between providers. Claude returns errors in the response body with a specific structure. OpenAI returns standard HTTP errors. Local models might just hang. Each provider needs its own error parsing and timeout configuration.

## Evaluation and Metrics

You cannot improve what you do not measure. Chart Sniper includes a benchmark system that runs the full consensus pipeline against a labeled dataset and computes standard classification metrics: accuracy, precision/recall per direction (BUY and SELL separately), average confidence, and confidence calibration.

The confidence calibration metric is the one I care about most. It measures the gap between average confidence on correct predictions versus incorrect ones:

```python
confidence_calibration = (avg_conf_correct - avg_conf_incorrect) / 100.0
```

A positive calibration score means the system is more confident when it is right and less confident when it is wrong -- exactly what you want. A score near zero means confidence is basically random noise. Every prompt change, provider switch, or parameter tweak gets evaluated against this metric.

The benchmark system also tracks which prompt version produced which results, so I can A/B test prompt changes against historical data. Each eval run is persisted to the database with its full configuration, making it possible to trace regressions.

## Lessons Learned

**Consensus voting works but has real costs.** Three LLM calls means 3x the latency and 3x the token spend. For vision models analyzing chart images, that adds up fast. The early-exit optimization recovers about 30-40% of the overhead in practice, since two models agree on the obvious cases. The hard cases -- where you actually need the third call -- are precisely the ones where the added cost is justified.

**Prompt versioning is not optional.** I learned this the hard way after changing a prompt, seeing worse results a week later, and having no idea which version was running when. The prompt registry system stores prompts as versioned text files (`v1/analysis.txt`, `v2/analysis.txt`) with metadata, loaded at runtime and tracked in every analysis result. If something breaks, I can diff the prompts.

**Structured output parsing is harder than it sounds.** Despite explicit instructions to return only JSON, models routinely wrap their output in markdown fences, add trailing commas, prepend "Here is the analysis:", or occasionally return YAML. The `parse_json` function handles all of this:

```python
def parse_json(text: str) -> dict | None:
    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", text)
    cleaned = re.sub(r"```", "", cleaned)

    # Find JSON object in surrounding text
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        return None

    json_str = match.group(0)
    # Remove trailing commas before closing braces/brackets
    json_str = re.sub(r",\s*([}\]])", r"\1", json_str)

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None
```

This function gets exercised constantly. If I had relied on `json.loads(response)` directly, the system would fail on roughly 15% of responses.

**Caching by image hash saves real money.** The same chart screenshot often gets analyzed multiple times during development, testing, or when a user re-uploads. An LRU cache keyed on `md5(image_b64):provider:prompt_version:timeframe:mode` avoids redundant API calls. The cache tracks hit rates, and during development it regularly saves 40-50% of calls.

**Vector similarity from past analyses is promising but data-hungry.** I integrated ChromaDB to store past analyses as embeddings and retrieve similar historical cases when analyzing new charts. The idea is to inject relevant few-shot examples into the prompt: "Here are three similar charts from the past and what happened." In practice, this only starts being useful once you have a few hundred labeled examples in the store. With a small dataset, the retrieved examples are not similar enough to help and sometimes hurt by introducing irrelevant context.

## Tech Stack and Infrastructure

The system runs as two containers behind Docker Compose:

- **React + Vite** for the frontend. Chart image upload, real-time analysis status via WebSocket, results display with confidence gauges and consensus indicators.
- **FastAPI** for the backend API. Async throughout -- every LLM call is non-blocking, which matters when you are making three calls per analysis. FastAPI's dependency injection handles provider configuration cleanly.
- **ChromaDB** for vector storage. Embedded mode, persisted to disk. No separate server needed for the scale I am operating at.
- **SQLite** (via aiosqlite) for structured data: analysis history, evaluation runs, prompt metadata.
- **GitHub Actions** for CI. Tests run on every push, including prompt regression tests that verify `parse_json` handles known edge cases.

Docker made deployment straightforward. The frontend builds to static files served by nginx, the backend runs behind uvicorn, and the whole stack comes up with `docker compose up`.

## Final Thoughts

The consensus voting pattern is not specific to trading analysis. Any system that makes decisions based on LLM output -- content moderation, medical triage, code review, document classification -- can benefit from the same approach: make multiple calls, parse structured output, vote, adjust confidence.

The tradeoff is always latency and cost versus reliability. For Chart Sniper, the cost is worth it. A single false BUY signal is more expensive than three API calls.

If you are building AI systems that need to be reliable, not just impressive in a demo, start by assuming a single LLM call is not enough. Build the consensus layer, the evaluation pipeline, and the prompt versioning from day one. You will thank yourself later.

---

*Chart Sniper is open source. The codebase demonstrates these patterns in a real production context.*
