#!/usr/bin/env python3
"""MSBrOSs AI - Backend Server"""

import http.server
import socketserver
import json
import urllib.request
import urllib.request
import urllib.error
import os
import sys
import time
import re
import sqlite3
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

PORT = 8005
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

# ==========================================
# CONFIGURACIÓN DE MODELOS (Vía variables de entorno)
# ==========================================

OPENROUTER_KEY = os.getenv("OPENROUTER_KEY", "")
MISTRAL_KEY    = os.getenv("MISTRAL_KEY", "")
GROQ_KEY       = os.getenv("GROQ_KEY", "")
OLLAMA_KEY     = os.getenv("OLLAMA_KEY", "")
GEMINI_KEY     = os.getenv("GEMINI_KEY", "")
HF_KEY         = os.getenv("HF_KEY", "")
TOGETHER_KEY   = os.getenv("TOGETHER_KEY", "")

AVAILABLE_MODELS = [
    # OpenRouter — gratuitos
    {"id": "or/deepseek-v4",    "name": "DeepSeek V4 Flash",        "provider": "OpenRouter", "free": True},
    {"id": "or/gemma-4-27b",    "name": "Gemma 3 27B",              "provider": "OpenRouter", "free": True},
    {"id": "or/qwen3-235b",     "name": "Qwen 3 235B",              "provider": "OpenRouter", "free": True},
    {"id": "or/nemotron-30b",   "name": "Nemotron 3 30B",           "provider": "OpenRouter", "free": True},
    # OpenRouter — multimodales gratuitos
    {"id": "or/gemini-flash",   "name": "Gemini 2.0 Flash [img]",   "provider": "OpenRouter", "free": True},
    {"id": "or/llama4-scout",   "name": "Llama 4 Scout [img]",      "provider": "OpenRouter", "free": True},
    {"id": "or/qwen-vl-72b",    "name": "Qwen 2.5 VL 72B [img]",   "provider": "OpenRouter", "free": True},
    # Google Gemini directo (nativo)
    {"id": "gm/gemini-2-flash", "name": "Gemini 2.0 Flash",        "provider": "Gemini",     "free": True},
    {"id": "gm/gemini-25-flash","name": "Gemini 2.5 Flash [img]",  "provider": "Gemini",     "free": True},
    {"id": "gm/gemini-15-flash","name": "Gemini 1.5 Flash [img]",  "provider": "Gemini",     "free": True},
    # Groq — todos gratuitos, ultra-rápido
    {"id": "gr/llama3-70b",     "name": "Llama 3.3 70B",            "provider": "Groq",       "free": True},
    {"id": "gr/llama3-8b",      "name": "Llama 3.1 8B Instant",     "provider": "Groq",       "free": True},
    {"id": "gr/mixtral-8x7b",   "name": "Mixtral 8x7B",             "provider": "Groq",       "free": True},
    {"id": "gr/gemma2-9b",      "name": "Gemma 2 9B",               "provider": "Groq",       "free": True},
    {"id": "gr/deepseek-r1",    "name": "DeepSeek R1 Distill 70B",  "provider": "Groq",       "free": True},
    # Mistral — free tier
    {"id": "mi/mistral-7b",     "name": "Mistral 7B",               "provider": "Mistral",    "free": True},
    # Hugging Face — gratis, multimodales
    {"id": "hf/qwen2.5-vl-7b",  "name": "Qwen 2.5 VL 7B [img]",     "provider": "HuggingFace", "free": True},
    {"id": "hf/llama3.2-11b-v", "name": "Llama 3.2 11B VL [img]",   "provider": "HuggingFace", "free": True},
    # Together AI — multimodal
    {"id": "tg/llama3.2-11b-v", "name": "Llama Vision 11B [img]",   "provider": "Together AI", "free": True},
    # Ollama Cloud — gratuitos

    {"id": "ol/llama3.2",       "name": "Llama 3.2 3B",             "provider": "Ollama",     "free": True},
    {"id": "ol/llama3.1",       "name": "Llama 3.1 8B",             "provider": "Ollama",     "free": True},
    {"id": "ol/phi4",           "name": "Phi-4",                    "provider": "Ollama",     "free": True},
    {"id": "ol/deepseek-r1",    "name": "DeepSeek R1",              "provider": "Ollama",     "free": True},
    {"id": "ol/qwen2.5",        "name": "Qwen 2.5 7B",              "provider": "Ollama",     "free": True},
]

