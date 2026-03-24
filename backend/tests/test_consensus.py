"""Tests for consensus voting and JSON parsing logic."""

import pytest
from app.services.consensus import parse_json, resolve_consensus


class TestParseJSON:
    def test_clean_json(self):
        result = parse_json('{"direction":"BUY","confidence":85}')
        assert result == {"direction": "BUY", "confidence": 85}

    def test_strips_markdown_fences(self):
        text = '```json\n{"direction":"SELL","confidence":72}\n```'
        assert parse_json(text)["direction"] == "SELL"

    def test_extracts_from_surrounding_text(self):
        text = 'Here is my analysis:\n{"direction":"BUY"}\nDone.'
        assert parse_json(text)["direction"] == "BUY"

    def test_handles_trailing_commas(self):
        text = '{"direction":"SELL","confidence":70,}'
        assert parse_json(text) == {"direction": "SELL", "confidence": 70}

    def test_returns_none_for_empty(self):
        assert parse_json("") is None

    def test_returns_none_for_plain_text(self):
        assert parse_json("I cannot analyze this chart.") is None

    def test_returns_none_for_malformed(self):
        assert parse_json("{direction: BUY}") is None

    def test_nested_objects(self):
        text = '{"direction":"BUY","orderBlocks":[{"type":"bullish"}]}'
        result = parse_json(text)
        assert result["orderBlocks"][0]["type"] == "bullish"

    def test_whitespace_and_newlines(self):
        text = '{\n  "direction": "SELL",\n  "confidence": 88\n}'
        result = parse_json(text)
        assert result["confidence"] == 88


class TestResolveConsensus:
    def test_returns_none_for_empty(self):
        assert resolve_consensus([]) is None

    def test_single_result(self):
        parsed = [{"direction": "BUY", "confidence": 70, "reasoning": ["up"]}]
        result = resolve_consensus(parsed)
        assert result["direction"] == "BUY"

    def test_majority_wins(self):
        parsed = [
            {"direction": "BUY", "confidence": 75, "reasoning": ["a"]},
            {"direction": "SELL", "confidence": 80, "reasoning": ["b"]},
            {"direction": "BUY", "confidence": 70, "reasoning": ["c"]},
        ]
        result = resolve_consensus(parsed)
        assert result["direction"] == "BUY"

    def test_2_of_3_boost(self):
        parsed = [
            {"direction": "SELL", "confidence": 80, "reasoning": ["a"]},
            {"direction": "SELL", "confidence": 75, "reasoning": ["b"]},
            {"direction": "BUY", "confidence": 90, "reasoning": ["c"]},
        ]
        result = resolve_consensus(parsed)
        assert result["direction"] == "SELL"
        assert result["confidence"] == 85  # 80 + 5

    def test_3_of_3_boost(self):
        parsed = [
            {"direction": "BUY", "confidence": 82, "reasoning": ["a"]},
            {"direction": "BUY", "confidence": 78, "reasoning": ["b"]},
            {"direction": "BUY", "confidence": 80, "reasoning": ["c"]},
        ]
        result = resolve_consensus(parsed)
        assert result["confidence"] == 94  # 82 + 12

    def test_caps_at_99(self):
        parsed = [
            {"direction": "SELL", "confidence": 95, "reasoning": ["a"]},
            {"direction": "SELL", "confidence": 92, "reasoning": ["b"]},
            {"direction": "SELL", "confidence": 90, "reasoning": ["c"]},
        ]
        result = resolve_consensus(parsed)
        assert result["confidence"] == 99

    def test_consensus_metadata(self):
        parsed = [
            {"direction": "BUY", "confidence": 70, "reasoning": ["a"]},
            {"direction": "BUY", "confidence": 75, "reasoning": ["b"]},
        ]
        result = resolve_consensus(parsed)
        assert result["consensus"]["agree"] == 2
        assert result["consensus"]["total"] == 2
        assert result["consensus"]["direction"] == "BUY"

    def test_prepends_consensus_note(self):
        parsed = [
            {"direction": "SELL", "confidence": 70, "reasoning": ["bearish"]},
            {"direction": "SELL", "confidence": 72, "reasoning": ["also bearish"]},
        ]
        result = resolve_consensus(parsed)
        assert "2/2" in result["reasoning"][0]

    def test_picks_highest_confidence_winner(self):
        parsed = [
            {"direction": "BUY", "confidence": 60, "reasoning": ["a"]},
            {"direction": "BUY", "confidence": 85, "reasoning": ["b"]},
            {"direction": "SELL", "confidence": 90, "reasoning": ["c"]},
        ]
        result = resolve_consensus(parsed)
        # Base is 85 (highest BUY), then +5 for 2/3 consensus
        assert result["confidence"] == 90
