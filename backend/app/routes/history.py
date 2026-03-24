from fastapi import APIRouter

from app.models.schemas import TradeRecord
from app.db.database import save_trade, get_trades, get_trade_stats

router = APIRouter(prefix="/api")


@router.get("/history")
async def list_trades():
    """Return all trade records."""
    trades = await get_trades()
    return trades


@router.post("/history")
async def create_trade(record: TradeRecord):
    """Save a new trade record."""
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
