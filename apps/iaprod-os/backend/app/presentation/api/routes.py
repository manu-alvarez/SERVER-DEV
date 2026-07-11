import uuid
import aiofiles
import logging
import os
from fastapi import APIRouter, File, UploadFile, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

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

TEMP_AUDIO_DIR = "temp_audio"
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

import json

def get_chat_usecase(request: Request) -> ChatUseCase:
    admin_token = request.headers.get("x-msbross-admin-token")
    custom_keys_str = request.headers.get("x-custom-api-keys") or "{}"
    
    try:
        custom_keys = json.loads(custom_keys_str)
    except:
        custom_keys = {}
        
    if admin_token == "msbross-master-key-2026":
        # God Mode bypasses fallback and uses the Admin proxy with Llama 3.3 70b
        # Llama 3.3 70b has tool support so it matches GroqAdapter needs
        llm = GroqAdapter(
            api_key=admin_token, 
            base_url="https://llm.manuelalvarez.dev/v1",
            model="groq:llama-3.3-70b-versatile"
        )
    elif custom_keys.get("groq"):
        llm = FallbackLLMAdapter(adapters=[
            GroqAdapter(api_key=custom_keys.get("groq")),
            GeminiAdapter(api_key=custom_keys.get("gemini") or None)
        ])
    else:
        llm = FallbackLLMAdapter(adapters=[GeminiAdapter(), GroqAdapter()])
        
    return ChatUseCase(llm_adapter=llm, audio_adapter=GroqEdgeAudioAdapter())

def get_audio_adapter() -> GroqEdgeAudioAdapter:
    return GroqEdgeAudioAdapter()

def _verify_api_key(request: Request):
    expected = settings.IAPROD_API_KEY
    if not expected: return
    incoming = request.headers.get("x-api-key") or request.headers.get("X-API-KEY")
    if incoming != expected: raise HTTPException(status_code=401, detail="Invalid API key")

class TextCommandRequest(BaseModel):
    text: str = Field(..., max_length=2000, description="The text command to execute")

class VisionAnalyzeRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string")
    source: str = Field("screenshot", max_length=50)
    prompt: str = Field(None, max_length=1000)

def _cleanup_temp_file(filepath: str):
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        logger.error(f"Failed to cleanup temp file {filepath}: {e}")

@router.post("/api/voice-command", response_model=AIResponse)
async def voice_command(
    request: Request, 
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...), 
    chat: ChatUseCase = Depends(get_chat_usecase)
):
    _verify_api_key(request)
    temp_in = ""
    try:
        content = await audio_file.read()
        if not content: return JSONResponse(status_code=400, content={"error": "Empty audio"})
        
        ext = "mp4" if audio_file.content_type and "mp4" in audio_file.content_type else "webm"
        temp_in = os.path.join(TEMP_AUDIO_DIR, f"in_{uuid.uuid4().hex[:8]}.{ext}")
        
        async with aiofiles.open(temp_in, "wb") as f: 
            await f.write(content)
        
        response = await chat.execute_voice(temp_in)
        return response.model_dump()
    except HTTPException: 
        raise
    except Exception as e:
        logger.exception("Voice execution error")
        return JSONResponse(status_code=500, content={"transcript": "Error", "error": str(e), "emotion": "error"})
    finally:
        if temp_in:
            background_tasks.add_task(_cleanup_temp_file, temp_in)

@router.post("/api/text-command", response_model=AIResponse)
async def text_command(request: Request, body: TextCommandRequest, chat: ChatUseCase = Depends(get_chat_usecase)):
    _verify_api_key(request)
    try: 
        response = await chat.execute_text(body.text)
        return response.model_dump()
    except HTTPException: 
        raise
    except Exception as e:
        logger.exception("Text execution error")
        return JSONResponse(status_code=500, content={"transcript": "Error", "error": str(e), "emotion": "error"})

@router.post("/api/vision-analyze")
async def vision_analyze(request: Request, body: VisionAnalyzeRequest, audio: GroqEdgeAudioAdapter = Depends(get_audio_adapter)):
    _verify_api_key(request)
    try:
        analysis, vision_url = await analyze_vision_image(body.image, body.prompt, body.source)
        audio_url = None
        try: 
            audio_url = await audio.generate_speech(analysis)
        except Exception as tts_err: 
            logger.warning(f"TTS generation failed during vision analysis: {tts_err}")
            
        return {"response": analysis, "vision_url": vision_url, "audio_url": audio_url, "emotion": "thinking"}
    except HTTPException: 
        raise
    except Exception as e:
        logger.exception("Vision analysis error")
        return JSONResponse(status_code=500, content={"response": f"Error: {e}", "emotion": "error"})

@router.post("/api/clear-memory")
async def clear_memory(request: Request):
    _verify_api_key(request)
    clear_history()
    return {"status": "success", "message": "Memory cleared"}

@router.get("/api/status")
async def status(): 
    return {"status": "online"}
