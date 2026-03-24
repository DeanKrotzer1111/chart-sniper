"""Tests for the smart model router."""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.router import (
    get_tier_order,
    route_analysis,
    CONFIDENCE_THRESHOLD,
    RoutingResult,
)


class TestGetTierOrder:
    def test_cost_optimized_claude(self):
        tiers = get_tier_order("cost_optimized", "claude")
        assert tiers == ["cheap", "standard"]

    def test_cost_optimized_openai(self):
        tiers = get_tier_order("cost_optimized", "openai")
        assert tiers == ["cheap", "standard"]

    def test_quality_first(self):
        tiers = get_tier_order("quality_first", "claude")
        assert tiers == ["standard"]

    def test_balanced(self):
        tiers = get_tier_order("balanced", "openai")
        assert tiers == ["standard"]

    def test_local_provider_always_standard(self):
        tiers = get_tier_order("cost_optimized", "local")
        assert tiers == ["standard"]

    def test_minimax_always_standard(self):
        tiers = get_tier_order("cost_optimized", "minimax")
        assert tiers == ["standard"]


class TestRouteAnalysis:
    @pytest.mark.asyncio
    async def test_cheap_model_sufficient(self):
        """When cheap model returns high confidence, don't escalate."""
        high_conf_result = {
            "direction": "BUY",
            "confidence": 82,
            "currentPrice": 25000.0,
            "consensus": {"agree": 2, "total": 2, "direction": "BUY"},
            "reasoning": ["strong signal"],
            "prompt_version": "v1",
        }

        with patch("app.services.router.run_consensus_analysis", new_callable=AsyncMock) as mock_analysis:
            mock_analysis.return_value = high_conf_result
            with patch("app.services.router.LLMProvider"):
                result = await route_analysis(
                    provider="claude",
                    api_key="test-key",
                    image_b64="dGVzdA==",
                    timeframe="1-Min",
                    mode="scalp",
                    strategy="cost_optimized",
                )

        assert not result.escalated
        assert result.result["direction"] == "BUY"
        assert result.cost_saved_pct == 80.0
        assert len(result.models_tried) == 1
        assert mock_analysis.call_count == 1

    @pytest.mark.asyncio
    async def test_escalates_on_low_confidence(self):
        """When cheap model returns low confidence, escalate to standard."""
        low_conf = {
            "direction": "NEUTRAL",
            "confidence": 42,
            "currentPrice": 25000.0,
            "consensus": {"agree": 1, "total": 3, "direction": "NEUTRAL"},
            "reasoning": ["unclear"],
            "prompt_version": "v1",
        }
        high_conf = {
            "direction": "SELL",
            "confidence": 78,
            "currentPrice": 25000.0,
            "consensus": {"agree": 2, "total": 2, "direction": "SELL"},
            "reasoning": ["clear bearish"],
            "prompt_version": "v1",
        }

        with patch("app.services.router.run_consensus_analysis", new_callable=AsyncMock) as mock_analysis:
            mock_analysis.side_effect = [low_conf, high_conf]
            with patch("app.services.router.LLMProvider"):
                result = await route_analysis(
                    provider="openai",
                    api_key="test-key",
                    image_b64="dGVzdA==",
                    timeframe="5-Min",
                    mode="scalp",
                    strategy="cost_optimized",
                )

        assert result.escalated
        assert result.result["direction"] == "SELL"
        assert result.result["confidence"] == 78
        assert len(result.models_tried) == 2
        assert result.cost_saved_pct == -20.0

    @pytest.mark.asyncio
    async def test_quality_first_skips_cheap(self):
        """Quality first strategy only uses standard model."""
        result_data = {
            "direction": "BUY",
            "confidence": 75,
            "currentPrice": 25000.0,
            "consensus": {"agree": 2, "total": 2, "direction": "BUY"},
            "reasoning": ["good"],
            "prompt_version": "v1",
        }

        with patch("app.services.router.run_consensus_analysis", new_callable=AsyncMock) as mock_analysis:
            mock_analysis.return_value = result_data
            with patch("app.services.router.LLMProvider"):
                result = await route_analysis(
                    provider="claude",
                    api_key="test-key",
                    image_b64="dGVzdA==",
                    timeframe="1-Min",
                    mode="scalp",
                    strategy="quality_first",
                )

        assert not result.escalated
        assert mock_analysis.call_count == 1
        assert result.models_tried[0]["tier"] == "standard"

    @pytest.mark.asyncio
    async def test_local_provider_no_escalation(self):
        """Local provider has no tiers, uses standard only."""
        result_data = {
            "direction": "SELL",
            "confidence": 45,
            "currentPrice": 5000.0,
            "consensus": {"agree": 1, "total": 2, "direction": "SELL"},
            "reasoning": ["weak"],
            "prompt_version": "v1",
        }

        with patch("app.services.router.run_consensus_analysis", new_callable=AsyncMock) as mock_analysis:
            mock_analysis.return_value = result_data
            with patch("app.services.router.LLMProvider"):
                result = await route_analysis(
                    provider="local",
                    api_key=None,
                    image_b64="dGVzdA==",
                    timeframe="1-Min",
                    mode="scalp",
                    strategy="cost_optimized",
                )

        assert not result.escalated
        assert len(result.models_tried) == 1

    def test_routing_result_to_dict(self):
        rr = RoutingResult(
            result={"direction": "BUY"},
            models_tried=[{"tier": "cheap", "model": "haiku", "confidence": 80, "direction": "BUY"}],
            escalated=False,
            total_latency_ms=1500,
            strategy="cost_optimized",
            cost_saved_pct=80.0,
        )
        d = rr.to_dict()
        assert d["escalated"] is False
        assert d["cost_saved_pct"] == 80.0
        assert d["strategy"] == "cost_optimized"
        assert len(d["models_tried"]) == 1
