from __future__ import annotations

import os
from typing import Optional, Union

import httpx


class LLMProvider:
    """Abstraction over multiple LLM providers for chart analysis."""

    PROVIDER_CONFIGS = {
        "claude": {
            "url": "https://api.anthropic.com/v1/messages",
            "model": "claude-sonnet-4-20250514",
            "env_key": "ANTHROPIC_API_KEY",
        },
        "openai": {
            "url": "https://api.openai.com/v1/chat/completions",
            "model": "gpt-4o",
            "env_key": "OPENAI_API_KEY",
        },
        "minimax": {
            "url": "https://api.minimaxi.chat/v1/text/chatcompletion_v2",
            "model": "MiniMax-Text-01",
            "env_key": "MINIMAX_API_KEY",
        },
        "local": {
            "url": "http://localhost:8080/v1/chat/completions",
            "model": "local",
            "env_key": None,
        },
    }

    def __init__(self, provider: str, api_key: Optional[str] = None):
        if provider not in self.PROVIDER_CONFIGS:
            raise ValueError(
                f"Unsupported provider: {provider}. "
                f"Choose from: {list(self.PROVIDER_CONFIGS.keys())}"
            )
        self.provider = provider
        self.config = self.PROVIDER_CONFIGS[provider]

        env_key = self.config["env_key"]
        self.api_key = api_key or (os.environ.get(env_key) if env_key else None)

        if provider != "local" and not self.api_key:
            raise ValueError(
                f"API key required for {provider}. "
                f"Set {env_key} or pass api_key parameter."
            )

    async def call(
        self, system_prompt: str, content: str | dict, max_tokens: int = 1200
    ) -> str:
        """Send a request to the LLM provider and return the text response."""
        if self.provider == "claude":
            return await self._call_claude(system_prompt, content, max_tokens)
        else:
            return await self._call_openai_compatible(system_prompt, content, max_tokens)

    async def _call_claude(
        self, system_prompt: str, content: str | dict, max_tokens: int
    ) -> str:
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        user_content = self._build_claude_content(content)

        payload = {
            "model": self.config["model"],
            "max_tokens": max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_content}],
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                self.config["url"], headers=headers, json=payload
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"Claude API error {response.status_code}: {response.text}"
            )

        data = response.json()
        return data["content"][0]["text"]

    async def _call_openai_compatible(
        self, system_prompt: str, content: str | dict, max_tokens: int
    ) -> str:
        headers = {"content-type": "application/json"}
        if self.api_key:
            headers["authorization"] = f"Bearer {self.api_key}"

        user_content = self._build_openai_content(content)

        payload = {
            "model": self.config["model"],
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                self.config["url"], headers=headers, json=payload
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"{self.provider} API error {response.status_code}: {response.text}"
            )

        data = response.json()
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _build_claude_content(content: str | dict) -> list[dict]:
        """Build Anthropic-format content blocks."""
        if isinstance(content, dict) and "b64" in content:
            return [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": content["b64"],
                    },
                },
                {"type": "text", "text": content.get("text", "Analyze this chart.")},
            ]
        return [{"type": "text", "text": content}]

    @staticmethod
    def _build_openai_content(content: str | dict) -> str | list[dict]:
        """Build OpenAI-format content (also used by minimax and local)."""
        if isinstance(content, dict) and "b64" in content:
            return [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{content['b64']}",
                    },
                },
                {"type": "text", "text": content.get("text", "Analyze this chart.")},
            ]
        return content
