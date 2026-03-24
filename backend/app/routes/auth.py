"""Auth routes for user management."""

from fastapi import APIRouter, Depends
from typing import Optional
from app.services.auth import get_current_user, require_auth, User, SUPABASE_URL

router = APIRouter(prefix="/api/auth")


@router.get("/me")
async def get_me(user: Optional[User] = Depends(get_current_user)):
    """Get current user info. Returns null if not authenticated."""
    if user is None:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }


@router.get("/config")
async def auth_config():
    """Return auth configuration for the frontend."""
    return {
        "auth_enabled": bool(SUPABASE_URL),
        "provider": "supabase" if SUPABASE_URL else None,
    }
