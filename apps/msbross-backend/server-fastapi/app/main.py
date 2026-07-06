import os, logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db import init_db
from app.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("msbross")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    os.makedirs(settings.public_dir, exist_ok=True)
    os.makedirs(os.path.join(settings.public_dir, "icons"), exist_ok=True)
    logger.info(f"MSBrOSs AI Server on port {settings.port}")
    yield
    logger.info("MSBrOSs AI Server shutting down")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if os.path.isdir(settings.public_dir):
    app.mount("/", StaticFiles(directory=settings.public_dir, html=True), name="public")