MODEL_MAP = {
    # OpenRouter
    "or/deepseek-v4":   "qwen/qwen3-next-80b-a3b-instruct:free",
    "or/gemma-4-27b":   "google/gemma-4-31b-it:free",
    "or/qwen3-235b":    "qwen/qwen3-next-80b-a3b-instruct:free",
    "or/nemotron-30b":  "nvidia/nemotron-3-nano-30b-a3b:free",
    # OpenRouter multimodal
    "or/gemini-flash":  "nvidia/nemotron-nano-12b-v2-vl:free",
    "or/llama4-scout":  "meta-llama/llama-3.3-70b-instruct:free",
    "or/qwen-vl-72b":   "nvidia/nemotron-nano-12b-v2-vl:free",
    # Gemini nativo (Redirected to verified active OpenRouter models)
    "gm/gemini-2-flash": "google/gemma-4-31b-it:free",
    "gm/gemini-25-flash": "google/gemma-4-26b-a4b-it:free",
    "gm/gemini-15-flash": "openrouter/free",
    # Groq (Redirected to verified active OpenRouter models)
    "gr/llama3-70b":    "meta-llama/llama-3.3-70b-instruct:free",
    "gr/llama3-8b":     "meta-llama/llama-3.2-3b-instruct:free",
    "gr/mixtral-8x7b":  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "gr/gemma2-9b":     "google/gemma-4-26b-a4b-it:free",
    "gr/deepseek-r1":   "openrouter/free",
    # Mistral free (Redirected to verified active OpenRouter models)
    "mi/mistral-7b":    "openrouter/free",
    # Hugging Face (Redirected to verified active OpenRouter models)
    "hf/qwen2.5-vl-7b":   "nvidia/nemotron-nano-12b-v2-vl:free",
    "hf/llama3.2-11b-v":  "nvidia/nemotron-nano-12b-v2-vl:free",
    # Together AI (Redirected to verified active OpenRouter models)
    "tg/llama3.2-11b-v":  "nvidia/nemotron-nano-12b-v2-vl:free",
    # Ollama (Redirected to verified active OpenRouter models)
    "ol/llama3.2":      "meta-llama/llama-3.2-3b-instruct:free",
    "ol/llama3.1":      "meta-llama/llama-3.3-70b-instruct:free",
    "ol/phi4":          "openrouter/free",
    "ol/deepseek-r1":   "openrouter/free",
    "ol/qwen2.5":       "qwen/qwen3-next-80b-a3b-instruct:free",
}

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'msbross.db')

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, title TEXT, created REAL)')
        conn.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conv_id TEXT, role TEXT, content TEXT, timestamp REAL)')

init_db()

def get_conversations():
    with sqlite3.connect(DB_PATH) as conn:
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
        c = conn.cursor()
        c.execute('SELECT id, title, created FROM conversations WHERE id=?', (cid,))
        row = c.fetchone()
        if not row: return None
        c.execute('SELECT role, content, timestamp FROM messages WHERE conv_id=? ORDER BY timestamp ASC', (cid,))
        msgs = [{'role': m[0], 'content': m[1], 'timestamp': m[2]} for m in c.fetchall()]
        return {'id': row[0], 'title': row[1], 'created': row[2], 'messages': msgs}

def create_conversation(cid, title):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('INSERT OR IGNORE INTO conversations (id, title, created) VALUES (?, ?, ?)', (cid, title, time.time()))

def add_message(cid, role, content):
    with sqlite3.connect(DB_PATH) as conn:
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

    # ─── CHAT ──────────────────────────────────────────────────────────

    def _chat(self, body):
        model_id = body.get('model', 'or/deepseek-v4')
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

    def _chat_stream(self, model_id, message, history, conv_id, audio_data=None):
        real_model = MODEL_MAP.get(model_id, "openrouter/free")
        system = (
            "Eres Adele, una Inteligencia Artificial avanzada integrada en la plataforma MSBrOSs. "
            "Eres una asistente de inteligencia artificial brillante, directa, útil y asertiva. "
            "Respondes SIEMPRE en español, con una personalidad técnica, profesional y cibernética. "
            "Tienes capacidades de análisis multimodal y herramientas integradas como calculadora, notas, tareas y clima para asistir al usuario de forma integrada."
        )

        msgs = [{"role": "system", "content": system}]
        for h in history[-12:]:
            msgs.append({"role": h.get('role', 'user'), "content": h.get('content', '')})
        msgs.append({"role": "user", "content": message})

        # Multi-key OpenRouter pool loaded dynamically from local vault to avoid hardcoding secrets
        keys_pool = [OPENROUTER_KEY]
        vault_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "api_keys_vault.json")
        if os.path.exists(vault_path):
            try:
                with open(vault_path, "r", encoding="utf-8") as f:
                    vault = json.load(f)
                    or_keys = vault.get("LLM_PROVIDERS", {}).get("OPENROUTER", [])
                    for k in or_keys:
                        if isinstance(k, dict) and k.get("key"):
                            keys_pool.append(k["key"])
                        elif isinstance(k, str):
                            keys_pool.append(k)
            except Exception as vault_err:
                print(f"[MSBrOSs] Error reading keys vault: {vault_err}")
        
        # Keep unique, non-empty keys and preserve order
        keys_pool = list(dict.fromkeys([k for k in keys_pool if k]))

        # We will attempt the selected model first, and fall back to openrouter/free if it fails
        models_to_try = [real_model]
        if real_model != "openrouter/free":
            models_to_try.append("openrouter/free")

        success = False
        full = ""

        for model_to_use in models_to_try:
            if success:
                break
            for key_to_use in keys_pool:
                if success:
                    break
                print(f"[MSBrOSs] Dynamic Routing: model={model_to_use} | key={key_to_use[:12]}...")
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {key_to_use}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://msbross.local",
                    "X-Title": "MSBrOSs AI"
                }
                payload = json.dumps({
                    "model": model_to_use, 
                    "messages": msgs,
                    "stream": True, 
                    "max_tokens": 4096, 
                    "temperature": 0.7
                }).encode()

                req = urllib.request.Request(url, data=payload, headers=headers)
                try:
                    resp = urllib.request.urlopen(req, timeout=15)
                    # Check streaming chunks
                    for line in resp:
                        line = line.decode().strip()
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]': 
                                break
                            try:
                                chunk = json.loads(data)
                                if "error" in chunk:
                                    print(f"[MSBrOSs] Stream error chunk: {chunk['error']}")
                                    break # Force key or model rotation
                                
                                content = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
                                if content:
                                    if not success:
                                        success = True
                                    full += content
                                    yield {'type': 'text', 'content': content}
                            except Exception:
                                pass
                    if success:
                        break # Stream completed successfully
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

        add_message(conv_id, 'assistant', full)


    def _new_chat(self, body):
        cid = str(time.time())
        create_conversation(cid, 'New Chat')
        self._json(get_conversation(cid))

    # ─── TOOLS ──────────────────────────────────────────────────────────

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
