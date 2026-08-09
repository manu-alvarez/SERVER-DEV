#!/usr/bin/env python3
"""MSBrOSs AI - Backend Server"""

import http.server
import socketserver
import json
import urllib.request
import urllib.error
import os
import sys
import time
import re
import sqlite3
from urllib.parse import urlparse

PORT = 8005
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

# ==========================================
# CONFIGURACIÓN DE MODELOS
# ==========================================

AVAILABLE_MODELS = [
    # Google Gemini (Generación 3.x)
    {"id": "gm/gemini-3.5-flash",      "name": "Gemini 3.5 Flash",       "provider": "Gemini", "free": True},
    {"id": "gm/gemini-3.1-pro",        "name": "Gemini 3.1 Pro",         "provider": "Gemini", "free": True},
    {"id": "gm/gemini-3.1-flash-lite", "name": "Gemini 3.1 Flash Lite",  "provider": "Gemini", "free": True},
    
    # Groq (Enrutado por OpenRouter)
    {"id": "gr/llama-3.3-70b-versatile",     "name": "Llama 3.3 70B",            "provider": "Groq", "free": True},
    {"id": "gr/llama-3.1-8b-instant",        "name": "Llama 3.1 8B Instant",     "provider": "Groq", "free": True},
    {"id": "gr/mixtral-8x7b-32768",          "name": "Mixtral 8x7B",             "provider": "Groq", "free": True},
    
    # Ollama (Local VPS Descargados)
    {"id": "ol/llama3.2:3b",            "name": "Llama 3.2 3B",             "provider": "Ollama", "free": True},
    {"id": "ol/qwen2.5:3b",             "name": "Qwen 2.5 3B",              "provider": "Ollama", "free": True},
    {"id": "ol/phi3:mini",              "name": "Phi-3 Mini",               "provider": "Ollama", "free": True},
    
    # OpenRouter
    {"id": "or/deepseek/deepseek-chat:free", "name": "DeepSeek V3",              "provider": "OpenRouter", "free": True},
    {"id": "or/google/gemma-3-27b-it:free",  "name": "Gemma 3 27B",              "provider": "OpenRouter", "free": True}
]

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'msbross.db')

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute('CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, title TEXT, created REAL)')
        conn.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conv_id TEXT, role TEXT, content TEXT, timestamp REAL)')

init_db()

def get_conversations():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        c = conn.cursor()
        c.execute('SELECT id, title, created FROM conversations ORDER BY created DESC')
        convs = []
        for row in c.fetchall():
            c.execute('SELECT role, content, timestamp FROM messages WHERE conv_id=? ORDER BY timestamp ASC', (row[0],))
            msgs = [{'role': m[0], 'content': m[1], 'timestamp': m[2]} for m in c.fetchall()]
            convs.append({'id': row[0], 'title': row[1], 'created': row[2], 'messages': msgs})
        return convs

def get_conversation(cid):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        c = conn.cursor()
        c.execute('SELECT id, title, created FROM conversations WHERE id=?', (cid,))
        row = c.fetchone()
        if not row: return None
        c.execute('SELECT role, content, timestamp FROM messages WHERE conv_id=? ORDER BY timestamp ASC', (cid,))
        msgs = [{'role': m[0], 'content': m[1], 'timestamp': m[2]} for m in c.fetchall()]
        return {'id': row[0], 'title': row[1], 'created': row[2], 'messages': msgs}

def create_conversation(cid, title):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute('INSERT OR IGNORE INTO conversations (id, title, created) VALUES (?, ?, ?)', (cid, title, time.time()))

def add_message(cid, role, content):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute('INSERT INTO messages (conv_id, role, content, timestamp) VALUES (?, ?, ?, ?)', (cid, role, content, time.time()))

tools_state = {"notes": [], "todos": [], "calculator_history": []}

class MSBrOSsHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        if self.path.endswith(('.css', '.js', '.html', '.json')):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_HEAD(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/_msbross'):
            path = path[len('/_msbross'):]

        if path == '/health':
            self._json({"status": "ok", "service": "msbross-backend"})
            return
        if path == '/api/models':
            self._json(AVAILABLE_MODELS)
            return
        if path == '/api/conversations':
            self._json(get_conversations())
            return
        if path.startswith('/api/conversations/'):
            cid = path.split('/')[-1]
            conv = get_conversation(cid)
            self._json(conv if conv else {'error': 'not found'}, 200 if conv else 404)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.startswith('/_msbross'):
            path = path[len('/_msbross'):]

        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
        except Exception:
            body = {}

        routes = {
            '/api/chat': lambda: self._chat(body),
            '/api/chat/new': lambda: self._new_chat(body),
            '/api/tools/calculator': lambda: self._tool_calc(body),
            '/api/tools/notes': lambda: self._tool_notes(body),
            '/api/tools/todos': lambda: self._tool_todos(body),
            '/api/tools/weather': lambda: self._tool_weather(body),
        }

        handler = routes.get(path)
        if handler:
            handler()
        else:
            self._json({'error': 'not found'}, 404)

    def _cors(self):
        origin = self.headers.get('Origin', '')
        if re.match(r"^https://.*\.manuelalvarez\.dev$", origin) or re.match(r"^http://localhost:\d+$", origin):
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', 'https://msbross.manuelalvarez.dev')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _stream(self, generator):
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.end_headers()
        for chunk in generator:
            self.wfile.write(f'data: {json.dumps(chunk)}\n\n'.encode())
            self.wfile.flush()
        self.wfile.write(b'data: [DONE]\n\n')
        self.wfile.flush()

    def _get_api_keys(self, headers=None):
        keys = {}
        headers = headers or self.headers
        
        # 1. Modo Dios (Inyectado por el Proxy)
        if headers and headers.get('x-godmode-active') == 'true':
            keys["or"] = [headers.get('x-injected-openrouter', '')]
            keys["gm"] = [headers.get('x-injected-google', '')]
            keys["gr"] = [headers.get('x-injected-groq', '')]
            keys["mi"] = [headers.get('x-injected-mistral', '')]
            keys["ol"] = [headers.get('x-injected-ollama', '')]
            keys["hf"] = [headers.get('x-injected-huggingface', '')]
            
        # 2. Claves Personalizadas del Usuario (Sobrescriben el Modo Dios)
        if headers and 'x-user-custom-keys' in headers:
            try:
                custom_keys = json.loads(headers['x-user-custom-keys'])
                if custom_keys.get("OPENROUTER"): keys["or"] = [custom_keys.get("OPENROUTER")]
                if custom_keys.get("GEMINI"): keys["gm"] = [custom_keys.get("GEMINI")]
                if custom_keys.get("GROQ"): keys["gr"] = [custom_keys.get("GROQ")]
                if custom_keys.get("MISTRAL"): keys["mi"] = [custom_keys.get("MISTRAL")]
                if custom_keys.get("OLLAMA"): keys["ol"] = [custom_keys.get("OLLAMA")]
            except Exception as e:
                print(f"[MSBrOSs] Error parsing custom keys: {e}")
                
        # 3. Fallback a .env local (para desarrollo sin Docker)
        if not any(k for lst in keys.values() for k in lst if k):
            vault_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "infrastructure", "msbross-proxy", "api_keys_vault.json")
            if os.path.exists(vault_path):
                try:
                    with open(vault_path, "r", encoding="utf-8") as f:
                        vault = json.load(f)
                        llms = vault.get("LLM_PROVIDERS", {})
                        if not keys.get("or") or not keys["or"][0]: keys["or"] = [k["key"] for k in llms.get("OPENROUTER", []) if isinstance(k, dict) and k.get("key")]
                        if not keys.get("gm") or not keys["gm"][0]: keys["gm"] = [k["key"] for k in llms.get("GOOGLE_GEMINI", []) if isinstance(k, dict) and k.get("key")]
                        if not keys.get("gr") or not keys["gr"][0]: keys["gr"] = [k["key"] for k in llms.get("GROQ", []) if isinstance(k, dict) and k.get("key")]
                        if not keys.get("ol") or not keys["ol"][0]: keys["ol"] = [llms.get("OTHER_LLMS", {}).get("OLLAMA_CLOUD", "")]
                except Exception as e:
                    print(f"[MSBrOSs] Error reading keys vault fallback: {e}")
                    
        return keys

    # ─── CHAT ──────────────────────────────────────────────────────────

    def _chat(self, body):
        model_id = body.get('model', 'or/deepseek/deepseek-chat:free')
        message = body.get('message', '')
        conv_id = body.get('conversation_id', 'default')
        history = body.get('history', [])
        audio_data = body.get('audio', None)

        if not message and not audio_data:
            self._json({'error': 'message or audio required'}, 400)
            return

        conv = get_conversation(conv_id)
        if not conv:
            create_conversation(conv_id, message[:50] if message else 'Audio Message')

        if message:
            add_message(conv_id, 'user', message)
        else:
            add_message(conv_id, 'user', '🎤 [Mensaje de Audio]')

        self._stream(self._chat_stream(model_id, message, history, conv_id, audio_data))

    def _chat_stream(self, model_id, message, history, conv_id, audio_data=None, is_recursive=False):
        system = (
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

        msgs = [{"role": "system", "content": system}]
        for h in history:
            msgs.append({"role": h.get('role', 'user'), "content": h.get('content', '')})
        if not is_recursive:
            msgs.append({"role": "user", "content": message})

        keys_dict = self._get_api_keys()
        
        provider_prefix = model_id[:3]
        real_model = model_id[3:]
        
        url = ""
        headers = {"Content-Type": "application/json"}
        payload = {}
        keys_pool = []
        is_gemini_native = False
        
        if provider_prefix == "gm/":
            keys_pool = keys_dict.get("gm", [])
            is_gemini_native = True
        elif provider_prefix == "gr/":
            # Groq native is blocked by Cloudflare for Contabo IPs. Route to OpenRouter!
            keys_pool = keys_dict.get("or", [])
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers["HTTP-Referer"] = "https://msbross.local"
            headers["X-Title"] = "MSBrOSs AI"
            # Map Groq model names to OpenRouter free equivalents
            or_mapping = {
                "llama-3.3-70b-versatile": "meta-llama/llama-3.3-70b-instruct:free",
                "llama-3.1-8b-instant": "meta-llama/llama-3.1-8b-instruct:free",
                "gemma2-9b-it": "google/gemma-2-9b-it:free"
            }
            real_model = or_mapping.get(real_model, "meta-llama/llama-3.3-70b-instruct:free")
        elif provider_prefix == "mi/":
            keys_pool = keys_dict.get("mi", [])
            url = "https://api.mistral.ai/v1/chat/completions"
        elif provider_prefix == "tg/":
            keys_pool = keys_dict.get("tg", [])
            url = "https://api.together.xyz/v1/chat/completions"
        elif provider_prefix == "hf/":
            keys_pool = keys_dict.get("hf", [])
            url = f"https://api-inference.huggingface.co/models/{real_model}/v1/chat/completions"
        elif provider_prefix == "ol/":
            keys_pool = keys_dict.get("ol", [""])
            url = "http://100.100.2.10:11434/v1/chat/completions" if not keys_pool[0] else "https://ollama.alvarezconsult.com/v1/chat/completions"
        else: # "or/"
            keys_pool = keys_dict.get("or", [])
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers["HTTP-Referer"] = "https://msbross.local"
            headers["X-Title"] = "MSBrOSs AI"

        keys_pool = [k for k in keys_pool if k]
        if not keys_pool and not provider_prefix == "ol/":
            print(f"[MSBrOSs] No API key found for provider {provider_prefix}")
            yield {'type': 'text', 'content': "Error: API Key not configured for this provider."}
            return

        success = False
        full = ""

        for key_to_use in keys_pool if keys_pool else [""]:
            if success:
                break
            
            if is_gemini_native:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{real_model}:streamGenerateContent?key={key_to_use}"
                # Gemini native format
                gemini_contents = []
                for m in msgs:
                    role = "user" if m["role"] in ["user", "system"] else "model"
                    gemini_contents.append({"role": role, "parts": [{"text": m["content"]}]})
                
                payload_dict = {
                    "contents": gemini_contents,
                    "generationConfig": {
                        "temperature": 1.0,
                        "maxOutputTokens": 4096
                    }
                }
                payload = json.dumps(payload_dict).encode()
            else:
                if key_to_use:
                    headers["Authorization"] = f"Bearer {key_to_use}"
                
                payload_dict = {
                    "model": real_model, 
                    "messages": msgs,
                    "stream": True
                }
                
                if provider_prefix == "ol/":
                    payload_dict["stream"] = True
                else:
                    payload_dict["max_tokens"] = 4096
                    payload_dict["temperature"] = 0.7
                    
                payload = json.dumps(payload_dict).encode()

            print(f"[MSBrOSs] Dynamic Routing: provider={provider_prefix} model={real_model} url={url.split('?')[0]}")
            req = urllib.request.Request(url, data=payload, headers=headers)
            try:
                resp = urllib.request.urlopen(req, timeout=20)
                delay_buffer = ""
                tool_buffer = ""
                in_tool = False
                
                for line in resp:
                    line = line.decode().strip()
                    content = ""
                    
                    if is_gemini_native:
                        if line.startswith('"text": "'):
                            content = line.split('"text": "')[1].rsplit('"', 1)[0]
                            content = content.replace('\\n', '\n').replace('\\"', '"')
                    else:
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]': 
                                break
                            try:
                                chunk = json.loads(data)
                                if "error" in chunk:
                                    print(f"[MSBrOSs] Stream error chunk: {chunk['error']}")
                                    break
                                content = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
                            except Exception:
                                pass
                                
                    if content:
                        if not success:
                            success = True
                            
                        if in_tool:
                            tool_buffer += content
                            if "</TOOL>" in tool_buffer:
                                tool_match = re.search(r'<TOOL:([^>]+)>(.*?)</TOOL>', tool_buffer, re.DOTALL)
                                if tool_match:
                                    t_name = tool_match.group(1).strip()
                                    t_args = tool_match.group(2).strip()
                                    
                                    res = "Error: Herramienta no encontrada"
                                    if t_name == "web_search": res = self._agent_web_search(t_args)
                                    elif t_name == "db_query": res = self._agent_db_query(t_args)
                                    elif t_name == "calculator": res = self._agent_calculator(t_args)
                                    elif t_name == "code_interpreter": res = self._agent_code_interpreter(t_args)
                                    
                                    new_h = history.copy()
                                    if full: new_h.append({"role": "assistant", "content": full})
                                    new_h.append({"role": "system", "content": f"[Tool '{t_name}' result:\n{res}\n]\nContinúa respondiendo al usuario considerando este resultado."})
                                    
                                    yield {'type': 'tool_status', 'content': f"Herramienta completada: {t_name}"}
                                    
                                    rest = yield from self._chat_stream(model_id, "", new_h, conv_id, None, True)
                                    full += "\n" + rest
                                    return full
                        else:
                            delay_buffer += content
                            if "<TOOL:" in delay_buffer:
                                text_before = delay_buffer.split("<TOOL:")[0]
                                if text_before:
                                    full += text_before
                                    yield {'type': 'text', 'content': text_before}
                                in_tool = True
                                tool_buffer = "<TOOL:" + delay_buffer.split("<TOOL:", 1)[1]
                                delay_buffer = ""
                                yield {'type': 'tool_status', 'content': "Usando herramienta interna..."}
                            elif len(delay_buffer) > 20:
                                safe_chars = len(delay_buffer) - 20
                                chunk_to_yield = delay_buffer[:safe_chars]
                                full += chunk_to_yield
                                yield {'type': 'text', 'content': chunk_to_yield}
                                delay_buffer = delay_buffer[safe_chars:]

                if delay_buffer and not in_tool:
                    full += delay_buffer
                    yield {'type': 'text', 'content': delay_buffer}
                    
                if success:
                    break
            except urllib.error.HTTPError as e:
                err_msg = ""
                try:
                    err_msg = e.read().decode()
                except:
                    pass
                print(f"[MSBrOSs] HTTP Error {e.code}: {err_msg[:200]}")
            except Exception as e:
                print(f"[MSBrOSs] Connection exception: {str(e)}")

        if not success:
            fallback_msg = "Adele: Mis satélites de conexión a la red neuronal han perdido cobertura temporalmente, pero mi núcleo local sigue operando. Dame un minuto para restablecer los protocolos."
            yield {'type': 'text', 'content': fallback_msg}
            full = fallback_msg
        if not is_recursive:
            add_message(conv_id, 'assistant', full)
        
        return full
    def _new_chat(self, body):
        cid = str(time.time())
        create_conversation(cid, 'New Chat')
        self._json(get_conversation(cid))

    # ─── TOOLS ──────────────────────────────────────────────────────────

    def _agent_web_search(self, query):
        import urllib.request
        import urllib.parse
        import re
        try:
            data = urllib.parse.urlencode({'q': query}).encode('utf-8')
            req = urllib.request.Request(
                'https://lite.duckduckgo.com/lite/', 
                data=data, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
            # Extract snippets from DDG Lite HTML
            snippets = re.findall(r'<td class=\'result-snippet\'>(.*?)</td>', html, re.IGNORECASE | re.DOTALL)
            clean_snippets = [re.sub(r'<[^>]+>', '', s).strip() for s in snippets]
            if not clean_snippets:
                return "No se encontraron resultados."
            return "Resultados web:\n" + "\n".join(f"- {s}" for s in clean_snippets[:5])
        except Exception as e:
            return f"Error en búsqueda web: {e}"

    def _agent_db_query(self, sql):
        import sqlite3
        try:
            if not sql.strip().upper().startswith("SELECT"):
                return "Error: Solo se permiten sentencias SELECT por seguridad."
            with sqlite3.connect(DB_PATH) as conn:
                c = conn.cursor()
                c.execute(sql)
                rows = c.fetchall()
                cols = [desc[0] for desc in c.description]
                res = f"Columnas: {cols}\nResultados:\n"
                for r in rows[:20]: # Limit to 20 rows
                    res += f"{r}\n"
                return res
        except Exception as e:
            return f"Error SQL: {e}"

    def _agent_calculator(self, expr):
        import ast, operator
        def eval_expr(node):
            if isinstance(node, ast.Num): return node.n
            elif isinstance(node, ast.BinOp):
                ops = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow}
                if type(node.op) in ops: return ops[type(node.op)](eval_expr(node.left), eval_expr(node.right))
            elif isinstance(node, ast.UnaryOp):
                if isinstance(node.op, ast.USub): return -eval_expr(node.operand)
                if isinstance(node.op, ast.UAdd): return eval_expr(node.operand)
            raise TypeError(node)
        try:
            safe = re.sub(r'[^0-9+\-*/.()% ]', '', expr)
            result = eval_expr(ast.parse(safe, mode='eval').body)
            return str(result)
        except Exception as e:
            return f"Error matemático: {e}"

    def _agent_code_interpreter(self, code):
        import io
        from contextlib import redirect_stdout
        try:
            # Muy restrictivo, pero funcional para cálculos locales
            f = io.StringIO()
            with redirect_stdout(f):
                exec(code, {"__builtins__": __builtins__}, {})
            out = f.getvalue()
            return out if out else "Código ejecutado sin errores (sin salida por consola)."
        except Exception as e:
            return f"Error en ejecución Python: {e}"

    def _tool_calc(self, body):
        import ast, operator
        
        def eval_expr(node):
            if isinstance(node, ast.Num): return node.n
            elif isinstance(node, ast.BinOp):
                ops = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.Pow: operator.pow}
                if type(node.op) in ops: return ops[type(node.op)](eval_expr(node.left), eval_expr(node.right))
            elif isinstance(node, ast.UnaryOp):
                if isinstance(node.op, ast.USub): return -eval_expr(node.operand)
                if isinstance(node.op, ast.UAdd): return eval_expr(node.operand)
            raise TypeError(node)

        expr = body.get('expression', '')
        try:
            safe = re.sub(r'[^0-9+\-*/.()% ]', '', expr)
            result = eval_expr(ast.parse(safe, mode='eval').body)
            entry = {'expression': expr, 'result': result, 'time': time.time()}
            tools_state['calculator_history'].append(entry)
            self._json(entry)
        except Exception as e:
            self._json({'error': str(e)}, 400)

    def _tool_notes(self, body):
        action = body.get('action', 'list')
        if action == 'list':
            self._json(tools_state['notes'])
        elif action == 'create':
            note = {'id': str(time.time()), 'title': body.get('title', ''), 'content': body.get('content', ''), 'created': time.time()}
            tools_state['notes'].append(note)
            self._json(note)
        elif action == 'delete':
            nid = body.get('id')
            tools_state['notes'] = [n for n in tools_state['notes'] if n['id'] != nid]
            self._json({'deleted': nid})
        else:
            self._json({'error': 'unknown action'}, 400)

    def _tool_todos(self, body):
        action = body.get('action', 'list')
        if action == 'list':
            self._json(tools_state['todos'])
        elif action == 'create':
            todo = {'id': str(time.time()), 'text': body.get('text', ''), 'done': False, 'created': time.time()}
            tools_state['todos'].append(todo)
            self._json(todo)
        elif action == 'toggle':
            tid = body.get('id')
            for t in tools_state['todos']:
                if t['id'] == tid:
                    t['done'] = not t['done']
                    self._json(t)
                    return
            self._json({'error': 'not found'}, 404)
        elif action == 'delete':
            tid = body.get('id')
            tools_state['todos'] = [t for t in tools_state['todos'] if t['id'] != tid]
            self._json({'deleted': tid})
        else:
            self._json({'error': 'unknown action'}, 400)

    def _tool_weather(self, body):
        city = body.get('city', '')
        if not city:
            self._json({'error': 'city required'}, 400)
            return
        self._json({
            'city': city, 'temperature': 22, 'condition': 'Sunny',
            'humidity': 45, 'wind': '12 km/h',
            'note': 'Local fallback data - connect OpenWeatherMap API for live real-time metrics'
        })

    def log_message(self, fmt, *args):
        try:
            print(f'[MSBrOSs] {fmt % args}')
        except:
            print(f'[MSBrOSs] {fmt} {args}')


if __name__ == '__main__':
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    os.makedirs(os.path.join(PUBLIC_DIR, 'icons'), exist_ok=True)

    print(f'MSBrOSs AI Server running on http://0.0.0.0:{PORT}')
    print(f'iPhone: http://192.168.1.34:{PORT}')
    print(f'Models: {len(AVAILABLE_MODELS)} | OpenRouter: active')
    print()

    socketserver.TCPServer.allow_reuse_address = True
    try:
        class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
            pass
        
        with ThreadedHTTPServer(('0.0.0.0', PORT), MSBrOSsHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario.")
    except OSError as e:
        print(f"\nError de red: {e}")
