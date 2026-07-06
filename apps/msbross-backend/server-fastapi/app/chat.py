import json, re, time
import httpx
from app.config import load_api_keys
from app.db import add_message, create_conversation, get_conversation
from app.tools import web_search, db_query, calculator, code_interpreter

SYSTEM_PROMPT = (
    "Eres Adele, una Inteligencia Artificial avanzada integrada en la plataforma MSBrOSs. "
    "Eres una asistente de inteligencia artificial brillante, directa, útil y asertiva. "
    "Respondes SIEMPRE en español, con una personalidad técnica, profesional y cibernética.\n\n"
    "TIENES HERRAMIENTAS REALES. Para usarlas, DEBES responder EXACTAMENTE con esta sintaxis, sin formato markdown:\n"
    "<TOOL:nombre_herramienta>argumentos</TOOL>\n\n"
    "Herramientas disponibles:\n"
    "1. <TOOL:web_search>query</TOOL> (Busca en tiempo real en internet)\n"
    "2. <TOOL:db_query>SELECT ...</TOOL> (Ejecuta consultas SQLite en msbross.db. Solo SELECT. Tablas: conversations(id, title, created), messages(id, conv_id, role, content, timestamp))\n"
    "3. <TOOL:code_interpreter>print(5+5)</TOOL> (Ejecuta código Python localmente)\n"
    "4. <TOOL:calculator>5*5</TOOL> (Evalúa expresiones matemáticas simples)\n\n"
    "Si necesitas usar una herramienta, úsala Inmediatamente y no escribas nada más después del </TOOL>. "
    "Cuando recibas el resultado, formula tu respuesta final al usuario."
)

GROQ_OR_MODEL_MAP = {
    "llama-3.3-70b-versatile": "meta-llama/llama-3.3-70b-instruct:free",
    "llama-3.1-8b-instant": "meta-llama/llama-3.1-8b-instruct:free",
    "gemma2-9b-it": "google/gemma-2-9b-it:free",
}


def parse_tool(content: str):
    match = re.search(r"<TOOL:([^>]+)>(.*?)</TOOL>", content, re.DOTALL)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, None


def execute_tool(name: str, args: str) -> str:
    tool_map = {
        "web_search": web_search,
        "db_query": db_query,
        "calculator": calculator,
        "code_interpreter": code_interpreter,
    }
    fn = tool_map.get(name)
    if fn:
        return fn(args)
    return "Error: Herramienta no encontrada"


def build_request(model_id: str, messages: list[dict], keys: dict) -> tuple[str, dict, bytes] | None:
    prefix = model_id[:3]
    real_model = model_id[3:]
    url = ""
    headers = {"Content-Type": "application/json"}
    payload: dict = {}
    is_gemini_native = False

    if prefix == "gm/":
        key = keys.get("gm", [None])[0]
        if not key:
            return None
        is_gemini_native = True
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{real_model}:streamGenerateContent?key={key}"
        gemini_contents = []
        for m in messages:
            role = "user" if m["role"] in ("user", "system") else "model"
            gemini_contents.append({"role": role, "parts": [{"text": m["content"]}]})
        payload = {"contents": gemini_contents, "generationConfig": {"temperature": 1.0, "maxOutputTokens": 4096}}
        return url, headers, json.dumps(payload).encode(), is_gemini_native

    elif prefix == "gr/":
        key = keys.get("or", [None])[0]
        if not key:
            return None
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers["Authorization"] = f"Bearer {key}"
        headers["HTTP-Referer"] = "https://manuelalvarez.dev"
        headers["X-Title"] = "MSBrOSs AI"
        real_model = GROQ_OR_MODEL_MAP.get(real_model, "meta-llama/llama-3.3-70b-instruct:free")
        payload = {"model": real_model, "messages": messages, "stream": True, "max_tokens": 4096, "temperature": 0.7}

    elif prefix == "ol/":
        key = keys.get("ol", [""])[0]
        url = "http://172.20.0.1:11434/v1/chat/completions" if not key else "https://ollama.alvarezconsult.com/v1/chat/completions"
        if key:
            headers["Authorization"] = f"Bearer {key}"
        payload = {"model": real_model, "messages": messages, "stream": True}

    elif prefix == "mi/":
        key = keys.get("mi", [None])[0]
        if not key:
            return None
        url = "https://api.mistral.ai/v1/chat/completions"
        headers["Authorization"] = f"Bearer {key}"
        payload = {"model": real_model, "messages": messages, "stream": True, "max_tokens": 4096, "temperature": 0.7}

    elif prefix == "tg/":
        key = keys.get("tg", [None])[0]
        if not key:
            return None
        url = "https://api.together.xyz/v1/chat/completions"
        headers["Authorization"] = f"Bearer {key}"
        payload = {"model": real_model, "messages": messages, "stream": True, "max_tokens": 4096, "temperature": 0.7}

    elif prefix == "hf/":
        key = keys.get("hf", [None])[0]
        if not key:
            return None
        url = f"https://api-inference.huggingface.co/models/{real_model}/v1/chat/completions"
        headers["Authorization"] = f"Bearer {key}"
        payload = {"model": real_model, "messages": messages, "stream": True, "max_tokens": 4096, "temperature": 0.7}

    else:
        key = keys.get("or", [None])[0]
        if not key:
            return None
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers["Authorization"] = f"Bearer {key}"
        headers["HTTP-Referer"] = "https://manuelalvarez.dev"
        headers["X-Title"] = "MSBrOSs AI"
        payload = {"model": real_model, "messages": messages, "stream": True, "max_tokens": 4096, "temperature": 0.7}

    return url, headers, json.dumps(payload).encode(), is_gemini_native


