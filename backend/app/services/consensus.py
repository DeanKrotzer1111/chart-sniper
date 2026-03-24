from __future__ import annotations

import json
import re
from collections import Counter

from app.services.llm import LLMProvider


# ---------------------------------------------------------------------------
# Prompt templates (inline registry)
# ---------------------------------------------------------------------------

PRICE_PROMPT = (
    "You are a price reader. Look at the trading chart image and return ONLY "
    "the current price as a single number, no text. Example: 18432.50"
)

ANALYSIS_PROMPT_V1 = """You are Chart Sniper, an elite futures-trading AI.
Analyze this {timeframe} chart in {mode} mode.

Current price: {price}

Return a JSON object with exactly these keys:
- direction: "BUY" | "SELL" | "NEUTRAL"
- confidence: 1-99 integer
- currentPrice: float
- marketTrend: "Bullish" | "Bearish" | "Ranging"
- isReversal: boolean
- reasoning: array of short strings
- pattern: string or null (e.g. "Double Bottom", "Head & Shoulders")
- volume: "High" | "Low" | "Average" | null
- momentum: "Strong" | "Weak" | "Diverging" | null
- timeInTrade: string or null (e.g. "2-5 candles")
- supportLevels: array of floats
- resistanceLevels: array of floats
- orderBlocks: array of objects with keys zone, type, strength

Return ONLY valid JSON, no markdown fences, no commentary."""

PROMPTS = {
    "v1": {"price": PRICE_PROMPT, "analysis": ANALYSIS_PROMPT_V1},
}


def get_prompt(prompt_version: str, key: str) -> str:
    version = PROMPTS.get(prompt_version, PROMPTS["v1"])
    return version[key]


# ---------------------------------------------------------------------------
# JSON parsing helpers
# ---------------------------------------------------------------------------


def parse_json(text: str) -> dict | None:
    """Extract and parse a JSON object from LLM output.

    Handles markdown fences, trailing commas, and surrounding text.
    """
    if not text:
        return None

    # Strip markdown code fences
    cleaned = re.sub(r"```(?:json)?\s*", "", text)
    cleaned = re.sub(r"```", "", cleaned)

    # Try to find a JSON object in the text
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


# ---------------------------------------------------------------------------
# Consensus resolution
# ---------------------------------------------------------------------------


def resolve_consensus(parsed: list[dict]) -> dict | None:
    """Vote on direction across multiple analysis results.

    Returns the best result with consensus metadata and confidence adjustments.
    """
    if not parsed:
        return None

    directions = [p.get("direction", "NEUTRAL").upper() for p in parsed]
    counts = Counter(directions)
    majority_dir, majority_count = counts.most_common(1)[0]
    total = len(parsed)

    # Pick the highest-confidence result that matches the majority direction
    candidates = [
        p for p in parsed if p.get("direction", "").upper() == majority_dir
    ]
    winner = max(candidates, key=lambda p: p.get("confidence", 0))
    result = dict(winner)

    # Confidence adjustments
    if majority_count == total and total >= 3:
        result["confidence"] = min(99, result.get("confidence", 50) + 12)
        consensus_note = f"All {total}/{total} analyses agree: {majority_dir}"
    elif majority_count >= 2:
        result["confidence"] = min(95, result.get("confidence", 50) + 5)
        consensus_note = f"{majority_count}/{total} analyses agree: {majority_dir}"
    else:
        consensus_note = f"No consensus ({total} different opinions)"

    # Prepend consensus note to reasoning
    reasoning = result.get("reasoning", [])
    if isinstance(reasoning, list):
        result["reasoning"] = [consensus_note] + reasoning
    else:
        result["reasoning"] = [consensus_note, str(reasoning)]

    result["consensus"] = {
        "agree": majority_count,
        "total": total,
        "direction": majority_dir,
    }

    return result


# ---------------------------------------------------------------------------
# Main consensus analysis pipeline
# ---------------------------------------------------------------------------


async def run_consensus_analysis(
    llm: LLMProvider,
    image_b64: str,
    timeframe: str,
    mode: str,
    prompt_version: str = "v1",
    on_status: callable = None,
) -> dict:
    """Run multi-pass analysis with consensus voting.

    Steps:
    1. Read the current price from the chart.
    2. Run up to 3 analysis passes (early exit if first 2 agree).
    3. Resolve consensus and return the final result.
    """

    async def _notify(step: str, data: str = ""):
        if on_status:
            await on_status(step, data)

    # Step 1: Read price
    await _notify("reading", "Reading current price from chart...")
    price_prompt = get_prompt(prompt_version, "price")
    price_text = await llm.call(
        system_prompt=price_prompt,
        content={"b64": image_b64, "text": "What is the current price on this chart?"},
        max_tokens=32,
    )

    # Parse price (extract first number from response)
    price_match = re.search(r"[\d,]+\.?\d*", price_text.replace(",", ""))
    price = float(price_match.group(0)) if price_match else 0.0
    await _notify("price_read", str(price))

    # Step 2: Run analysis passes
    analysis_prompt_template = get_prompt(prompt_version, "analysis")
    analysis_prompt = analysis_prompt_template.format(
        timeframe=timeframe, mode=mode, price=price
    )

    results: list[dict] = []

    for i in range(3):
        await _notify(f"analyzing {i + 1}/3", f"Running analysis pass {i + 1}...")

        raw = await llm.call(
            system_prompt=analysis_prompt,
            content={"b64": image_b64, "text": "Analyze this trading chart."},
            max_tokens=1200,
        )

        parsed = parse_json(raw)
        if parsed:
            # Ensure price is set
            if not parsed.get("currentPrice"):
                parsed["currentPrice"] = price
            results.append(parsed)

        # Early exit: if first 2 analyses agree on direction, skip the 3rd
        if len(results) == 2:
            d1 = results[0].get("direction", "").upper()
            d2 = results[1].get("direction", "").upper()
            if d1 == d2:
                await _notify("early_consensus", f"First 2 agree: {d1}")
                break

    # Step 3: Resolve consensus
    await _notify("resolving", "Resolving consensus...")
    final = resolve_consensus(results)

    if final is None:
        # Fallback if all parsing failed
        final = {
            "direction": "NEUTRAL",
            "confidence": 0,
            "currentPrice": price,
            "marketTrend": "Ranging",
            "isReversal": False,
            "reasoning": ["Analysis failed: could not parse LLM responses"],
            "pattern": None,
            "volume": None,
            "momentum": None,
            "timeInTrade": None,
            "supportLevels": [],
            "resistanceLevels": [],
            "orderBlocks": [],
            "consensus": {"agree": 0, "total": 0, "direction": "NEUTRAL"},
        }

    final["prompt_version"] = prompt_version
    return final
