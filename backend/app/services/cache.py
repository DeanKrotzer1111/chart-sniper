"""
LLM Response Cache

Caches analysis results by image hash + provider + prompt version.
Uses an in-memory LRU cache with optional TTL expiration.
Saves API costs on repeated analyses of the same chart.
"""

from __future__ import annotations

import hashlib
import time
from collections import OrderedDict
from threading import Lock


class LLMCache:
    """Thread-safe LRU cache for LLM responses with TTL."""

    def __init__(self, max_size: int = 100, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl = ttl_seconds
        self._cache: OrderedDict = OrderedDict()
        self._lock = Lock()
        self._hits = 0
        self._misses = 0

    def _make_key(self, image_b64: str, provider: str, prompt_version: str, timeframe: str, mode: str) -> str:
        image_hash = hashlib.md5(image_b64.encode()).hexdigest()[:16]
        return f"{image_hash}:{provider}:{prompt_version}:{timeframe}:{mode}"

    def get(self, image_b64: str, provider: str, prompt_version: str, timeframe: str, mode: str) -> dict | None:
        key = self._make_key(image_b64, provider, prompt_version, timeframe, mode)
        with self._lock:
            if key in self._cache:
                entry = self._cache[key]
                if time.time() - entry["timestamp"] < self.ttl:
                    self._cache.move_to_end(key)
                    self._hits += 1
                    return entry["result"]
                else:
                    del self._cache[key]
            self._misses += 1
            return None

    def put(self, image_b64: str, provider: str, prompt_version: str, timeframe: str, mode: str, result: dict):
        key = self._make_key(image_b64, provider, prompt_version, timeframe, mode)
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = {"result": result, "timestamp": time.time()}
            if len(self._cache) > self.max_size:
                self._cache.popitem(last=False)

    def stats(self) -> dict:
        with self._lock:
            total = self._hits + self._misses
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": round(self._hits / total * 100, 1) if total > 0 else 0.0,
                "ttl_seconds": self.ttl,
            }

    def clear(self):
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0


# Singleton
_cache = LLMCache()

def get_cache() -> LLMCache:
    return _cache
