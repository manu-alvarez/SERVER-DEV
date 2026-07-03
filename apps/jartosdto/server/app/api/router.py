import os
import json
import uuid
import aiofiles
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, File, UploadFile, Request, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from app.db.vector import vector_db

api_router = APIRouter()

@api_router.get("/models/")
async def get_models(req: Request):
    keys_str = req.headers.get("x-custom-api-keys", "{}")
    try:
        api_keys = json.loads(keys_str)
    except:
        api_keys = {}

    models = []
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # OpenRouter
        if api_keys.get("openrouter"):
            try:
                res = await client.get("https://openrouter.ai/api/v1/models")
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    # Sort openrouter models to show free first, or just return all
                    for m in data:
                        is_free = m.get("pricing", {}).get("prompt", "") == "0"
                        models.append({
                            "id": m["id"],
                            "provider": "openrouter",
                            "display_name": f"{'[Gratis] ' if is_free else ''}{m.get('name', m['id'])}",
                            "is_vision": "vision" in m["id"].lower(),
                            "is_thinking": False
                        })
            except Exception:
                pass

        # Groq
        if api_keys.get("groq"):
            try:
                res = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {api_keys['groq']}"})
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    # Filter: exclude non-chat models (whisper, distil-whisper, tts, etc.)
                    GROQ_CHAT_BLOCKLIST = ["whisper", "distil-whisper", "tts", "guard", "tool-use"]
                    for m in data:
                        m_id = m["id"]
                        if any(bl in m_id.lower() for bl in GROQ_CHAT_BLOCKLIST):
                            continue
                        models.append({
                            "id": f"groq:{m_id}",
                            "provider": "groq",
                            "display_name": f"Groq: {m_id}",
                            "is_vision": "vision" in m_id.lower(),
                            "is_thinking": "deepseek-r1" in m_id.lower()
                        })
            except Exception:
                pass
                
        # OpenAI
        if api_keys.get("openai"):
            try:
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {api_keys['openai']}"})
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    # Filter only gpt and o1/o3 models to avoid cluttering with DALL-E, TTS, etc.
                    for m in data:
                        if "gpt" in m["id"] or "o1" in m["id"] or "o3" in m["id"]:
                            models.append({
                                "id": f"openai:{m['id']}",
                                "provider": "openai",
                                "display_name": f"OpenAI: {m['id']}",
                                "is_vision": "vision" in m["id"],
                                "is_thinking": "o1" in m["id"] or "o3" in m["id"]
                            })
            except Exception:
                pass

        # Anthropic
        if api_keys.get("anthropic"):
            try:
                res = await client.get("https://api.anthropic.com/v1/models", headers={
                    "x-api-key": api_keys["anthropic"],
                    "anthropic-version": "2023-06-01"
                })
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    for m in data:
                        if m.get("type") == "model":
                            models.append({
                                "id": f"anthropic:{m['id']}",
                                "provider": "anthropic",
                                "display_name": f"Anthropic: {m.get('display_name') or m['id']}",
                                "is_vision": True,
                                "is_thinking": "opus" in m["id"].lower() or "sonnet" in m["id"].lower()
                            })
            except Exception:
                pass
                
        # Gemini (Google AI Studio)
        if api_keys.get("gemini"):
            try:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_keys['gemini']}")
                if res.status_code == 200:
                    data = res.json().get("models", [])
                    for m in data:
                        if "generateContent" in m.get("supportedGenerationMethods", []):
                            model_id = m["name"].replace("models/", "")
                            models.append({
                                "id": f"gemini:{model_id}",
                                "provider": "google",
                                "display_name": f"Gemini: {m.get('displayName', model_id)}",
                                "is_vision": True,
                                "is_thinking": "thinking" in model_id.lower() or "pro" in model_id.lower()
                            })
            except Exception:
                pass
                
        # OpenAI-compatible Custom Endpoints (Ollama, LlamaCPP, LMStudio, vLLM, Mistral, Minimax)
        custom_providers = [
            ("mistral", "https://api.mistral.ai", "Mistral"),
            ("minimax", "https://api.minimax.chat", "Minimax"),
            ("ollama", None, "Ollama"),
            ("llamacpp", None, "LlamaCPP"),
            ("lmstudio", None, "LMStudio"),
            ("vllm", None, "vLLM")
        ]
        
        for prov_key, default_base, display_prefix in custom_providers:
            val = api_keys.get(prov_key)
            if not val: continue
            
            # If default_base is None, we expect the user to have provided the base URL
            # If default_base exists, val is the API key. 
            # If user provided a URL for Mistral/Minimax (unlikely), we'll handle it.
            if default_base:
                base_url = default_base
                headers = {"Authorization": f"Bearer {val}"}
            else:
                base_url = val.rstrip('/')
                headers = {}
                
            try:
                res = await client.get(f"{base_url}/v1/models", headers=headers)
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    # Support Ollama's /api/tags format if it returned that
                    if not data and "models" in res.json():
                        data = res.json()["models"]
                        
                    for m in data:
                        m_id = m.get("id") or m.get("name")
                        if not m_id: continue
                        models.append({
                            "id": f"{prov_key}:{m_id}", # prefix ID to know where to route
                            "provider": prov_key,
                            "display_name": f"{display_prefix}: {m_id}",
                            "is_vision": "vision" in m_id.lower(),
                            "is_thinking": False
                        })
            except Exception:
                pass

    return models

