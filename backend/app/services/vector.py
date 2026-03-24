from __future__ import annotations

"""
Vector Store Service

Uses ChromaDB to store and retrieve similar chart analyses.
Each analysis is embedded and stored with its metadata (direction, confidence,
timeframe, mode, outcome). When a new chart is analyzed, we retrieve the
most similar past analyses to provide historical context and improve
the prompt with few-shot examples.
"""

import chromadb
from chromadb.config import Settings
from pathlib import Path
import json
import hashlib
from datetime import datetime

CHROMA_DIR = Path(__file__).parent.parent.parent / "data" / "chroma"


class VectorStore:
    """Manages chart analysis embeddings for similarity search."""

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(
            name="chart_analyses",
            metadata={"description": "Historical chart analysis results"}
        )

    def store_analysis(
        self,
        analysis_text: str,
        direction: str,
        confidence: int,
        timeframe: str,
        mode: str,
        outcome: str = None,
        image_hash: str = None
    ) -> str:
        """
        Store a completed analysis in the vector DB.

        Args:
            analysis_text: The reasoning/analysis text to embed
            direction: BUY/SELL/NEUTRAL
            confidence: 0-100
            timeframe: e.g., "1-Min", "4-Hr"
            mode: "scalp" or "swing"
            outcome: "won", "lost", or None (not yet known)
            image_hash: Optional hash of the chart image

        Returns:
            Document ID
        """
        doc_id = hashlib.md5(
            f"{analysis_text}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        metadata = {
            "direction": direction,
            "confidence": confidence,
            "timeframe": timeframe,
            "mode": mode,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if outcome:
            metadata["outcome"] = outcome
        if image_hash:
            metadata["image_hash"] = image_hash

        self.collection.add(
            documents=[analysis_text],
            metadatas=[metadata],
            ids=[doc_id]
        )
        return doc_id

    def find_similar(
        self,
        query_text: str,
        n_results: int = 3,
        mode: str = None,
        timeframe: str = None
    ) -> list[dict]:
        """
        Find similar past analyses using semantic search.

        Args:
            query_text: The current analysis or chart description
            n_results: Number of similar results to return
            mode: Optional filter by trading mode
            timeframe: Optional filter by timeframe

        Returns:
            List of similar analyses with metadata
        """
        where_filter = {}
        if mode:
            where_filter["mode"] = mode
        if timeframe:
            where_filter["timeframe"] = timeframe

        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where_filter if where_filter else None
            )
        except Exception:
            return []

        similar = []
        if results and results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                entry = {
                    "analysis": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else None,
                    "id": results["ids"][0][i] if results["ids"] else None,
                }
                similar.append(entry)
        return similar

    def update_outcome(self, doc_id: str, outcome: str):
        """Update the outcome of a stored analysis."""
        self.collection.update(
            ids=[doc_id],
            metadatas=[{"outcome": outcome}]
        )

    def get_stats(self) -> dict:
        """Get collection statistics."""
        count = self.collection.count()
        return {
            "total_analyses": count,
            "collection_name": "chart_analyses"
        }


# Singleton instance
_store = None

def get_vector_store() -> VectorStore:
    """Get or create the singleton VectorStore instance."""
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
