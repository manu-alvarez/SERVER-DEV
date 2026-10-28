from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import base64
import os
import tempfile
import httpx

from app.core.config import settings
from app.core.groq_client import groq_client
from app.application.chat_use_case import ChatUseCase
from app.application.memory_service import memory_service
from app.application.tool_dispatcher import tool_dispatcher
from app.infrastructure.llm.groq_adapter import GroqAdapter
from app.infrastructure.llm.gemini_adapter import GeminiAdapter
from app.infrastructure.llm.fallback_adapter import FallbackLLMAdapter
from app.infrastructure.audio.tts_stt_adapter import GroqEdgeAudioAdapter
from app.infrastructure.sandbox.docker_sandbox import run_python_in_sandbox
from app.auth.jwt import require_user, get_current_user, create_access_token
from app.middleware.rate_limit import limiter

router = APIRouter()

# Instanciar adaptadores (singleton simple)
groq_adapter = GroqAdapter()
gemini_adapter = GeminiAdapter()
fallback_adapter = FallbackLLMAdapter([groq_adapter, gemini_adapter])
audio_adapter = GroqEdgeAudioAdapter()
chat_usecase = ChatUseCase(fallback_adapter, audio_adapter)
tool_dispatcher.chat_usecase = chat_usecase  # inyección si fuera necesario

class TextCommand(BaseModel):
    text: str

class VaultUpdate(BaseModel):
    key: str
    value: str

@router.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    return {"status": "ok", "service": "iaprod-os-backend"}

@router.post("/api/register")
@limiter.limit("10/minute")
def register(request: Request, email: str = Form(...), password: str = Form(...)):
    # Registro local simple (sin DB externa por ahora; se conectará a PostgreSQL en siguiente fase)
    token = create_access_token({"sub": email, "role": "user"})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/api/login")
@limiter.limit("20/minute")
def login(request: Request, email: str = Form(...), password: str = Form(...)):
    # Login local simple
    token = create_access_token({"sub": email, "role": "user"})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/api/text-command")
@limiter.limit("30/minute")
async def text_command(request: Request, payload: TextCommand, current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    if len(payload.text) > 2000:
        raise HTTPException(status_code=400, detail="Texto demasiado largo")
    response = await chat_usecase.execute_text(payload.text)
    return response

@router.post("/api/voice-command")
@limiter.limit("20/minute")
async def voice_command(request: Request, file: UploadFile = File(...), current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    tmp.write(await file.read())
    tmp.close()
    try:
        response = await chat_usecase.execute_voice(tmp.name)
        return response
    finally:
        os.unlink(tmp.name)

@router.post("/api/vision-analyze")
@limiter.limit("20/minute")
async def vision_analyze(request: Request, image: str = Form(...), source: str = Form("upload"), prompt: str = Form("Analiza esta imagen"), current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    try:
        image_bytes = base64.b64decode(image)
    except Exception:
        raise HTTPException(status_code=400, detail="Imagen base64 inválida")
    result = await tool_dispatcher.handle_tool_call({
        "name": "analyze_vision_image",
        "arguments": {"image_base64": image, "source": source, "prompt": prompt},
    })
    return result

@router.get("/api/models")
@limiter.limit("30/minute")
def models(request: Request):
    return {
        "cloud": ["groq-llama-3.3-70b", "gemini-3.5-flash", "openrouter-mix"],
        "local": ["ollama-models-disponibles"],
    }

@router.post("/api/clear-memory")
@limiter.limit("10/minute")
def clear_memory(request: Request, current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    memory_service.clear_history()
    return {"status": "cleared"}

@router.post("/api/vault-update")
@limiter.limit("10/minute")
async def vault_update(request: Request, payload: VaultUpdate, current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    """Endpoint llamado desde el frontend (triggerNeuralBridge) para actualizar el vault local."""
    # Almacenar en memoria local (se conectará a PostgreSQL/Redis en siguiente fase)
    from app.core.config import settings as s
    if not hasattr(s, "_vault"):
        s._vault = {}
    s._vault[payload.key] = payload.value
    return {"status": "updated", "key": payload.key}

@router.get("/api/status")
@limiter.limit("60/minute")
def status(request: Request):
    return {"status": "online", "user": bool(current_user) if (current_user := get_current_user(request)) else False}

@router.post("/api/execute-python")
@limiter.limit("10/minute")
async def execute_python(request: Request, code: str = Form(...), current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    stdout, stderr = run_python_in_sandbox(code)
    return {"stdout": stdout, "stderr": stderr}
