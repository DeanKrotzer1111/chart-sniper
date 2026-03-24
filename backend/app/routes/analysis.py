from __future__ import annotations

import json
import os
import time
import hashlib
from typing import Optional

from fastapi import APIRouter, Header, Request
from fastapi.responses import StreamingResponse

from app.models.schemas import AnalysisRequest, AnalysisResponse
from app.services.llm import LLMProvider
from app.services.consensus import run_consensus_analysis
from app.services.risk import get_timeframe_params, calc_levels
from app.db.database import log_analysis

router = APIRouter(prefix="/api")


def _resolve_api_key(provider: str, header_key: str | None) -> str | None:
    """Resolve API key from header or environment variable."""
    if header_key:
        return header_key
    env_map = {
        "claude": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "minimax": "MINIMAX_API_KEY",
    }
    env_var = env_map.get(provider)
    return os.environ.get(env_var) if env_var else None


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_chart(
    body: AnalysisRequest,
    x_api_key: Optional[str] = Header(None),
):
    """Run chart analysis with consensus voting and risk calculation."""
    api_key = _resolve_api_key(body.provider, x_api_key)
    llm = LLMProvider(provider=body.provider, api_key=api_key)

    start = time.perf_counter()

    result = await run_consensus_analysis(
        llm=llm,
        image_b64=body.image_base64,
        timeframe=body.timeframe,
        mode=body.mode,
    )

    latency_ms = int((time.perf_counter() - start) * 1000)

    # Calculate risk levels
    tf_params = get_timeframe_params(body.timeframe, body.mode)
    price = result.get("currentPrice", 0.0)
    direction = result.get("direction", "NEUTRAL")
    levels = calc_levels(price, direction, tf_params, body.account_balance)

    # Log to database
    image_hash = hashlib.md5(body.image_base64.encode()).hexdigest()[:16]
    consensus = result.get("consensus", {})
    await log_analysis(
        provider=body.provider,
        prompt_version=result.get("prompt_version", "v1"),
        timeframe=body.timeframe,
        mode=body.mode,
        direction=direction,
        confidence=result.get("confidence", 0),
        latency_ms=latency_ms,
        consensus_agree=consensus.get("agree", 0),
        consensus_total=consensus.get("total", 0),
        image_hash=image_hash,
    )

    return AnalysisResponse(
        direction=direction,
        confidence=result.get("confidence", 0),
        currentPrice=price,
        marketTrend=result.get("marketTrend", "Ranging"),
        isReversal=result.get("isReversal", False),
        reasoning=result.get("reasoning", []),
        pattern=result.get("pattern"),
        volume=result.get("volume"),
        momentum=result.get("momentum"),
        timeInTrade=result.get("timeInTrade"),
        supportLevels=result.get("supportLevels", []),
        resistanceLevels=result.get("resistanceLevels", []),
        orderBlocks=result.get("orderBlocks", []),
        levels=levels,
        consensus=consensus,
        prompt_version=result.get("prompt_version", "v1"),
        provider_used=body.provider,
        latency_ms=latency_ms,
    )


@router.post("/analyze/stream")
async def analyze_chart_stream(
    body: AnalysisRequest,
    x_api_key: Optional[str] = Header(None),
):
    """Stream analysis progress via Server-Sent Events."""
    api_key = _resolve_api_key(body.provider, x_api_key)
    llm = LLMProvider(provider=body.provider, api_key=api_key)

    async def event_generator():
        start = time.perf_counter()

        async def on_status(step: str, data: str = ""):
            event = json.dumps({"step": step, "data": data})
            yield f"data: {event}\n\n"

        # We cannot use on_status as a generator callback directly,
        # so we collect status events and interleave them.
        status_events: list[dict] = []

        async def collect_status(step: str, data: str = ""):
            status_events.append({"step": step, "data": data})

        # Send initial event
        yield f"data: {json.dumps({'step': 'started', 'data': 'Analysis started'})}\n\n"

        result = await run_consensus_analysis(
            llm=llm,
            image_b64=body.image_base64,
            timeframe=body.timeframe,
            mode=body.mode,
            on_status=collect_status,
        )

        # Send collected status events
        for evt in status_events:
            yield f"data: {json.dumps(evt)}\n\n"

        latency_ms = int((time.perf_counter() - start) * 1000)

        # Calculate levels
        tf_params = get_timeframe_params(body.timeframe, body.mode)
        price = result.get("currentPrice", 0.0)
        direction = result.get("direction", "NEUTRAL")
        levels = calc_levels(price, direction, tf_params, body.account_balance)

        # Log to database
        image_hash = hashlib.md5(body.image_base64.encode()).hexdigest()[:16]
        consensus = result.get("consensus", {})
        await log_analysis(
            provider=body.provider,
            prompt_version=result.get("prompt_version", "v1"),
            timeframe=body.timeframe,
            mode=body.mode,
            direction=direction,
            confidence=result.get("confidence", 0),
            latency_ms=latency_ms,
            consensus_agree=consensus.get("agree", 0),
            consensus_total=consensus.get("total", 0),
            image_hash=image_hash,
        )

        # Build final response
        final = {
            "direction": direction,
            "confidence": result.get("confidence", 0),
            "currentPrice": price,
            "marketTrend": result.get("marketTrend", "Ranging"),
            "isReversal": result.get("isReversal", False),
            "reasoning": result.get("reasoning", []),
            "pattern": result.get("pattern"),
            "volume": result.get("volume"),
            "momentum": result.get("momentum"),
            "timeInTrade": result.get("timeInTrade"),
            "supportLevels": result.get("supportLevels", []),
            "resistanceLevels": result.get("resistanceLevels", []),
            "orderBlocks": result.get("orderBlocks", []),
            "levels": levels,
            "consensus": consensus,
            "prompt_version": result.get("prompt_version", "v1"),
            "provider_used": body.provider,
            "latency_ms": latency_ms,
        }

        yield f"data: {json.dumps({'step': 'complete', 'data': final})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
