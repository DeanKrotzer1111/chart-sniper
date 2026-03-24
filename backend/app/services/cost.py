"""
LLM Cost Estimator

Tracks estimated token usage and cost per analysis call.
Costs are approximate based on published pricing.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


# Approximate pricing per 1K tokens (as of 2026)
PRICING = {
    "claude": {"input": 0.003, "output": 0.015, "name": "Claude Sonnet"},
    "openai": {"input": 0.005, "output": 0.015, "name": "GPT-4o"},
    "minimax": {"input": 0.001, "output": 0.005, "name": "MiniMax-Text-01"},
    "local": {"input": 0.0, "output": 0.0, "name": "Local LLM"},
}


@dataclass
class CallCost:
    provider: str
    input_tokens: int
    output_tokens: int
    cost_usd: float

    def to_dict(self) -> dict:
        return {
            "provider": self.provider,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cost_usd": round(self.cost_usd, 6),
        }


@dataclass
class AnalysisCost:
    calls: list = field(default_factory=list)

    def add_call(self, provider: str, input_tokens: int, output_tokens: int):
        pricing = PRICING.get(provider, PRICING["local"])
        cost = (input_tokens / 1000 * pricing["input"]) + (output_tokens / 1000 * pricing["output"])
        self.calls.append(CallCost(provider, input_tokens, output_tokens, cost))

    @property
    def total_cost(self) -> float:
        return sum(c.cost_usd for c in self.calls)

    @property
    def total_tokens(self) -> int:
        return sum(c.input_tokens + c.output_tokens for c in self.calls)

    def to_dict(self) -> dict:
        return {
            "total_cost_usd": round(self.total_cost, 6),
            "total_tokens": self.total_tokens,
            "num_calls": len(self.calls),
            "calls": [c.to_dict() for c in self.calls],
        }


def estimate_image_tokens(b64_length: int) -> int:
    """Estimate token count for a base64 image. Rough heuristic."""
    # ~750 bytes per token for images, base64 is ~1.33x raw size
    raw_bytes = b64_length * 3 / 4
    return max(85, int(raw_bytes / 750))


def estimate_text_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token."""
    return max(1, len(text) // 4)
