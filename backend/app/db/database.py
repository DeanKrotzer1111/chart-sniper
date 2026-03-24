from __future__ import annotations

import aiosqlite
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent.parent.parent / "data" / "chart_sniper.db"


async def init_db():
    """Create database directory and tables if they don't exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analysis_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                provider TEXT NOT NULL,
                prompt_version TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                mode TEXT NOT NULL,
                direction TEXT NOT NULL,
                confidence INTEGER NOT NULL,
                latency_ms INTEGER NOT NULL,
                consensus_agree INTEGER NOT NULL,
                consensus_total INTEGER NOT NULL,
                image_hash TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS trade_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                mode TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                direction TEXT NOT NULL,
                entry REAL NOT NULL,
                sl REAL NOT NULL,
                tp1 REAL NOT NULL,
                rr_ratio TEXT NOT NULL,
                outcome TEXT,
                confidence INTEGER NOT NULL,
                provider TEXT NOT NULL,
                prompt_version TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS eval_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                provider TEXT NOT NULL,
                prompt_version TEXT NOT NULL,
                dataset_size INTEGER NOT NULL,
                accuracy REAL NOT NULL,
                precision_buy REAL NOT NULL,
                precision_sell REAL NOT NULL,
                recall_buy REAL NOT NULL,
                recall_sell REAL NOT NULL,
                avg_confidence REAL NOT NULL,
                confidence_calibration REAL NOT NULL
            )
        """)
        await db.commit()


async def log_analysis(
    provider: str,
    prompt_version: str,
    timeframe: str,
    mode: str,
    direction: str,
    confidence: int,
    latency_ms: int,
    consensus_agree: int,
    consensus_total: int,
    image_hash: str,
):
    """Insert a row into analysis_logs."""
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO analysis_logs
                (timestamp, provider, prompt_version, timeframe, mode,
                 direction, confidence, latency_ms, consensus_agree,
                 consensus_total, image_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ts, provider, prompt_version, timeframe, mode,
                direction, confidence, latency_ms, consensus_agree,
                consensus_total, image_hash,
            ),
        )
        await db.commit()


async def save_trade(
    timestamp: str,
    mode: str,
    timeframe: str,
    direction: str,
    entry: float,
    sl: float,
    tp1: float,
    rr_ratio: str,
    outcome: str | None,
    confidence: int,
    provider: str,
    prompt_version: str,
) -> int:
    """Insert a trade record and return its ID."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO trade_records
                (timestamp, mode, timeframe, direction, entry, sl, tp1,
                 rr_ratio, outcome, confidence, provider, prompt_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                timestamp, mode, timeframe, direction, entry, sl, tp1,
                rr_ratio, outcome, confidence, provider, prompt_version,
            ),
        )
        await db.commit()
        return cursor.lastrowid


async def get_trades() -> list[dict]:
    """Return all trade records as a list of dicts."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_records ORDER BY timestamp DESC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_trade_stats() -> dict:
    """Return aggregated trade statistics."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        cursor = await db.execute("SELECT COUNT(*) as total FROM trade_records")
        total = (await cursor.fetchone())["total"]

        cursor = await db.execute(
            "SELECT COUNT(*) as wins FROM trade_records WHERE outcome = 'WIN'"
        )
        wins = (await cursor.fetchone())["wins"]

        cursor = await db.execute(
            "SELECT COUNT(*) as losses FROM trade_records WHERE outcome = 'LOSS'"
        )
        losses = (await cursor.fetchone())["losses"]

        win_rate = (wins / total * 100) if total > 0 else 0.0

        # Breakdown by mode
        cursor = await db.execute("""
            SELECT mode,
                   COUNT(*) as total,
                   SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as wins,
                   SUM(CASE WHEN outcome = 'LOSS' THEN 1 ELSE 0 END) as losses
            FROM trade_records
            GROUP BY mode
        """)
        by_mode_rows = await cursor.fetchall()
        by_mode = {}
        for row in by_mode_rows:
            row_dict = dict(row)
            mode_total = row_dict["total"]
            mode_wins = row_dict["wins"]
            by_mode[row_dict["mode"]] = {
                "total": mode_total,
                "wins": mode_wins,
                "losses": row_dict["losses"],
                "win_rate": round(mode_wins / mode_total * 100, 2) if mode_total > 0 else 0.0,
            }

        return {
            "total_trades": total,
            "wins": wins,
            "losses": losses,
            "win_rate": round(win_rate, 2),
            "by_mode": by_mode,
        }


async def save_eval_run(
    provider: str,
    prompt_version: str,
    dataset_size: int,
    accuracy: float,
    precision_buy: float,
    precision_sell: float,
    recall_buy: float,
    recall_sell: float,
    avg_confidence: float,
    confidence_calibration: float,
) -> int:
    """Insert an eval run and return its ID."""
    ts = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO eval_runs
                (timestamp, provider, prompt_version, dataset_size, accuracy,
                 precision_buy, precision_sell, recall_buy, recall_sell,
                 avg_confidence, confidence_calibration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ts, provider, prompt_version, dataset_size, accuracy,
                precision_buy, precision_sell, recall_buy, recall_sell,
                avg_confidence, confidence_calibration,
            ),
        )
        await db.commit()
        return cursor.lastrowid


async def get_eval_runs() -> list[dict]:
    """Return all evaluation runs as a list of dicts."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM eval_runs ORDER BY timestamp DESC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
