"""Tests for risk management calculations."""

import pytest
from app.services.risk import calc_levels, get_timeframe_params


class TestCalcLevels:
    scalp_1m = {"stopPts": 5, "tpPts": 7, "riskPct": 0.20}
    swing_4h = {"stopPts": 50, "tpPts": 75, "riskPct": 1.0}

    def test_buy_stop_loss_below_entry(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 10000)
        assert levels["sl"] == 24995

    def test_buy_tp1_above_entry(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 10000)
        assert levels["tp1"] == 25007

    def test_buy_tp2_at_1_5x(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 10000)
        assert levels["tp2"] == 25010.5

    def test_sell_stop_loss_above_entry(self):
        levels = calc_levels(25000, "SELL", self.scalp_1m, 10000)
        assert levels["sl"] == 25005

    def test_sell_tp1_below_entry(self):
        levels = calc_levels(25000, "SELL", self.scalp_1m, 10000)
        assert levels["tp1"] == 24993

    def test_sell_tp2_at_1_5x(self):
        levels = calc_levels(25000, "SELL", self.scalp_1m, 10000)
        assert levels["tp2"] == 24989.5

    def test_dollar_risk_scalp(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 10000)
        assert levels["dollarRisk"] == 20  # 10000 * 0.20 / 100

    def test_dollar_risk_swing(self):
        levels = calc_levels(5000, "SELL", self.swing_4h, 50000)
        assert levels["dollarRisk"] == 500  # 50000 * 1.0 / 100

    def test_zero_balance(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 0)
        assert levels["dollarRisk"] == 0

    def test_rr_ratio_scalp(self):
        levels = calc_levels(25000, "BUY", self.scalp_1m, 10000)
        assert levels["rrRatio"] == "1.40:1"

    def test_rr_ratio_swing(self):
        levels = calc_levels(5000, "SELL", self.swing_4h, 50000)
        assert levels["rrRatio"] == "1.50:1"


class TestGetTimeframeParams:
    def test_scalp_1min(self):
        params = get_timeframe_params("1-Min", "scalp")
        assert params["stopPts"] == 5
        assert params["tpPts"] == 7
        assert params["riskPct"] == 0.20

    def test_swing_daily(self):
        params = get_timeframe_params("Daily", "swing")
        assert params["stopPts"] == 80
        assert params["riskPct"] == 1.5

    def test_invalid_timeframe_raises(self):
        with pytest.raises(ValueError, match="Unknown timeframe"):
            get_timeframe_params("Invalid", "scalp")

    def test_all_scalp_timeframes_exist(self):
        for tf in ["1-Sec", "5-Sec", "15-Sec", "30-Sec", "1-Min", "3-Min", "5-Min"]:
            params = get_timeframe_params(tf, "scalp")
            assert "stopPts" in params

    def test_all_swing_timeframes_exist(self):
        for tf in ["15-Min", "30-Min", "1-Hr", "2-Hr", "4-Hr", "Daily", "Weekly", "Monthly"]:
            params = get_timeframe_params(tf, "swing")
            assert "stopPts" in params
