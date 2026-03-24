from fastapi import APIRouter

from app.eval.benchmark import run_benchmark
from app.db.database import get_eval_runs

router = APIRouter(prefix="/api")


@router.post("/eval/run")
async def run_evaluation(provider: str, prompt_version: str = "v1"):
    """Run evaluation against the labeled dataset and return metrics."""
    result = await run_benchmark(provider=provider, prompt_version=prompt_version)
    return result


@router.get("/eval/results")
async def list_eval_results():
    """Return all past evaluation runs."""
    runs = await get_eval_runs()
    return runs
