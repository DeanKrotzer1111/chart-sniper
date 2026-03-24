from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from app.db.database import init_db
from app.routes import analysis, history, eval

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Chart Sniper",
    description="AI-powered trading chart analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)
app.include_router(history.router)
app.include_router(eval.router)

FastAPIInstrumentor.instrument_app(app)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "chart-sniper"}
