"""
Billing Service

Manages usage-based billing via Stripe.
Free tier: 5 analyses per day.
Paid: $0.15 per analysis or $29/month unlimited.

Usage is tracked in SQLite. Stripe handles payment processing.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta
from typing import Optional

import aiosqlite
from app.db.database import DB_PATH

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_PRICE_PER_ANALYSIS = os.environ.get("STRIPE_PRICE_ID_ANALYSIS", "")
STRIPE_PRICE_MONTHLY = os.environ.get("STRIPE_PRICE_ID_MONTHLY", "")

FREE_DAILY_LIMIT = 5


async def init_billing_table():
    """Create the usage tracking table if it doesn't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS usage_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                analysis_type TEXT NOT NULL DEFAULT 'chart_analysis'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                stripe_customer_id TEXT,
                stripe_subscription_id TEXT,
                plan TEXT NOT NULL DEFAULT 'free',
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.commit()


async def get_daily_usage(user_id: str) -> int:
    """Get the number of analyses used today by a user."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT COUNT(*) FROM usage_log WHERE user_id = ? AND timestamp LIKE ?",
            (user_id, f"{today}%"),
        )
        row = await cursor.fetchone()
        return row[0] if row else 0


async def record_usage(user_id: str):
    """Record an analysis usage event."""
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO usage_log (user_id, timestamp) VALUES (?, ?)",
            (user_id, ts),
        )
        await db.commit()


async def get_user_plan(user_id: str) -> str:
    """Get the user's current subscription plan."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT plan, status FROM subscriptions WHERE user_id = ? AND status = 'active'",
            (user_id,),
        )
        row = await cursor.fetchone()
        return dict(row)["plan"] if row else "free"


async def check_can_analyze(user_id: str) -> dict:
    """
    Check if a user can run an analysis.
    Returns: {"allowed": bool, "reason": str, "usage": int, "limit": int, "plan": str}
    """
    plan = await get_user_plan(user_id)

    if plan in ("pro", "unlimited"):
        usage = await get_daily_usage(user_id)
        return {
            "allowed": True,
            "reason": "Unlimited analyses on pro plan",
            "usage": usage,
            "limit": -1,  # unlimited
            "plan": plan,
        }

    # Free tier: check daily limit
    usage = await get_daily_usage(user_id)
    if usage >= FREE_DAILY_LIMIT:
        return {
            "allowed": False,
            "reason": f"Daily limit reached ({FREE_DAILY_LIMIT} free analyses/day). Upgrade to Pro for unlimited.",
            "usage": usage,
            "limit": FREE_DAILY_LIMIT,
            "plan": "free",
        }

    return {
        "allowed": True,
        "reason": f"{FREE_DAILY_LIMIT - usage} free analyses remaining today",
        "usage": usage,
        "limit": FREE_DAILY_LIMIT,
        "plan": "free",
    }


async def create_subscription(user_id: str, plan: str, stripe_customer_id: str = "", stripe_subscription_id: str = ""):
    """Create or update a user's subscription."""
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'active', ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                plan = excluded.plan,
                stripe_customer_id = excluded.stripe_customer_id,
                stripe_subscription_id = excluded.stripe_subscription_id,
                status = 'active',
                updated_at = excluded.updated_at
        """, (user_id, stripe_customer_id, stripe_subscription_id, plan, ts, ts))
        await db.commit()
