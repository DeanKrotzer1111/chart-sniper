import logging
from typing import Optional

from fastapi import APIRouter, Depends

from app.models.schemas import TradeRecord
from app.db.database import save_trade, get_trades, get_trade_stats
from app.services.auth import get_current_user, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


@router.get("/history")
async def list_trades(user: Optional[User] = Depends(get_current_user)):
    """Return all trade records."""
    logger.info("list_trades called by user=%s", user)
    trades = await get_trades()
    return trades


@router.post("/history")
async def create_trade(
    record: TradeRecord,
    user: Optional[User] = Depends(get_current_user),
):
    """Save a new trade record."""
    logger.info("create_trade called by user=%s", user)
    trade_id = await save_trade(
        timestamp=record.timestamp,
        mode=record.mode,
        timeframe=record.timeframe,
        direction=record.direction,
        entry=record.entry,
        sl=record.sl,
        tp1=record.tp1,
        rr_ratio=record.rr_ratio,
        outcome=record.outcome,
        confidence=record.confidence,
        provider=record.provider,
        prompt_version=record.prompt_version,
    )
    return {"id": trade_id, "status": "saved"}


@router.get("/history/stats")
async def trade_stats():
    """Return aggregated trade statistics."""
    stats = await get_trade_stats()
    return stats
