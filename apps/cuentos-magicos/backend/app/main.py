import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.core.db import init_db, close_db
from app.api.stories import router as stories_router

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# Ensure storage directory exists
STORAGE_DIR = Path(__file__).parent.parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logging.info("Starting CuentosMagicos AI backend...")
    if settings.APP_ENV == "development":
        await init_db()
    yield
    logging.info("Shutting down CuentosMagicos AI backend...")
    await close_db()


app = FastAPI(
    title="CuentosMagicos AI",
    description="AI-powered children's story generation platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend (all origins for external access)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.manuelalvarez\.dev|http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local storage files
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Register routers
app.include_router(stories_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "CuentosMagicos AI",
        "version": "1.0.0",
        "docs": "/docs",
    }
