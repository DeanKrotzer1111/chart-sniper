from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.services.llm import LLMProvider
from app.services.consensus import run_consensus_analysis
from app.db.database import save_eval_run

DATASET_PATH = Path(__file__).parent / "datasets" / "labels.json"


def load_dataset(path: str = None) -> list[dict]:
    """Load labeled examples from JSON file."""
    file_path = Path(path) if path else DATASET_PATH
    with open(file_path, "r") as f:
        return json.load(f)


def calculate_metrics(predictions: list[dict]) -> dict:
    """Compute accuracy, precision, recall, and confidence calibration.

    Each prediction dict has: predicted, expected, confidence, correct (bool).
    """
    if not predictions:
        return {
            "accuracy": 0.0,
            "precision_buy": 0.0,
            "precision_sell": 0.0,
            "recall_buy": 0.0,
            "recall_sell": 0.0,
            "avg_confidence": 0.0,
            "confidence_calibration": 0.0,
        }

    total = len(predictions)
    correct = sum(1 for p in predictions if p["correct"])
    accuracy = correct / total

    # Precision and recall for BUY
    predicted_buy = [p for p in predictions if p["predicted"] == "BUY"]
    actual_buy = [p for p in predictions if p["expected"] == "BUY"]
    tp_buy = sum(1 for p in predicted_buy if p["correct"])
    precision_buy = tp_buy / len(predicted_buy) if predicted_buy else 0.0
    recall_buy = tp_buy / len(actual_buy) if actual_buy else 0.0

    # Precision and recall for SELL
    predicted_sell = [p for p in predictions if p["predicted"] == "SELL"]
    actual_sell = [p for p in predictions if p["expected"] == "SELL"]
    tp_sell = sum(1 for p in predicted_sell if p["correct"])
    precision_sell = tp_sell / len(predicted_sell) if predicted_sell else 0.0
    recall_sell = tp_sell / len(actual_sell) if actual_sell else 0.0

    # Average confidence
    avg_confidence = sum(p["confidence"] for p in predictions) / total

    # Confidence calibration: correlation between confidence and correctness
    # Simple approach: avg confidence of correct - avg confidence of incorrect
    correct_preds = [p for p in predictions if p["correct"]]
    incorrect_preds = [p for p in predictions if not p["correct"]]
    avg_conf_correct = (
        sum(p["confidence"] for p in correct_preds) / len(correct_preds)
        if correct_preds
        else 0.0
    )
    avg_conf_incorrect = (
        sum(p["confidence"] for p in incorrect_preds) / len(incorrect_preds)
        if incorrect_preds
        else 0.0
    )
    # Calibration score: positive means higher confidence on correct predictions
    confidence_calibration = (avg_conf_correct - avg_conf_incorrect) / 100.0

    return {
        "accuracy": round(accuracy, 4),
        "precision_buy": round(precision_buy, 4),
        "precision_sell": round(precision_sell, 4),
        "recall_buy": round(recall_buy, 4),
        "recall_sell": round(recall_sell, 4),
        "avg_confidence": round(avg_confidence, 2),
        "confidence_calibration": round(confidence_calibration, 4),
    }


async def run_benchmark(
    provider: str, api_key: str = None, prompt_version: str = "v1"
) -> dict:
    """Run evaluation against all labeled examples and return metrics.

    For examples without an image_path (or with null), a placeholder analysis
    is generated since we cannot run vision without an actual image.
    """
    dataset = load_dataset()
    llm = LLMProvider(provider=provider, api_key=api_key)

    predictions: list[dict] = []

    for example in dataset:
        image_path = example.get("image_path")
        expected_direction = example["expected_direction"].upper()

        if image_path:
            # Load image and run real analysis
            with open(image_path, "rb") as f:
                import base64
                image_b64 = base64.b64encode(f.read()).decode()

            result = await run_consensus_analysis(
                llm=llm,
                image_b64=image_b64,
                timeframe="1-Min",
                mode="scalp",
                prompt_version=prompt_version,
            )
            predicted = result.get("direction", "NEUTRAL").upper()
            confidence = result.get("confidence", 0)
        else:
            # No image available -- skip real analysis
            predicted = "NEUTRAL"
            confidence = 0

        predictions.append({
            "id": example.get("id"),
            "description": example.get("description", ""),
            "predicted": predicted,
            "expected": expected_direction,
            "confidence": confidence,
            "correct": predicted == expected_direction,
        })

    metrics = calculate_metrics(predictions)

    # Save to database
    await save_eval_run(
        provider=provider,
        prompt_version=prompt_version,
        dataset_size=len(dataset),
        accuracy=metrics["accuracy"],
        precision_buy=metrics["precision_buy"],
        precision_sell=metrics["precision_sell"],
        recall_buy=metrics["recall_buy"],
        recall_sell=metrics["recall_sell"],
        avg_confidence=metrics["avg_confidence"],
        confidence_calibration=metrics["confidence_calibration"],
    )

    return {
        "dataset_size": len(dataset),
        "provider": provider,
        "prompt_version": prompt_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "predictions": predictions,
        **metrics,
    }
