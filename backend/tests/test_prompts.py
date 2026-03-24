"""Tests for the prompt versioning registry."""

import pytest
from app.prompts.registry import list_versions, get_meta, load_prompt, render_prompt


class TestPromptRegistry:
    def test_list_versions_includes_v1(self):
        versions = list_versions()
        assert "v1" in versions

    def test_get_meta_v1(self):
        meta = get_meta("v1")
        assert meta["version"] == "v1"
        assert "description" in meta
        assert "template_vars" in meta

    def test_get_meta_invalid_raises(self):
        with pytest.raises(FileNotFoundError):
            get_meta("v999")

    def test_load_price_read_prompt(self):
        prompt = load_prompt("price_read", "v1")
        assert "OHLC" in prompt
        assert "close price" in prompt

    def test_load_system_prompt(self):
        prompt = load_prompt("system", "v1")
        assert "JSON" in prompt

    def test_load_analysis_prompt(self):
        prompt = load_prompt("analysis", "v1")
        assert "STEP A" in prompt
        assert "STEP E" in prompt
        assert "{timeframe}" in prompt
        assert "{mode}" in prompt

    def test_load_nonexistent_prompt_raises(self):
        with pytest.raises(FileNotFoundError):
            load_prompt("nonexistent", "v1")

    def test_render_analysis_prompt(self):
        rendered = render_prompt("analysis", "v1", timeframe="1-Min", mode="scalp")
        assert "1-Min" in rendered
        assert "scalp" in rendered
        assert "{timeframe}" not in rendered
        assert "{mode}" not in rendered

    def test_render_prompt_without_vars(self):
        rendered = render_prompt("system", "v1")
        assert "JSON" in rendered
