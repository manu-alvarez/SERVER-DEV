import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.process import router as process_router
from app.routes.extras import router as extras_router
from app.routes.documents import router as documents_router
from app.routes.health import router as health_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("traductor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Arantxa API starting on port {settings.port}")
    yield
    logger.info("Arantxa API shutting down")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(process_router, prefix="/api")
app.include_router(extras_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
