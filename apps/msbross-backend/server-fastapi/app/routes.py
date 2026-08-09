import time, json
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.db import get_conversations, get_conversation, create_conversation
from app.models import get_all_models
from app.chat import chat_stream
from app.tools import calculator
from app.websocket_manager import node_manager

router = APIRouter()

@router.websocket("/ws/nodes/{node_id}")
async def websocket_node_endpoint(websocket: WebSocket, node_id: str):
    token = websocket.headers.get("x-godmode-token")
    if token != "msbross-master-key-2026":
        await websocket.close(code=1008)
        return
        
    await node_manager.connect(websocket, node_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # We expect nodes to return {"task_id": "...", "status": "success/error", "result": "..."}
                parsed = json.loads(data)
                if "task_id" in parsed:
                    await node_manager.handle_node_response(parsed["task_id"], parsed)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        node_manager.disconnect(node_id)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "msbross-backend"}


@router.get("/api/nodes")
async def get_nodes():
    nodes = node_manager.get_connected_nodes()
    return {"nodes": nodes, "count": len(nodes)}


@router.get("/api/models")
async def get_models():
    return await get_all_models()


@router.get("/api/conversations")
async def list_conversations():
    return get_conversations()


@router.get("/api/conversations/{cid}")
async def get_conv(cid: str):
    conv = get_conversation(cid)
    if not conv:
        raise HTTPException(404, "not found")
    return conv


class NewChatPayload(BaseModel):
    pass


@router.post("/api/chat/new")
async def new_chat(body: NewChatPayload):
    cid = str(time.time())
    create_conversation(cid, "New Chat")
    return get_conversation(cid)


class ChatPayload(BaseModel):
    model: str = "or/deepseek/deepseek-chat:free"
    message: str = ""
    conversation_id: str = "default"
    history: list[dict] = []
    audio: str | None = None


@router.post("/api/chat")
async def chat(body: ChatPayload):
    if not body.message and not body.audio:
        raise HTTPException(400, "message or audio required")

    async def generate():
        async for event in chat_stream(body.model, body.message, body.history, body.conversation_id, body.audio):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


class CalculatorPayload(BaseModel):
    expression: str


tools_state = {"notes": [], "todos": [], "calculator_history": []}


@router.post("/api/tools/calculator")
async def tool_calc(body: CalculatorPayload):
    try:
        result = calculator(body.expression)
        entry = {"expression": body.expression, "result": result, "time": time.time()}
        tools_state["calculator_history"].append(entry)
        return entry
    except Exception as e:
        raise HTTPException(400, str(e))


class NotesPayload(BaseModel):
    action: str = "list"
    id: str | None = None
    title: str | None = None
    content: str | None = None


@router.post("/api/tools/notes")
async def tool_notes(body: NotesPayload):
    if body.action == "list":
        return tools_state["notes"]
    elif body.action == "create":
        note = {"id": str(time.time()), "title": body.title or "", "content": body.content or "", "created": time.time()}
        tools_state["notes"].append(note)
        return note
    elif body.action == "delete":
        tools_state["notes"] = [n for n in tools_state["notes"] if n["id"] != body.id]
        return {"deleted": body.id}
    raise HTTPException(400, "unknown action")


class TodosPayload(BaseModel):
    action: str = "list"
    id: str | None = None
    text: str | None = None


@router.post("/api/tools/todos")
async def tool_todos(body: TodosPayload):
    if body.action == "list":
        return tools_state["todos"]
    elif body.action == "create":
        todo = {"id": str(time.time()), "text": body.text or "", "done": False, "created": time.time()}
        tools_state["todos"].append(todo)
        return todo
    elif body.action == "toggle":
        for t in tools_state["todos"]:
            if t["id"] == body.id:
                t["done"] = not t["done"]
                return t
        raise HTTPException(404, "not found")
    elif body.action == "delete":
        tools_state["todos"] = [t for t in tools_state["todos"] if t["id"] != body.id]
        return {"deleted": body.id}
    raise HTTPException(400, "unknown action")


class WeatherPayload(BaseModel):
    city: str


@router.post("/api/tools/weather")
async def tool_weather(body: WeatherPayload):
    if not body.city:
        raise HTTPException(400, "city required")
    # No more hardcoded 22C sunny dummy data. We enforce real usage.
    return {
        "city": body.city,
        "error": "OpenWeatherMap API no configurada. Los datos locales mockeados han sido eliminados por seguridad y precisión."
    }