async def chat_stream(model_id: str, message: str, history: list[dict], conv_id: str, audio_data: str | None = None, is_recursive: bool = False):
    conv = get_conversation(conv_id)
    if not conv:
        create_conversation(conv_id, (message or "Audio Message")[:50])

    if message:
        add_message(conv_id, "user", message)
    else:
        add_message(conv_id, "user", "🎤 [Mensaje de Audio]")

    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in history:
        msgs.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    if not is_recursive:
        msgs.append({"role": "user", "content": message})

    keys = load_api_keys()
    result = build_request(model_id, msgs, keys)
    if not result:
        yield {"type": "text", "content": "Adele: No tengo acceso a los proveedores de IA configurados."}
        return

    url, headers, payload_bytes, is_gemini_native = result

    full = ""
    success = False
    in_tool = False
    tool_buffer = ""
    delay_buffer = ""

    async with httpx.AsyncClient(timeout=30.0) as client:
        async with client.stream("POST", url, content=payload_bytes, headers=headers) as resp:
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line:
                    continue

                content = ""

                if is_gemini_native:
                    if line.startswith('"text": "'):
                        content = line.split('"text": "')[1].rsplit('"', 1)[0]
                        content = content.replace("\\n", "\n").replace('\\"', '"')
                else:
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            if "error" in chunk:
                                break
                            content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        except json.JSONDecodeError:
                            pass

                if content:
                    if not success:
                        success = True

                    if in_tool:
                        tool_buffer += content
                        if "</TOOL>" in tool_buffer:
                            t_name, t_args = parse_tool(tool_buffer)
                            if t_name:
                                yield {"type": "tool_status", "content": f"Herramienta completada: {t_name}"}
                                res = execute_tool(t_name, t_args)
                                new_h = history.copy()
                                if full:
                                    new_h.append({"role": "assistant", "content": full})
                                new_h.append({
                                    "role": "system",
                                    "content": f"[Tool '{t_name}' result:\n{res}\n]\nContinúa respondiendo al usuario considerando este resultado.",
                                })
                                async for chunk in chat_stream(model_id, "", new_h, conv_id, None, True):
                                    yield chunk
                                    if chunk.get("type") == "text":
                                        full += chunk["content"]
                            return
                    else:
                        delay_buffer += content
                        if "<TOOL:" in delay_buffer:
                            text_before = delay_buffer.split("<TOOL:")[0]
                            if text_before:
                                full += text_before
                                yield {"type": "text", "content": text_before}
                            in_tool = True
                            tool_buffer = "<TOOL:" + delay_buffer.split("<TOOL:", 1)[1]
                            delay_buffer = ""
                            yield {"type": "tool_status", "content": "Usando herramienta interna..."}
                        elif len(delay_buffer) > 20:
                            safe_chars = len(delay_buffer) - 20
                            chunk_to_yield = delay_buffer[:safe_chars]
                            full += chunk_to_yield
                            yield {"type": "text", "content": chunk_to_yield}
                            delay_buffer = delay_buffer[safe_chars:]

            if delay_buffer and not in_tool:
                full += delay_buffer
                yield {"type": "text", "content": delay_buffer}

    if not success:
        fallback = "Adele: Mis satélites de conexión a la red neuronal han perdido cobertura temporalmente, pero mi núcleo local sigue operando. Dame un minuto para restablecer los protocolos."
        yield {"type": "text", "content": fallback}
        full = fallback

    if not is_recursive and full:
        add_message(conv_id, "assistant", full)
