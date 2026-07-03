import uuid
import aiofiles
import logging
from fastapi import APIRouter, File, UploadFile, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.application.use_cases.chat_use_case import ChatUseCase
from app.infrastructure.llm.groq_adapter import GroqAdapter
from app.infrastructure.audio.tts_stt_adapter import GroqEdgeAudioAdapter
from app.application.use_cases.memory_service import clear_history
from app.domain.entities import AIResponse
from app.infrastructure.tools.toolbox import analyze_vision_image
from app.infrastructure.llm.gemini_adapter import GeminiAdapter
from app.infrastructure.llm.fallback_adapter import FallbackLLMAdapter

logger = logging.getLogger(__name__)
router = APIRouter()

def get_chat_usecase() -> ChatUseCase:
    fallback_llm = FallbackLLMAdapter(adapters=[GeminiAdapter(), GroqAdapter()])
    return ChatUseCase(llm_adapter=fallback_llm, audio_adapter=GroqEdgeAudioAdapter())

def get_audio_adapter() -> GroqEdgeAudioAdapter:
    return GroqEdgeAudioAdapter()

def _verify_api_key(request: Request):
    expected = settings.IAPUTA_API_KEY
    if not expected: return
    incoming = request.headers.get("x-api-key") or request.headers.get("X-API-KEY")
    if incoming != expected: raise HTTPException(status_code=401, detail="Invalid API key")

class TextCommandRequest(BaseModel): text: str
class VisionAnalyzeRequest(BaseModel): image: str; source: str = "screenshot"; prompt: str = None

@router.post("/api/voice-command", response_model=AIResponse)
async def voice_command(request: Request, audio_file: UploadFile = File(...), chat: ChatUseCase = Depends(get_chat_usecase)):
    _verify_api_key(request)
    try:
        content = await audio_file.read()
        if not content: return JSONResponse(status_code=400, content={"error": "Empty audio"})
        ext = "mp4" if audio_file.content_type and "mp4" in audio_file.content_type else "webm"
        temp_in = f"temp_audio/in_{uuid.uuid4().hex[:6]}.{ext}"
        async with aiofiles.open(temp_in, "wb") as f: await f.write(content)
        return (await chat.execute_voice(temp_in)).model_dump()
    except HTTPException: raise
    except Exception as e:
        logger.exception("Voice error")
        return JSONResponse(status_code=500, content={"transcript": "Error", "error": str(e), "emotion": "error"})

@router.post("/api/text-command", response_model=AIResponse)
async def text_command(request: Request, body: TextCommandRequest, chat: ChatUseCase = Depends(get_chat_usecase)):
    _verify_api_key(request)
    try: return (await chat.execute_text(body.text)).model_dump()
    except HTTPException: raise
    except Exception as e:
        logger.exception("Text error")
        return JSONResponse(status_code=500, content={"transcript": "Error", "error": str(e), "emotion": "error"})

@router.post("/api/vision-analyze")
async def vision_analyze(request: Request, body: VisionAnalyzeRequest, audio: GroqEdgeAudioAdapter = Depends(get_audio_adapter)):
    _verify_api_key(request)
    try:
        analysis, vision_url = await analyze_vision_image(body.image, body.prompt, body.source)
        audio_url = None
        try: audio_url = await audio.generate_speech(analysis)
        except: pass
        return {"response": analysis, "vision_url": vision_url, "audio_url": audio_url, "emotion": "thinking"}
    except HTTPException: raise
    except Exception as e:
        logger.exception("Vision error")
        return JSONResponse(status_code=500, content={"response": f"Error: {e}", "emotion": "error"})

@router.post("/api/clear-memory")
async def clear_memory(request: Request):
    _verify_api_key(request)
    clear_history()
    return {"status": "success", "message": "Memory cleared"}

@router.get("/api/status")
async def status(): return {"status": "online"}
