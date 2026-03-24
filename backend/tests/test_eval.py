"""Tests for evaluation/benchmarking logic."""

from app.eval.benchmark import calculate_metrics, load_dataset


class TestCalculateMetrics:
    def test_empty_predictions(self):
        metrics = calculate_metrics([])
        assert metrics["accuracy"] == 0.0

    def test_perfect_accuracy(self):
        predictions = [
            {"predicted": "BUY", "expected": "BUY", "confidence": 90, "correct": True},
            {"predicted": "SELL", "expected": "SELL", "confidence": 85, "correct": True},
        ]
        metrics = calculate_metrics(predictions)
        assert metrics["accuracy"] == 1.0
        assert metrics["precision_buy"] == 1.0
        assert metrics["precision_sell"] == 1.0

    def test_zero_accuracy(self):
        predictions = [
            {"predicted": "SELL", "expected": "BUY", "confidence": 90, "correct": False},
            {"predicted": "BUY", "expected": "SELL", "confidence": 85, "correct": False},
        ]
        metrics = calculate_metrics(predictions)
        assert metrics["accuracy"] == 0.0

    def test_mixed_accuracy(self):
        predictions = [
            {"predicted": "BUY", "expected": "BUY", "confidence": 80, "correct": True},
            {"predicted": "SELL", "expected": "BUY", "confidence": 60, "correct": False},
            {"predicted": "SELL", "expected": "SELL", "confidence": 75, "correct": True},
            {"predicted": "BUY", "expected": "SELL", "confidence": 55, "correct": False},
        ]
        metrics = calculate_metrics(predictions)
        assert metrics["accuracy"] == 0.5
        assert metrics["precision_buy"] == 0.5
        assert metrics["precision_sell"] == 0.5

    def test_confidence_calibration_positive(self):
        predictions = [
            {"predicted": "BUY", "expected": "BUY", "confidence": 90, "correct": True},
            {"predicted": "SELL", "expected": "BUY", "confidence": 40, "correct": False},
        ]
        metrics = calculate_metrics(predictions)
        assert metrics["confidence_calibration"] > 0  # Higher confidence on correct

    def test_avg_confidence(self):
        predictions = [
            {"predicted": "BUY", "expected": "BUY", "confidence": 80, "correct": True},
            {"predicted": "SELL", "expected": "SELL", "confidence": 60, "correct": True},
        ]
        metrics = calculate_metrics(predictions)
        assert metrics["avg_confidence"] == 70.0


class TestLoadDataset:
    def test_loads_default_dataset(self):
        dataset = load_dataset()
        assert len(dataset) >= 3
        assert "expected_direction" in dataset[0]
        assert "description" in dataset[0]
