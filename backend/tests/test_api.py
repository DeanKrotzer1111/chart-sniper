"""Tests for FastAPI endpoints (non-LLM routes)."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import init_db


@pytest.fixture(autouse=True)
async def setup_db():
    """Ensure database is initialized before each test."""
    await init_db()


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "chart-sniper"


@pytest.mark.asyncio
async def test_get_history_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/history")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_trade_stats():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/history/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_trades" in data
        assert "win_rate" in data


@pytest.mark.asyncio
async def test_save_and_retrieve_trade():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
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
        response = await client.post("/api/history", json=trade)
        assert response.status_code == 200
        assert response.json()["status"] == "saved"

        response = await client.get("/api/history")
        trades = response.json()
        assert len(trades) >= 1
        assert trades[0]["direction"] == "BUY"


@pytest.mark.asyncio
async def test_get_eval_results():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/eval/results")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
