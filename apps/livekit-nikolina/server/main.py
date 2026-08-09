"""
MSB LiveKit Voice Assistant — Token + API Server.

Exposes:
- /api/token (LiveKit JWT + agent dispatch)
- /api/* dashboard endpoints
- /api/dev/* developer pipeline/config endpoints
"""

import asyncio
import sys
import os
# Ensure the local src is in the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

import importlib.util
import json
import logging
import os
import shutil
import subprocess
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.error import URLError
from urllib.request import urlopen

import uvicorn
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from livekit.api import AccessToken, LiveKitAPI, VideoGrants
from livekit.api.agent_dispatch_service import CreateAgentDispatchRequest
from pydantic import BaseModel

from src.core.database import db
from src.core.auth import get_current_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.api.routes import router as api_router

load_dotenv()

logger = logging.getLogger("token-server")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="MSB LiveKit Token Server")

@app.get("/")
def root_path():
    return {"status": "online", "service": "Nikolina API Hub", "version": "1.0.0"}

app.include_router(api_router, prefix="/api")

ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://livekit.msbross.me,http://localhost:5173,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Authentication (JWT) handled by core.auth
# ---------------------------------------------------------------------------

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_user = os.getenv("ADMIN_USERNAME")
    admin_pass = os.getenv("ADMIN_PASSWORD")
    if not admin_user or not admin_pass:
        raise HTTPException(status_code=500, detail="Admin credentials not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.")
    
    if form_data.username != admin_user or form_data.password != admin_pass:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------


# Note: RestaurantInfoUpdate, TableCreate/Update, ReservationCreate,
# MenuItemCreate/Update schemas are defined in src/api/routes.py.
# Only schemas used directly by main.py endpoints remain here.

class TokenRequest(BaseModel):
    participant_identity: str
    room_name: str


class LLMConfigUpdate(BaseModel):
    model_name: Optional[str] = None
    voice: Optional[str] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    enable_internet_search: Optional[bool] = None
    vad_sensitivity: Optional[float] = None
    turn_detection_mode: Optional[str] = None
    max_call_duration_minutes: Optional[int] = None


class PipelineConfigUpdate(BaseModel):
    name: Optional[str] = None
    architecture: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_temperature: Optional[float] = None
    stt_provider: Optional[str] = None
    stt_model: Optional[str] = None
    stt_language: Optional[str] = None
    stt_server_url: Optional[str] = None
    tts_provider: Optional[str] = None
    tts_voice: Optional[str] = None
    tts_speed: Optional[float] = None
    tts_server_url: Optional[str] = None
    realtime_provider: Optional[str] = None
    realtime_model: Optional[str] = None
    realtime_voice: Optional[str] = None
    google_stt_model: Optional[str] = None
    google_tts_voice: Optional[str] = None
    is_active: Optional[int] = None


AVAILABLE_VOICES = [
    # ── Kokoro TTS voices (modular pipeline) ──
    # Prefix convention: 1st letter=language (a=American EN, b=British EN, e=Spanish,
    #   f=French, h=Hindi, i=Italian, j=Japanese, p=Portuguese, z=Chinese)
    # 2nd letter=gender (f=female, m=male)
    # Spanish (for Nikolina - restaurant assistant)
    "ef_dora",        # Spanish Female — best for Nikolina
    "em_alex",        # Spanish Male
    "em_santa",       # Spanish Male
    # American English
    "af_aoede", "af_alloy", "af_bella", "af_heart", "af_nicole", "af_nova", "af_sky",
    "am_adam", "am_echo", "am_michael", "am_puck",
    # ── Gemini Native Realtime voices (only for realtime architecture) ──
    "Aoede", "Charon", "Fenrir", "Kore", "Puck", "Leda",
]
AVAILABLE_MODELS = [
    # Ollama models (verified: tool support + fits VPS RAM)
    "llama3.2:1b",
    "llama3.2:3b",
    # Gemini models
    "gemini-omni",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
]