@api_router.get("/agents/")
async def get_agents():
    # Return empty list or basic agents
    return [
      {
        "id": "orchestrator",
        "name": "Inteligencia Central",
        "description": "Cerebro supremo y orquestador del ecosistema.",
        "system_prompt": "Eres la Inteligencia Central Orquestadora (Godmode).",
        "tools": ["webSearch", "executeCode"],
        "is_public": True,
      }
    ]

@api_router.get("/conversations/")
async def get_conversations():
    # Return empty list, frontend will use local mock or just empty list
    return []



class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    conversation_id: Optional[str] = None
    web_search: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024

async def _stream_openai_compatible(model: str, messages: list, api_key: str, base_url: str = "https://api.openai.com/v1/chat/completions"):
    """Generic async generator for OpenAI compatible endpoints."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", base_url, headers=headers, json=payload) as response:
            if response.status_code != 200:
                err = await response.aread()
                yield f"data: {json.dumps({'type': 'error', 'content': f'API Error {response.status_code}: {err.decode()}'})}\n\n"
                return
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield f"data: {json.dumps({'type': 'text', 'content': content})}\n\n"
                    except json.JSONDecodeError:
                        pass

@api_router.post("/chat/completions")
async def chat_completions(req: Request, body: ChatRequest):
    """
    Handles RAG chat and connects to the user's selected model using their custom API keys.
    """
    # 1. Parse custom API keys from header
    keys_str = req.headers.get("x-custom-api-keys", "{}")
    try:
        api_keys = json.loads(keys_str)
    except:
        api_keys = {}
        
    user_query = body.messages[-1].content
    
    # 2. RAG Retrieval
    # Inject context from Vector DB if there are any documents
    context = await vector_db.retrieve_context(user_query, top_k=3)
    
    messages_payload = []
    
    # Add System Prompt with RAG Context
    system_prompt = "Eres JartosDTo, una IA experta y unificada del ecosistema MSBross."
    if context:
        system_prompt += f"\n\n[CONTEXTO RECUPERADO DE LA BASE DE DATOS VECTORIAL]:\n{context}\n\nUsa este contexto para responder a la pregunta si es relevante."
        
    messages_payload.append({"role": "system", "content": system_prompt})
    
    # Add history
    for m in body.messages:
        messages_payload.append({"role": m.role, "content": m.content})
        
    # Determine provider and API Key
    # All provider models now use "provider:model_id" prefix for unambiguous routing.
    raw_model_id = body.model
    prov = None
    model_id = raw_model_id
    api_key = None
    base_url = None

    # Extract provider prefix if present
    if ":" in raw_model_id:
        prov, model_id = raw_model_id.split(":", 1)

    if prov == "groq":
        base_url = "https://api.groq.com/openai/v1/chat/completions"
        api_key = api_keys.get("groq")
    elif prov == "openai":
        base_url = "https://api.openai.com/v1/chat/completions"
        api_key = api_keys.get("openai")
    elif prov == "gemini":
        # Google provides an OpenAI-compatible endpoint
        base_url = f"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        api_key = api_keys.get("gemini")
    elif prov == "anthropic":
        # Use Anthropic's OpenAI-compatible chat completions endpoint via their proxy
        # Anthropic doesn't have an OpenAI-compat endpoint natively.
        # Route via OpenRouter if key is available, else error.
        if api_keys.get("openrouter"):
            base_url = "https://openrouter.ai/api/v1/chat/completions"
            model_id = f"anthropic/{model_id}"  # OpenRouter expects this format
            api_key = api_keys.get("openrouter")
        else:
            base_url = None
            api_key = None
    elif prov == "mistral":
        base_url = "https://api.mistral.ai/v1/chat/completions"
        api_key = api_keys.get("mistral")
    elif prov == "minimax":
        base_url = "https://api.minimax.chat/v1/chat/completions"
        api_key = api_keys.get("minimax")
    elif prov in ["ollama", "llamacpp", "lmstudio", "vllm"]:
        custom_url = api_keys.get(prov, "").rstrip('/')
        base_url = f"{custom_url}/v1/chat/completions" if custom_url else None
        api_key = "sk-local"
    elif "/" in raw_model_id:
        # OpenRouter-style model IDs contain a slash (e.g. "nvidia/nemotron-nano-12b")
        base_url = "https://openrouter.ai/api/v1/chat/completions"
        model_id = raw_model_id
        api_key = api_keys.get("openrouter")
    else:
        # Fallback: try OpenRouter
        base_url = "https://openrouter.ai/api/v1/chat/completions"
        model_id = raw_model_id
        api_key = api_keys.get("openrouter")

    if not api_key:
        async def mock_error():
            yield f"data: {json.dumps({'type': 'error', 'content': f'No API Key provided for model {model_id}. Configure it in the settings modal.'})}\n\n"
        return StreamingResponse(mock_error(), media_type="text/event-stream")

    # 3. Stream Response
    async def event_generator():
        # Inform frontend about RAG phase
        if context:
            yield f"data: {json.dumps({'type': 'thinking', 'content': 'Consultando base de datos vectorial local (RAG)...'})}\n\n"
        
        async for chunk in _stream_openai_compatible(model_id, messages_payload, api_key, base_url):
            yield chunk

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@api_router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Uploads a PDF and indexes it in the Vector Database."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se soportan archivos PDF por ahora.")
        
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "temp_docs")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    
    try:
        async with aiofiles.open(temp_path, "wb") as f:
            content = await file.read()
            await f.write(content)
            
        result = await vector_db.ingest_pdf(temp_path)
        return {"status": "success", "message": result, "file": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
