SCALP_TIMEFRAMES: dict[str, dict] = {
    "1-Sec":  {"stopPts": 2,  "tpPts": 2.6,   "riskPct": 0.10},
    "5-Sec":  {"stopPts": 3,  "tpPts": 4,     "riskPct": 0.12},
    "15-Sec": {"stopPts": 3,  "tpPts": 4.2,   "riskPct": 0.15},
    "30-Sec": {"stopPts": 4,  "tpPts": 5.6,   "riskPct": 0.18},
    "1-Min":  {"stopPts": 5,  "tpPts": 7,     "riskPct": 0.20},
    "3-Min":  {"stopPts": 7,  "tpPts": 10,    "riskPct": 0.25},
    "5-Min":  {"stopPts": 12, "tpPts": 18.72, "riskPct": 0.40},
}

SWING_TIMEFRAMES: dict[str, dict] = {
    "15-Min":  {"stopPts": 15,  "tpPts": 22.5,  "riskPct": 0.50},
    "30-Min":  {"stopPts": 20,  "tpPts": 30,    "riskPct": 0.60},
    "1-Hr":    {"stopPts": 30,  "tpPts": 45,    "riskPct": 0.70},
    "2-Hr":    {"stopPts": 40,  "tpPts": 60,    "riskPct": 0.80},
    "4-Hr":    {"stopPts": 50,  "tpPts": 75,    "riskPct": 1.0},
    "Daily":   {"stopPts": 80,  "tpPts": 120,   "riskPct": 1.5},
    "Weekly":  {"stopPts": 120, "tpPts": 180,   "riskPct": 1.8},
    "Monthly": {"stopPts": 200, "tpPts": 300,   "riskPct": 2.0},
}


def get_timeframe_params(timeframe: str, mode: str) -> dict:
    """Look up risk parameters for the given timeframe and mode."""
    source = SCALP_TIMEFRAMES if mode == "scalp" else SWING_TIMEFRAMES
    params = source.get(timeframe)
    if params is None:
        raise ValueError(
            f"Unknown timeframe '{timeframe}' for mode '{mode}'. "
            f"Available: {list(source.keys())}"
        )
    return params


def calc_levels(
    price: float, direction: str, timeframe_params: dict, balance: float
) -> dict:
    """Calculate stop-loss, take-profit levels, and dollar risk."""
    stop_pts = timeframe_params["stopPts"]
    tp_pts = timeframe_params["tpPts"]
    risk_pct = timeframe_params["riskPct"]

    if direction.upper() == "SELL":
        sl = round(price + stop_pts, 2)
        tp1 = round(price - tp_pts, 2)
        tp2 = round(price - tp_pts * 1.5, 2)
    else:
        sl = round(price - stop_pts, 2)
        tp1 = round(price + tp_pts, 2)
        tp2 = round(price + tp_pts * 1.5, 2)

    dollar_risk = round(balance * risk_pct / 100, 2)
    rr_ratio = f"{(tp_pts / stop_pts):.2f}:1" if stop_pts > 0 else "0:1"

    return {
        "sl": sl,
        "tp1": tp1,
        "tp2": tp2,
        "dollarRisk": dollar_risk,
        "rrRatio": rr_ratio,
        "riskPct": risk_pct,
        "stopPts": stop_pts,
        "tpPts": tp_pts,
    }