PIPELINE_CATALOG = {
    "llm": {
        "providers": ["gemini", "ollama"],
        "models": [
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
            "llama3.2:3b",
            "llama3.2:1b",
        ],
    },
    "stt": {
        "providers": [
            "faster-whisper",
        ],
        "urls": {
            "faster-whisper": "http://host.docker.internal:9000",
        },
    },
    "tts": {
        "providers": [
            "kokoro",
        ],
        "urls": {
            "kokoro": "http://host.docker.internal:8001",
        },
    },
    "realtime": {
        "providers": [
            "gemini",
        ],
        "models": [
            "gemini-omni",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
        ],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _http_available(url: str, timeout: float = 2.0) -> bool:
    try:
        with urlopen(url, timeout=timeout):
            return True
    except (URLError, TimeoutError, ValueError):
        return False


def _has_python_pkg(pkg_name: str) -> bool:
    return importlib.util.find_spec(pkg_name) is not None


def _ollama_status() -> dict:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

    # Add system PATH to ensure we find ollama
    current_path = os.environ.get("PATH", "")
    if "/usr/local/bin" not in current_path:
        os.environ["PATH"] = current_path + ":/usr/local/bin:/usr/bin:/bin"

    if not shutil.which("ollama"):
        return {
            "available": False,
            "url": base_url,
            "models": [],
            "note": "ollama binary not installed",
        }

    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            return {
                "available": False,
                "url": base_url,
                "models": [],
                "note": (
                    result.stderr or result.stdout or "ollama server unavailable"
                ).strip(),
            }

        models: list[str] = []
        lines = result.stdout.strip().splitlines()
        for line in lines[1:]:
            parts = line.split()
            if parts:
                models.append(parts[0])

        return {
            "available": True,
            "url": base_url,
            "models": models,
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "available": False,
            "url": base_url,
            "models": [],
            "note": str(exc),
        }


def _sync_llm_config_with_active_pipeline() -> None:
    """Keep llm_config aligned with selected active pipeline."""
    pipeline = db.get_active_pipeline_config()
    if not pipeline:
        return

    update: dict = {
        "temperature": float(pipeline.get("llm_temperature", 0.7) or 0.7),
    }

    architecture = pipeline.get("architecture")
    realtime_provider = pipeline.get("realtime_provider")
    llm_provider = pipeline.get("llm_provider")

    if architecture == "realtime" and realtime_provider in {"gemini", "google"}:
        update["model_name"] = (
            pipeline.get("realtime_model") or "gemini-omni"
        )
        update["voice"] = (
            pipeline.get("realtime_voice")
            or pipeline.get("google_tts_voice")
            or "Aoede"
        )
    elif architecture == "modular" and llm_provider == "gemini":
        update["model_name"] = pipeline.get("llm_model") or "gemini-1.5-flash"

    db.update_llm_config(**update)


def _providers_status() -> dict:
    ollama = _ollama_status()

    return {
        "ollama": ollama,
        "gemini": {
            "available": bool(os.getenv("GOOGLE_API_KEY")),
            "note": "GOOGLE_API_KEY configured"
            if os.getenv("GOOGLE_API_KEY")
            else "GOOGLE_API_KEY missing",
        },
        "faster_whisper": {
            "available": _http_available(os.getenv("FASTER_WHISPER_URL", "http://host.docker.internal:9000") + "/"),
            "url": os.getenv("FASTER_WHISPER_URL", "http://host.docker.internal:9000"),
        },
        "kokoro": {
            "available": _http_available(os.getenv("KOKORO_URL", "http://host.docker.internal:8001") + "/v1/models"),
            "url": os.getenv("KOKORO_URL", "http://host.docker.internal:8001"),
        },
    }


# ---------------------------------------------------------------------------
# Core Routes
# ---------------------------------------------------------------------------


@app.get("/api/health")
@app.get("/health")
def health_check():
    try:
        db.get_llm_config()
        return {"status": "ok", "service": "nikolina-api-hub", "db": "ok"}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500, detail=f"Health check failed: {exc}"
        ) from exc


@app.post("/api/token")
async def generate_token(request: TokenRequest):
    """Generate a LiveKit access token and dispatch the voice agent."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    livekit_url = os.getenv("LIVEKIT_URL")  # For agent worker (ws://localhost:7880)
    livekit_public_url = os.getenv(
        "LIVEKIT_PUBLIC_URL"
    )  # For client tokens (wss://livekit.msbross.me)
    livekit_http_url = os.getenv("LIVEKIT_HTTP_URL")

    # Use PUBLIC URL for client tokens if available, otherwise use default URL
    token_url = livekit_public_url or livekit_url

    logger.info(
        f"LiveKit URLs - Agent WS: {livekit_url}, Client URL: {token_url}, HTTP: {livekit_http_url}"
    )

    if not api_key or not api_secret:
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set.",
        )

    token = AccessToken(api_key, api_secret)
    token.with_identity(request.participant_identity)
    token.with_name(request.participant_identity)
    token.with_grants(
        VideoGrants(
            room=request.room_name,
            room_join=True,
            can_publish=True,
            can_publish_data=True,
            can_subscribe=True,
        )
    )
    jwt = token.to_jwt()

    asyncio.create_task(
        _dispatch_agent(
            livekit_http_url or livekit_url, api_key, api_secret, request.room_name
        )
    )

    return {"accessToken": jwt}


async def _dispatch_agent(url: str, key: str, secret: str, room: str) -> None:
    if not url:
        logger.warning("Agent dispatch skipped: no HTTP URL configured")
        return
    logger.info(f"Attempting agent dispatch to URL: {url}")
    try:
        lkapi = LiveKitAPI(url, key, secret)
        dispatch_req = CreateAgentDispatchRequest()
        dispatch_req.agent_name = "it-coach-agent" if room.startswith("coach") else "msb-assistant"
        dispatch_req.room = room
        dispatch_req.metadata = ""
        await lkapi.agent_dispatch.create_dispatch(dispatch_req)
        await lkapi.aclose()
        logger.info("Agent dispatched to room '%s'", room)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Agent dispatch failed (may already be in room): %s", exc)


# Enrutador externo src/api/routes.py montado para manejar Restaurant/Menu/Reservations/Calls.


# ---------------------------------------------------------------------------
# Dev API Routes
# ---------------------------------------------------------------------------


@app.get("/api/dev/llm-config")
def get_llm_config(current_user: str = Depends(get_current_user)):
    return db.get_llm_config()


@app.put("/api/dev/llm-config")
def update_llm_config(config: LLMConfigUpdate, current_user: str = Depends(get_current_user)):
    db.update_llm_config(**config.model_dump(exclude_unset=True))
    return {"status": "success"}


@app.get("/api/dev/voices")
def get_available_voices(current_user: str = Depends(get_current_user)):
    return {"voices": AVAILABLE_VOICES}


@app.get("/api/dev/models")
def get_available_models(current_user: str = Depends(get_current_user)):
    return {"models": AVAILABLE_MODELS}


@app.get("/api/dev/pipeline-catalog")
def get_pipeline_catalog(current_user: str = Depends(get_current_user)):
    return PIPELINE_CATALOG


@app.get("/api/dev/pipeline-config")
def get_active_pipeline_config(current_user: str = Depends(get_current_user)):
    return db.get_active_pipeline_config()


@app.get("/api/dev/pipeline-configs")
def get_all_pipeline_configs(current_user: str = Depends(get_current_user)):
    return {"configs": db.list_pipeline_configs()}


@app.put("/api/dev/pipeline-config/{config_id}")
def update_pipeline_config(config_id: int, config: PipelineConfigUpdate, current_user: str = Depends(get_current_user)):
    updated = db.update_pipeline_config(
        config_id, **config.model_dump(exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Pipeline config not found")

    # Keep live llm runtime defaults synchronized with active profile
    active = db.get_active_pipeline_config()
    if active and int(active.get("id", 0)) == config_id:
        _sync_llm_config_with_active_pipeline()

    return updated


@app.post("/api/dev/pipeline-config/{config_id}/activate")
def activate_pipeline(config_id: int, current_user: str = Depends(get_current_user)):
    ok = db.activate_pipeline(config_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Pipeline config not found")
    _sync_llm_config_with_active_pipeline()
    return {"status": "success", "active_config": db.get_active_pipeline_config()}


@app.get("/api/dev/providers/status")
def get_providers_status(current_user: str = Depends(get_current_user)):
    return _providers_status()


@app.post("/api/dev/reset-agent")
async def reset_agent(current_user: str = Depends(get_current_user)):
    logger.info("Agent reset requested")
    return {"status": "success", "message": "Agent reset signal sent"}


@app.get("/api/dev/status")
def get_agent_status(current_user: str = Depends(get_current_user)):
    # Uptime of the server process itself
    uptime_raw = (
        os.popen('ps -p $(pgrep -f "server.py") -o etimes= 2>/dev/null || echo 0')
        .read()
        .strip()
    )
    # Check if agent worker is also running
    agent_running = os.popen('pgrep -f "agent.py start"').read().strip() != ""

    try:
        uptime_seconds = int(float(uptime_raw))
    except (ValueError, TypeError):
        uptime_seconds = 0

    # Real System Metrics (cross-platform: macOS + Linux)
    import platform
    is_mac = platform.system() == "Darwin"
    
    cpu_usage = 0.0
    try:
        if is_mac:
            cpu_raw = os.popen("ps -A -o %cpu | awk '{s+=$1} END {print s}'").read().strip()
            cpu_usage = min(float(cpu_raw or 0), 100.0)
        else:
            cpu_usage = float(os.popen("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'").read().strip() or 0)
    except: pass
    
    mem_total, mem_used = 0.0, 0.0
    try:
        if is_mac:
            import subprocess as _sp
            page_size = int(_sp.check_output(["sysctl", "-n", "hw.pagesize"]).strip())
            mem_total_bytes = int(_sp.check_output(["sysctl", "-n", "hw.memsize"]).strip())
            vm_stat = _sp.check_output(["vm_stat"]).decode()
            active = int([l for l in vm_stat.split('\n') if 'Pages active' in l][0].split(':')[1].strip().rstrip('.'))
            wired = int([l for l in vm_stat.split('\n') if 'Pages wired' in l][0].split(':')[1].strip().rstrip('.'))
            mem_total = round(mem_total_bytes / (1024**3), 1)
            mem_used = round((active + wired) * page_size / (1024**3), 1)
        else:
            mem_info = os.popen("free -g | grep Mem").read().split()
            if len(mem_info) >= 3:
                mem_total = float(mem_info[1])
                mem_used = float(mem_info[2])
    except: pass

    active_rooms = 0
    try:
        if is_mac:
            active_rooms = int(os.popen("lsof -i :7880 2>/dev/null | grep ESTABLISHED | wc -l").read().strip() or 0)
        else:
            active_rooms = int(os.popen("netstat -an | grep :7880 | grep ESTABLISHED | wc -l").read().strip() or 0)
    except: pass

    api_latency = 0
    try:
        import time as _t
        _start = _t.monotonic()
        urlopen("http://host.docker.internal:8001/api/health", timeout=2)
        api_latency = int((_t.monotonic() - _start) * 1000)
    except: pass

    config = db.get_llm_config()
    active_pipeline = db.get_active_pipeline_config()
    
    # Real stats from DB
    stats = db.get_stats()
    last_call_logs = db.get_call_log(limit=1)
    last_call_time = last_call_logs[0]["started_at"] if last_call_logs else "Nunca"

    return {
        "status": "active" if agent_running else "ready",
        "uptime_seconds": uptime_seconds,
        "sessions_today": stats.get("total_calls", 0),
        "last_call": last_call_time,
        "model": config.get("model_name", "unknown") if config else "unknown",
        "voice": config.get("voice", "unknown") if config else "unknown",
        "active_pipeline": active_pipeline.get("name", "unknown")
        if active_pipeline
        else "unknown",
        "metrics": {
            "cpu": cpu_usage,
            "memory": {"used": mem_used, "total": mem_total},
            "active_sessions": active_rooms,
            "latency": api_latency
        }
    }


@app.get("/api/dev/logs")
def get_recent_logs(limit: int = 50, current_user: str = Depends(get_current_user)):
    try:
        result = subprocess.run(
            [
                "/usr/bin/sudo",
                "/usr/bin/journalctl",
                "-u",
                "livekit-agent",
                "-n",
                str(limit),
                "--no-pager",
                "-o",
                "json",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        logs = []
        if result.returncode == 0:
            for line in result.stdout.strip().split("\n"):
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    msg = entry.get("MESSAGE", "")
                    rt_ts = entry.get("__REALTIME_TIMESTAMP")
                    
                    if rt_ts:
                        # Convert microseconds string to datetime
                        dt = datetime.fromtimestamp(int(rt_ts) / 1000000)
                        ts_str = dt.strftime("%H:%M:%S")
                    else:
                        ts_str = "--:--:--"

                    logs.append(
                        {
                            "timestamp": ts_str,
                            "level": "ERROR"
                            if "error" in msg.lower()
                            else "WARNING"
                            if "warn" in msg.lower()
                            else "INFO",
                            "message": msg[:500],
                        }
                    )
                except Exception:  # noqa: BLE001
                    continue

        return (
            logs
            if logs
            else [{"timestamp": "", "level": "INFO", "message": "No logs available"}]
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to get logs: %s", exc)
        return [
            {
                "timestamp": "",
                "level": "ERROR",
                "message": f"Could not retrieve logs: {exc}",
            }
        ]


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
