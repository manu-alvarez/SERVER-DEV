import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os

from app.core.config import settings
from app.presentation.api.routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration
    sentry_sdk.init(dsn=settings.SENTRY_DSN, integrations=[StarletteIntegration(), FastApiIntegration()], traces_sample_rate=0.1)
    logger.info("Sentry initialized.")

background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.infrastructure.tools.telegram_tool import telegram_polling_loop
    from app.application.use_cases.memory_service import cleanup_task
    if settings.TELEGRAM_BOT_TOKEN:
        logger.info("Starting Telegram polling...")
        tg = asyncio.create_task(telegram_polling_loop())
        background_tasks.add(tg); tg.add_done_callback(background_tasks.discard)
    logger.info("Starting memory cleanup...")
    cl = asyncio.create_task(cleanup_task(idle_minutes=10))
    background_tasks.add(cl); cl.add_done_callback(background_tasks.discard)
    yield
    logger.info("Shutting down...")
    for t in background_tasks: t.cancel()
    await asyncio.gather(*background_tasks, return_exceptions=True)

app = FastAPI(title="IAPuta OS Core API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.get_cors_origins(), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)

@app.get("/health")
def health(): return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=False)
