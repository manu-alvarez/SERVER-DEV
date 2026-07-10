import logging
logger = logging.getLogger(__name__)
import os, json, hashlib, hmac, time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import database as db

JWT_SECRET = os.environ.get("IndustrialPro_JWT_SECRET", "industrialpro-secret-change-in-prod")

def make_token(user_id: int, name: str) -> str:
    payload = json.dumps({"uid": user_id, "name": name, "exp": time.time() + 86400 * 7})
    b64 = payload.encode().hex()
    sig = hmac.new(JWT_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"

def verify_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 2:
        raise HTTPException(401, "Invalid token")
    b64, sig = parts
    expected = hmac.new(JWT_SECRET.encode(), b64.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        raise HTTPException(401, "Invalid signature")
    try:
        payload = json.loads(bytes.fromhex(b64).decode())
    except Exception as e:
        logger.warning(f"Payload error: {e}")
        raise HTTPException(401, "Invalid payload")
    if payload["exp"] < time.time():
        raise HTTPException(401, "Token expired")
    return payload

AUTH_ENABLED = os.environ.get("AUTH_ENABLED", "false").lower() == "true"

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not AUTH_ENABLED:
        return {"uid": 1, "name": "Admin", "role": "admin"}
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    return verify_token(authorization[7:])

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield

app = FastAPI(title="IndustrialPro Process Control", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origin_regex=r"https://.*\.manuelalvarez\.dev|http://localhost:\d+", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Auth ---
class LoginReq(BaseModel):
    name: str
    password: str

class RegisterReq(BaseModel):
    name: str
    password: str
    role: str = "operator"

@app.post("/api/auth/login")
def login(req: LoginReq):
    user = db.get_user_by_name(req.name)
    if not user:
        raise HTTPException(401, "Usuario no encontrado")
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if user["password_hash"] != pw_hash:
        raise HTTPException(401, "Contraseña incorrecta")
    token = make_token(user["id"], user["name"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "role": user["role"]}}

@app.post("/api/auth/register")
def register(req: RegisterReq):
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    user = db.create_user(req.name, pw_hash)
    if not user:
        raise HTTPException(409, "El usuario ya existe")
    token = make_token(user["id"], user["name"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "role": user["role"]}}

@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    u = db.get_user_by_id(user["uid"])
    return {"id": u["id"], "name": u["name"], "role": u["role"], "created_at": u["created_at"]}

# --- Products ---
class ProductReq(BaseModel):
    name: str
    category: str = "Zumos"
    color: str = "#3b82f6"

@app.get("/api/products")
def get_products(user: dict = Depends(get_current_user)):
    return db.get_products()

@app.post("/api/products")
def create_product(req: ProductReq, user: dict = Depends(get_current_user)):
    return db.create_product(req.name, req.category, req.color)

@app.put("/api/products/{pid}")
def update_product(pid: int, req: ProductReq, user: dict = Depends(get_current_user)):
    return db.update_product(pid, req.model_dump())

@app.delete("/api/products/{pid}")
def delete_product(pid: int, user: dict = Depends(get_current_user)):
    db.delete_product(pid)
    return {"status": "deleted"}

# --- Operations ---
class OpCreate(BaseModel):
    name: str
    product_id: int

class OpUpdate(BaseModel):
    status: Optional[str] = None
    name: Optional[str] = None

@app.get("/api/operations")
def get_operations(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    return db.get_operations(status)

@app.get("/api/operations/{oid}")
def get_operation(oid: int, user: dict = Depends(get_current_user)):
    op = db.get_operation(oid)
    if not op:
        raise HTTPException(404, "Operation not found")
    return op

@app.post("/api/operations")
def create_operation(req: OpCreate, user: dict = Depends(get_current_user)):
    op = db.create_operation(req.name, req.product_id, user["uid"])
    default_valves = ["V-001 Entrada", "V-002 Pasteurizador", "V-003 Salida", "V-004 Seguridad"]
    default_pumps = ["B-001 Alimentación", "B-002 Transferencia"]
    default_checklists = [
        ("Revisar válvulas de entrada", "Válvulas"),
        ("Verificar presión de bombas", "Bombas"),
        ("Controlar tiempos de pasteurización", "Tiempos"),
        ("Comprobar temperatura de entrada", "Temperatura"),
        ("Verificar nivel de tanques", "Niveles"),
        ("Revisar filtros de malla", "Filtros"),
        ("Comprobar válvulas de seguridad", "Válvulas"),
        ("Verificar bombas de transferencia", "Bombas"),
        ("Controlar tiempos de concentración", "Tiempos"),
        ("Revisar sistema CIP", "Limpieza"),
    ]
    for v in default_valves:
        db.create_valve(op["id"], v)
    for p in default_pumps:
        db.create_pump(op["id"], p)
    for text, cat in default_checklists:
        db.create_checklist_item(op["id"], text, cat)
    return db.get_operation(op["id"])

@app.put("/api/operations/{oid}")
def update_operation(oid: int, req: OpUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    if "status" in data and data["status"] == "completed":
        data["end_time"] = datetime.utcnow().isoformat()
    return db.update_operation(oid, data)

# --- Timers ---
class TimerCreate(BaseModel):
    name: str
    duration_seconds: int

class TimerUpdate(BaseModel):
    is_running: Optional[int] = None
    elapsed_seconds: Optional[float] = None
    last_tick: Optional[str] = None
    name: Optional[str] = None

@app.post("/api/operations/{oid}/timers")
def create_timer(oid: int, req: TimerCreate, user: dict = Depends(get_current_user)):
    return db.create_timer(oid, req.name, req.duration_seconds)

@app.put("/api/timers/{tid}")
def update_timer(tid: int, req: TimerUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not data: return {"status": "no_update"}
    return db.update_timer(tid, data)

@app.delete("/api/timers/{tid}")
def delete_timer(tid: int, user: dict = Depends(get_current_user)):
    db.delete_timer(tid)
    return {"status": "deleted"}

@app.get("/api/timers/check")
def check_timers(user: dict = Depends(get_current_user)):
    running_timers = db.get_running_timers()
    finished = []
    now = datetime.utcnow()
    for t in running_timers:
        if not t.get("last_tick"):
            continue
        try:
            last = datetime.fromisoformat(t["last_tick"])
        except Exception as e:
            logger.warning(f"Error parsing date {t['last_tick']}: {e}")
            continue
            
        dt = (now - last).total_seconds()
        new_elapsed = t["elapsed_seconds"] + dt
        
        if new_elapsed >= t["duration_seconds"]:
            db.update_timer(t["id"], {"is_running": 0, "elapsed_seconds": t["duration_seconds"]})
            finished.append({"timer_name": t["name"], "operation_name": t["operation_name"], "timer_id": t["id"]})
        else:
            db.update_timer(t["id"], {"elapsed_seconds": new_elapsed, "last_tick": now.isoformat()})
            
    return {"finished": finished}

# --- Valves ---
class ValveUpdate(BaseModel):
    status: Optional[str] = None

class ValveCreate(BaseModel):
    name: str

@app.put("/api/valves/{vid}")
def update_valve(vid: int, req: ValveUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not data: return {"status": "no_update"}
    return db.update_valve(vid, data)

@app.post("/api/operations/{oid}/valves")
def create_valve(oid: int, req: ValveCreate, user: dict = Depends(get_current_user)):
    return db.create_valve(oid, req.name)

# --- Pumps ---
class PumpUpdate(BaseModel):
    status: Optional[str] = None
    rpm: Optional[int] = None

class PumpCreate(BaseModel):
    name: str

@app.put("/api/pumps/{pid}")
def update_pump(pid: int, req: PumpUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not data: return {"status": "no_update"}
    return db.update_pump(pid, data)

@app.post("/api/operations/{oid}/pumps")
def create_pump(oid: int, req: PumpCreate, user: dict = Depends(get_current_user)):
    return db.create_pump(oid, req.name)

# --- Checklists ---
class ChecklistUpdate(BaseModel):
    checked: Optional[int] = None
    text: Optional[str] = None
    category: Optional[str] = None

class ChecklistCreate(BaseModel):
    text: str
    category: str = ""

@app.put("/api/checklists/{cid}")
def update_checklist(cid: int, req: ChecklistUpdate, user: dict = Depends(get_current_user)):
    data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not data: return {"status": "no_update"}
    return db.update_checklist_item(cid, data)

@app.post("/api/operations/{oid}/checklists")
def create_checklist(oid: int, req: ChecklistCreate, user: dict = Depends(get_current_user)):
    return db.create_checklist_item(oid, req.text, req.category)

@app.delete("/api/checklists/{cid}")
def delete_checklist(cid: int, user: dict = Depends(get_current_user)):
    db.delete_checklist_item(cid)
    return {"status": "deleted"}

# --- Stats ---
@app.get("/api/stats")
def get_stats(user: dict = Depends(get_current_user)):
    return db.get_stats()

# --- Export/Import ---
@app.get("/api/export")
def export_data(user: dict = Depends(get_current_user)):
    return db.export_all()

@app.post("/api/import")
def import_data(data: dict, user: dict = Depends(get_current_user)):
    ok = db.import_all(data)
    if not ok:
        raise HTTPException(400, "Error importing data")
    return {"status": "imported"}

# --- Health ---
@app.get("/health")
def health():
    return {"status": "ok", "app": "IndustrialPro Process Control"}
