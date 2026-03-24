"""Tests for authentication service."""

from __future__ import annotations

import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.database import init_db
from app.services.auth import User, get_current_user


@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()


@pytest.mark.asyncio
async def test_auth_config_no_supabase():
    """When Supabase is not configured, auth_enabled is False."""
    with patch("app.services.auth.SUPABASE_URL", ""):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/auth/config")
            assert response.status_code == 200
            data = response.json()
            assert data["auth_enabled"] is False


@pytest.mark.asyncio
async def test_get_me_unauthenticated():
    """When no token is provided, user is None."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is False


@pytest.mark.asyncio
async def test_get_me_with_valid_user():
    """When auth returns a user, /me returns user info."""
    mock_user = User(id="user-123", email="dean@test.com", role="user")

    def mock_get_user():
        return mock_user

    app.dependency_overrides[get_current_user] = mock_get_user
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/api/auth/me")
            assert response.status_code == 200
            data = response.json()
            assert data["authenticated"] is True
            assert data["user"]["email"] == "dean@test.com"
    finally:
        app.dependency_overrides.clear()
