"""
Authentication Service

JWT-based auth using Supabase. Validates tokens from the frontend
and extracts user info. Falls back to anonymous access if auth
is not configured (for local development).
"""

from __future__ import annotations

import os
from typing import Optional
from functools import lru_cache

import httpx
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")


class User:
    """Authenticated user from Supabase JWT."""
    def __init__(self, id: str, email: str, role: str = "user"):
        self.id = id
        self.email = email
        self.role = role

    def __repr__(self):
        return f"User(id={self.id}, email={self.email})"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """
    Extract and validate the user from a Supabase JWT.
    Returns None if auth is not configured or no token provided (anonymous access).
    """
    if not SUPABASE_URL or not credentials:
        return None  # Auth not configured or no token — allow anonymous

    token = credentials.credentials

    try:
        # Validate token with Supabase
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY,
                },
                timeout=10.0,
            )

        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_data = response.json()
        return User(
            id=user_data.get("id", ""),
            email=user_data.get("email", ""),
            role=user_data.get("role", "user"),
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Auth service unavailable")


async def require_auth(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    """Dependency that requires authentication. Raises 401 if not authenticated."""
    if user is None:
        if not SUPABASE_URL:
            # Auth not configured — return anonymous user for dev
            return User(id="anonymous", email="dev@localhost", role="dev")
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
