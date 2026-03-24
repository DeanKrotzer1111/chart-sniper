from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    provider: str
    image_base64: str
    timeframe: str
    mode: str = Field(..., pattern="^(scalp|swing)$")
    account_balance: float = 10000.0
    strategy: str = "cost_optimized"


class AnalysisResponse(BaseModel):
    direction: str
    confidence: int
    currentPrice: float
    marketTrend: str
    isReversal: bool
    reasoning: List[str]
    pattern: Optional[str] = None
    volume: Optional[str] = None
    momentum: Optional[str] = None
    timeInTrade: Optional[str] = None
    supportLevels: List[float] = []
    resistanceLevels: List[float] = []
    orderBlocks: List[dict] = []
    levels: dict
    consensus: dict
    prompt_version: str
    provider_used: str
    latency_ms: int
    cost: Optional[dict] = None
    routing: Optional[dict] = None
    cached: bool = False


class TradeRecord(BaseModel):
    id: Optional[int] = None
    timestamp: str
    mode: str
    timeframe: str
    direction: str
    entry: float
    sl: float
    tp1: float
    rr_ratio: str
    outcome: Optional[str] = None
    confidence: int
    provider: str
    prompt_version: str


class EvalResult(BaseModel):
    dataset_size: int
    accuracy: float
    precision_buy: float
    precision_sell: float
    recall_buy: float
    recall_sell: float
    avg_confidence: float
    confidence_calibration: float
    provider: str
    prompt_version: str
    timestamp: str
