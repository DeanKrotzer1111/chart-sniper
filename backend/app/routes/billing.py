"""Billing routes for usage tracking and Stripe integration."""

from __future__ import annotations

import os
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.services.auth import get_current_user, require_auth, User
from app.services.billing import (
    check_can_analyze,
    get_daily_usage,
    get_user_plan,
    create_subscription,
    FREE_DAILY_LIMIT,
    STRIPE_SECRET_KEY,
)

router = APIRouter(prefix="/api/billing")


@router.get("/usage")
async def get_usage(user: User = Depends(require_auth)):
    """Get current user's usage and plan info."""
    status = await check_can_analyze(user.id)
    return status


@router.get("/plans")
async def list_plans():
    """List available pricing plans."""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "analyses_per_day": FREE_DAILY_LIMIT,
                "features": ["5 analyses/day", "All providers", "Basic journal"],
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 29,
                "price_label": "$29/month",
                "analyses_per_day": -1,
                "features": ["Unlimited analyses", "All providers", "Full journal & history", "Priority support"],
            },
        ]
    }


@router.post("/checkout")
async def create_checkout(user: User = Depends(require_auth)):
    """Create a Stripe checkout session for Pro plan."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Stripe not configured. Set STRIPE_SECRET_KEY to enable billing.",
        )

    stripe.api_key = STRIPE_SECRET_KEY
    price_id = os.environ.get("STRIPE_PRICE_ID_MONTHLY", "")

    if not price_id:
        raise HTTPException(status_code=503, detail="Stripe price ID not configured")

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=os.environ.get("FRONTEND_URL", "http://localhost:3000") + "?billing=success",
            cancel_url=os.environ.get("FRONTEND_URL", "http://localhost:3000") + "?billing=cancel",
            metadata={"user_id": user.id},
        )
        return {"checkout_url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events (subscription created/cancelled)."""
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=200, content={"received": True})

    stripe.api_key = STRIPE_SECRET_KEY
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            import json
            event = json.loads(payload)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        user_id = data.get("metadata", {}).get("user_id")
        customer_id = data.get("customer", "")
        subscription_id = data.get("subscription", "")
        if user_id:
            await create_subscription(user_id, "pro", customer_id, subscription_id)

    elif event_type == "customer.subscription.deleted":
        # Downgrade to free
        customer_id = data.get("customer", "")
        # Would need to look up user by customer_id in production

    return {"received": True}
