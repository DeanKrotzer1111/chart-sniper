"""Integration tests for the full analysis pipeline.

These tests mock the LLM provider to test the complete flow:
request → LLM calls → JSON parsing → consensus → risk calc → response
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.database import init_db
from app.services.consensus import parse_json, resolve_consensus, run_consensus_analysis


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


MOCK_ANALYSIS_RESPONSE = json.dumps({
    "currentPrice": 25000.50,
    "direction": "BUY",
    "marketTrend": "Bullish",
    "confidence": 78,
    "isReversal": False,
    "reasoning": [
        "Step A: Uptrend with higher highs and higher lows",
        "Step B: Bullish engulfing pattern at support",
        "Step C: Rejection at support level with long lower wick",
        "Step D: No momentum exhaustion detected",
        "Step E: No structure break"
    ],
    "pattern": "Bullish Engulfing",
    "volume": "Average",
    "momentum": "Strong",
    "timeInTrade": "3-5 candles",
    "supportLevels": [24950.00, 24900.00],
    "resistanceLevels": [25100.00, 25200.00],
    "orderBlocks": [{"type": "bullish", "from": 24940, "to": 24960}]
})

MOCK_PRICE_RESPONSE = "25000.50"


class TestFullAnalysisPipeline:
    """Test the complete analysis flow with mocked LLM."""

    @pytest.mark.asyncio
    async def test_consensus_with_mocked_llm(self):
        """Test that consensus voting works end-to-end with mocked provider."""
        mock_llm = AsyncMock()
        mock_llm.call = AsyncMock(side_effect=[
            MOCK_PRICE_RESPONSE,  # Price read
            MOCK_ANALYSIS_RESPONSE,  # Analysis call 1
            MOCK_ANALYSIS_RESPONSE,  # Analysis call 2 (same = early exit)
        ])

        result = await run_consensus_analysis(
            llm=mock_llm,
            image_b64="dGVzdGltYWdl",
            timeframe="1-Min",
            mode="scalp",
        )

        assert result["direction"] == "BUY"
        assert result["confidence"] >= 78
        assert result["currentPrice"] == 25000.50
        assert "consensus" in result
        assert result["consensus"]["agree"] >= 2
        assert mock_llm.call.call_count == 3  # 1 price + 2 analysis

    @pytest.mark.asyncio
    async def test_consensus_with_disagreement(self):
        """Test consensus when LLM calls disagree."""
        sell_response = json.dumps({
            "currentPrice": 25000.50,
            "direction": "SELL",
            "marketTrend": "Bearish",
            "confidence": 72,
            "isReversal": True,
            "reasoning": ["Bearish signal"],
            "pattern": "Shooting Star",
            "volume": "High",
            "momentum": "Weak",
            "timeInTrade": "2-3 candles",
            "supportLevels": [24900.00],
            "resistanceLevels": [25100.00],
            "orderBlocks": []
        })

        mock_llm = AsyncMock()
        mock_llm.call = AsyncMock(side_effect=[
            MOCK_PRICE_RESPONSE,
            MOCK_ANALYSIS_RESPONSE,  # BUY
            sell_response,            # SELL (disagrees)
            MOCK_ANALYSIS_RESPONSE,  # BUY (tiebreaker)
        ])

        result = await run_consensus_analysis(
            llm=mock_llm,
            image_b64="dGVzdGltYWdl",
            timeframe="1-Min",
            mode="scalp",
        )

        assert result["direction"] == "BUY"
        assert result["consensus"]["agree"] == 2
        assert result["consensus"]["total"] == 3

    @pytest.mark.asyncio
    async def test_handles_malformed_llm_response(self):
        """Test graceful handling when LLM returns garbage."""
        mock_llm = AsyncMock()
        mock_llm.call = AsyncMock(side_effect=[
            MOCK_PRICE_RESPONSE,
            "I cannot analyze this image sorry",  # Not JSON
            "Here is some random text",            # Not JSON
            MOCK_ANALYSIS_RESPONSE,                # Valid
        ])

        result = await run_consensus_analysis(
            llm=mock_llm,
            image_b64="dGVzdGltYWdl",
            timeframe="1-Min",
            mode="scalp",
        )

        # Should still get a result from the one valid response
        assert result["direction"] == "BUY"

    @pytest.mark.asyncio
    async def test_all_calls_fail_returns_neutral(self):
        """Test fallback when all LLM calls fail to parse."""
        mock_llm = AsyncMock()
        mock_llm.call = AsyncMock(side_effect=[
            MOCK_PRICE_RESPONSE,
            "not json 1",
            "not json 2",
            "not json 3",
        ])

        result = await run_consensus_analysis(
            llm=mock_llm,
            image_b64="dGVzdGltYWdl",
            timeframe="1-Min",
            mode="scalp",
        )

        assert result["direction"] == "NEUTRAL"
        assert result["confidence"] == 0


class TestAPIEndpointIntegration:
    """Test API endpoints with mocked LLM calls."""

    @pytest.mark.asyncio
    async def test_analyze_endpoint_with_mock(self):
        """Test POST /api/analyze returns proper response shape."""
        from app.services.router import RoutingResult

        mock_routing_result = RoutingResult(
            result=json.loads(MOCK_ANALYSIS_RESPONSE),
            models_tried=[{"tier": "standard", "model": "local", "confidence": 78, "direction": "BUY"}],
            escalated=False,
            total_latency_ms=500,
            strategy="cost_optimized",
            cost_saved_pct=0.0,
        )
        mock_routing_result.result["prompt_version"] = "v1"
        mock_routing_result.result["consensus"] = {"agree": 2, "total": 2, "direction": "BUY"}

        with patch("app.routes.analysis.route_analysis", new_callable=AsyncMock) as mock_route:
            mock_route.return_value = mock_routing_result
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/analyze", json={
                    "provider": "local",
                    "image_base64": "dGVzdA==",
                    "timeframe": "1-Min",
                    "mode": "scalp",
                    "account_balance": 10000.0,
                })

                assert response.status_code == 200
                data = response.json()
                assert data["direction"] in ["BUY", "SELL", "NEUTRAL"]
                assert "levels" in data
                assert "consensus" in data
                assert "latency_ms" in data
                assert data["provider_used"] == "local"

    @pytest.mark.asyncio
    async def test_full_trade_lifecycle(self):
        """Test: analyze → save trade → check stats."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            # Save a winning trade
            trade = {
                "timestamp": "2026-03-24T12:00:00Z",
                "mode": "scalp",
                "timeframe": "1-Min",
                "direction": "BUY",
                "entry": 25000.00,
                "sl": 24995.00,
                "tp1": 25007.00,
                "rr_ratio": "1.40:1",
                "outcome": "WIN",
                "confidence": 85,
                "provider": "claude",
                "prompt_version": "v1",
            }
            resp = await client.post("/api/history", json=trade)
            assert resp.status_code == 200

            # Save a losing trade
            trade2 = {**trade, "direction": "SELL", "outcome": "LOSS", "confidence": 62}
            resp = await client.post("/api/history", json=trade2)
            assert resp.status_code == 200

            # Check stats
            resp = await client.get("/api/history/stats")
            assert resp.status_code == 200
            stats = resp.json()
            assert stats["total_trades"] >= 2
            assert stats["wins"] >= 1
            assert stats["losses"] >= 1
            assert "win_rate" in stats
            assert "by_mode" in stats
