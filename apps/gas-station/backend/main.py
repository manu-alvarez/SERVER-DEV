import os
import uuid
import json
import logging
from datetime import datetime, date
from typing import Optional
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt
import jwt

logger = logging.getLogger("gas-station")
logging.basicConfig(level=logging.INFO)

DB = {}
JWT_SECRET = os.getenv("NEWTON_JWT_SECRET")
if not JWT_SECRET:
    logger.warning("NEWTON_JWT_SECRET not set — using insecure fallback! Set it in .env for production.")
    JWT_SECRET = "newton-fallback-insecure-dev-only"
PORT = int(os.getenv("PORT", "3005"))

def init_db():
    import sqlite3
    conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), "newton.db"), check_same_thread=False, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, pin TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'expendedor', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS checklist_templates (
            id TEXT PRIMARY KEY, phase TEXT NOT NULL CHECK(phase IN ('apertura','cambio_turno','cierre')),
            task_name TEXT NOT NULL, order_index INTEGER NOT NULL DEFAULT 0,
            is_critical INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
            user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS checklist_entries (
            id TEXT PRIMARY KEY, template_id TEXT NOT NULL, user_id TEXT NOT NULL,
            date TEXT NOT NULL, phase TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0,
            completed_at DATETIME, observations TEXT DEFAULT '',
            FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY, ean TEXT DEFAULT '', name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'otros', warning_days INTEGER NOT NULL DEFAULT 3,
            withdraw_days INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS product_batches (
            id TEXT PRIMARY KEY, product_id TEXT NOT NULL, expiry_date TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'ok',
            withdrawn_at DATETIME, withdrawn_by TEXT, notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS timesheet (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
            start_time TEXT NOT NULL, end_time TEXT NOT NULL,
            break_minutes INTEGER NOT NULL DEFAULT 0, total_hours REAL NOT NULL DEFAULT 0,
            shift_type TEXT DEFAULT 'manana', notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS timesheet_config (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE,
            contract_hours_week REAL NOT NULL DEFAULT 40,
            contract_hours_month REAL NOT NULL DEFAULT 160,
            gross_annual_salary REAL NOT NULL DEFAULT 17878.95,
            morning_days_on INTEGER NOT NULL DEFAULT 7, morning_days_off INTEGER NOT NULL DEFAULT 3,
            afternoon_days_on INTEGER NOT NULL DEFAULT 7, afternoon_days_off INTEGER NOT NULL DEFAULT 4,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'otros', description TEXT NOT NULL,
            urgency TEXT NOT NULL DEFAULT 'media', status TEXT NOT NULL DEFAULT 'abierta',
            photo TEXT DEFAULT '', resolution TEXT DEFAULT '', resolved_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS inventory_history (
            id TEXT PRIMARY KEY, product_id TEXT NOT NULL, batch_id TEXT,
            change_type TEXT NOT NULL, quantity INTEGER NOT NULL, notes TEXT DEFAULT '',
            user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    return conn

def seed_db(conn):
    cur = conn.execute("SELECT COUNT(*) as c FROM users")
    if cur.fetchone()["c"] > 0:
        return
    manu_id = str(uuid.uuid4())
    est_id = str(uuid.uuid4())
    conn.execute("INSERT INTO users (id,name,pin,role) VALUES (?,?,?,?)",
                 (manu_id, "Manu", bcrypt.hashpw(b"1987", bcrypt.gensalt()).decode(), "expendedor"))
    conn.execute("INSERT INTO users (id,name,pin,role) VALUES (?,?,?,?)",
                 (est_id, "Estefania", bcrypt.hashpw(b"2026", bcrypt.gensalt()).decode(), "expendedor"))
    conn.execute("INSERT INTO timesheet_config (id,user_id,contract_hours_week,contract_hours_month,gross_annual_salary,morning_days_on,morning_days_off,afternoon_days_on,afternoon_days_off) VALUES (?,?,40,160,17878.95,7,3,7,4)", (str(uuid.uuid4()), manu_id))
    conn.execute("INSERT INTO timesheet_config (id,user_id,contract_hours_week,contract_hours_month,gross_annual_salary,morning_days_on,morning_days_off,afternoon_days_on,afternoon_days_off) VALUES (?,?,40,160,17878.95,7,3,7,4)", (str(uuid.uuid4()), est_id))
    templates = [
        ('apertura','Verificar arqueo de caja inicial',1,1),
        ('apertura','Encender iluminacion exterior y rotulos',2,0),
        ('apertura','Comprobar surtidores operativos',3,1),
        ('apertura','Verificar terminales de pago (TPV/Datafono)',4,1),
        ('apertura','Revisar stock de tienda y reponer',5,0),
        ('apertura','Comprobar limpieza de pista y marquesina',6,0),
        ('apertura','Verificar niveles de producto en surtidores',7,0),
        ('apertura','Revisar caducidades del dia',8,0),
        ('cambio_turno','Cuadre de caja con companero',1,1),
        ('cambio_turno','Informe de incidencias pendientes',2,1),
        ('cambio_turno','Revision de caducidades del dia',3,0),
        ('cambio_turno','Verificar estado de pista y surtidores',4,0),
        ('cambio_turno','Comprobar papeleras y limpieza general',5,0),
        ('cierre','Arqueo de caja final',1,1),
        ('cierre','Cerrar surtidores y consola',2,1),
        ('cierre','Apagar iluminacion no esencial',3,0),
        ('cierre','Limpieza general de tienda y aseos',4,0),
        ('cierre','Recoger elementos exteriores',5,0),
        ('cierre','Verificar puertas y accesos cerrados',6,1),
        ('cierre','Activar sistema de alarma',7,1),
    ]
    for uid in (manu_id, est_id):
        for t in templates:
            conn.execute("INSERT INTO checklist_templates (id,phase,task_name,order_index,is_critical,is_active,user_id) VALUES (?,?,?,?,?,1,?)",
                         (str(uuid.uuid4()), t[0], t[1], t[2], t[3], uid))
    defaults = [('station_name','Estacion Repsol Mequinenza'),('notification_hour','09:00'),('theme','dark')]
    for k,v in defaults:
        conn.execute("INSERT OR IGNORE INTO app_settings (key,value) VALUES (?,?)", (k,v))
    conn.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    DB["conn"] = init_db()
    seed_db(DB["conn"])
    yield
    DB["conn"].close()

app = FastAPI(title="Gas Station API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origin_regex=r"https://.*\.manuelalvarez\.dev|http://localhost:\d+", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Helpers ---
def get_db():
    return DB["conn"]

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())

def make_token(user: dict) -> str:
    return jwt.encode({"id": user["id"], "name": user["name"], "role": user["role"]}, JWT_SECRET, algorithm="HS256")

async def get_token_user(req: Request):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    try:
        return jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido")

# --- Health Check ---
@app.get("/health")
def health_check():
    """Uniform health check endpoint for ecosystem monitoring."""
    try:
        conn = get_db()
        conn.execute("SELECT 1")
        return {"status": "ok", "service": "gas-station-backend", "db": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {e}")

# --- Auth ---
class LoginBody(BaseModel):
    name: str
    pin: str

class RegisterBody(BaseModel):
    name: str
    pin: str
    role: str = "expendedor"

class ChangePinBody(BaseModel):
    pin: str
    newPin: str

@app.post("/api/auth/login")
def login(body: LoginBody):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE name = ?", (body.name,)).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if not verify_pin(body.pin, user["pin"]):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    return {"token": make_token(dict(user)), "user": {"id": user["id"], "name": user["name"], "role": user["role"]}}

@app.post("/api/auth/register")
def register(body: RegisterBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    if conn.execute("SELECT 1 FROM users WHERE name = ?", (body.name,)).fetchone():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    uid = str(uuid.uuid4())
    conn.execute("INSERT INTO users (id,name,pin,role) VALUES (?,?,?,?)",
                 (uid, body.name, hash_pin(body.pin), body.role))
    conn.execute("INSERT INTO timesheet_config (id,user_id) VALUES (?,?)", (str(uuid.uuid4()), uid))
    conn.commit()
    return {"id": uid, "name": body.name, "role": body.role}

@app.get("/api/auth/me")
def auth_me(user: dict = Depends(get_token_user)):
    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": u["id"], "name": u["name"], "role": u["role"]}

@app.put("/api/auth/pin")
def change_pin(body: ChangePinBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    u = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not verify_pin(body.pin, u["pin"]):
        raise HTTPException(status_code=401, detail="PIN actual incorrecto")
    conn.execute("UPDATE users SET pin = ? WHERE id = ?", (hash_pin(body.newPin), user["id"]))
    conn.commit()
    return {"ok": True}

@app.get("/api/auth/users")
def list_users(user: dict = Depends(get_token_user)):
    conn = get_db()
    users = conn.execute("SELECT id, name, role FROM users ORDER BY name").fetchall()
    return [dict(u) for u in users]

# --- Products ---
class ProductBody(BaseModel):
    ean: str = ""
    name: str
    category: str = "otros"
    warning_days: int = 3
    withdraw_days: int = 0

class BatchBody(BaseModel):
    product_id: str
    expiry_date: str
    quantity: int = 1
    notes: str = ""

@app.get("/api/products")
def list_products(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM products WHERE is_active = 1 ORDER BY name").fetchall()
    return [dict(r) for r in rows]

@app.post("/api/products")
def create_product(body: ProductBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    pid = str(uuid.uuid4())
    conn.execute("INSERT INTO products (id,ean,name,category,warning_days,withdraw_days) VALUES (?,?,?,?,?,?)",
                 (pid, body.ean, body.name, body.category, body.warning_days, body.withdraw_days))
    conn.commit()
    return dict(conn.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone())

@app.put("/api/products/{pid}")
def update_product(pid: str, body: ProductBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("UPDATE products SET ean=?,name=?,category=?,warning_days=?,withdraw_days=? WHERE id=?",
                 (body.ean, body.name, body.category, body.warning_days, body.withdraw_days, pid))
    conn.commit()
    return dict(conn.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone())

@app.delete("/api/products/{pid}")
def delete_product(pid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("UPDATE products SET is_active = 0 WHERE id = ?", (pid,))
    conn.commit()
    return {"ok": True}

@app.get("/api/products/batches")
def list_batches(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT b.*, p.name as product_name, p.category
        FROM product_batches b JOIN products p ON b.product_id = p.id
        ORDER BY b.expiry_date
    """).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/products/batches")
def create_batch(body: BatchBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    bid = str(uuid.uuid4())
    conn.execute("INSERT INTO product_batches (id,product_id,expiry_date,quantity,notes) VALUES (?,?,?,?,?)",
                 (bid, body.product_id, body.expiry_date, body.quantity, body.notes))
    conn.commit()
    return dict(conn.execute("SELECT * FROM product_batches WHERE id = ?", (bid,)).fetchone())

@app.put("/api/products/batches/{bid}")
def update_batch(bid: str, body: BatchBody, user: dict = Depends(get_token_user)):
    conn = get_db
    conn.execute("UPDATE product_batches SET product_id=?,expiry_date=?,quantity=?,notes=? WHERE id=?",
                 (body.product_id, body.expiry_date, body.quantity, body.notes, bid))
    conn.commit()
    return dict(conn.execute("SELECT * FROM product_batches WHERE id = ?", (bid,)).fetchone())

@app.delete("/api/products/batches/{bid}")
def delete_batch(bid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("DELETE FROM product_batches WHERE id = ?", (bid,))
    conn.commit()
    return {"ok": True}

@app.get("/api/products/alerts")
def product_alerts(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT b.*, p.name as product_name, p.warning_days
        FROM product_batches b JOIN products p ON b.product_id = p.id
        WHERE b.status = 'ok' AND date(b.expiry_date) <= date('now', '+' || p.warning_days || ' days')
        ORDER BY b.expiry_date
    """).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/products/history")
def product_history(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM inventory_history ORDER BY created_at DESC LIMIT 100").fetchall()
    return [dict(r) for r in rows]

# --- Checklists ---
@app.get("/api/checklists/templates")
def list_templates(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM checklist_templates WHERE user_id = ? AND is_active = 1 ORDER BY phase, order_index",
                        (user["id"],)).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/checklists/templates")
def create_template(body: dict, user: dict = Depends(get_token_user)):
    conn = get_db()
    tid = str(uuid.uuid4())
    conn.execute("INSERT INTO checklist_templates (id,phase,task_name,order_index,is_critical,user_id) VALUES (?,?,?,?,?,?)",
                 (tid, body["phase"], body["task_name"], body.get("order_index", 0), body.get("is_critical", 0), user["id"]))
    conn.commit()
    return dict(conn.execute("SELECT * FROM checklist_templates WHERE id = ?", (tid,)).fetchone())

@app.put("/api/checklists/templates/{tid}")
def update_template(tid: str, body: dict, user: dict = Depends(get_token_user)):
    conn = get_db
    conn.execute("UPDATE checklist_templates SET phase=?,task_name=?,order_index=?,is_critical=? WHERE id=?",
                 (body["phase"], body["task_name"], body.get("order_index", 0), body.get("is_critical", 0), tid))
    conn.commit()
    return dict(conn.execute("SELECT * FROM checklist_templates WHERE id = ?", (tid,)).fetchone())

@app.delete("/api/checklists/templates/{tid}")
def delete_template(tid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("UPDATE checklist_templates SET is_active = 0 WHERE id = ?", (tid,))
    conn.commit()
    return {"ok": True}

@app.put("/api/checklists/templates-reorder")
def reorder_templates(body: dict, user: dict = Depends(get_token_user)):
    conn = get_db()
    for i, tid in enumerate(body["ids"]):
        conn.execute("UPDATE checklist_templates SET order_index = ? WHERE id = ?", (i, tid))
    conn.commit()
    return {"ok": True}

@app.put("/api/checklists/templates/{tid}/move")
def move_template(tid: str, body: dict, user: dict = Depends(get_token_user)):
    conn = get_db
    t = conn.execute("SELECT * FROM checklist_templates WHERE id = ?", (tid,)).fetchone()
    if not t:
        raise HTTPException(status_code=404)
    delta = -1 if body["direction"] == "up" else 1
    new_idx = t["order_index"] + delta
    neighbor = conn.execute("SELECT id FROM checklist_templates WHERE user_id=? AND phase=? AND order_index=? AND is_active=1",
                            (t["user_id"], t["phase"], new_idx)).fetchone()
    if neighbor:
        conn.execute("UPDATE checklist_templates SET order_index=? WHERE id=?", (new_idx, tid))
        conn.execute("UPDATE checklist_templates SET order_index=? WHERE id=?", (t["order_index"], neighbor["id"]))
        conn.commit()
    return {"ok": True}

@app.get("/api/checklists/entries")
def get_entries(date: str, phase: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT e.*, t.task_name, t.order_index, t.is_critical
        FROM checklist_entries e JOIN checklist_templates t ON e.template_id = t.id
        WHERE e.user_id=? AND e.date=? AND e.phase=?
        ORDER BY t.order_index
    """, (user["id"], date, phase)).fetchall()
    return [dict(r) for r in rows]

@app.put("/api/checklists/entries/{eid}")
def update_entry(eid: str, body: dict, user: dict = Depends(get_token_user)):
    conn = get_db
    now = datetime.utcnow().isoformat() if body.get("completed") else None
    conn.execute("UPDATE checklist_entries SET completed=?,completed_at=?,observations=? WHERE id=?",
                 (body.get("completed", 0), now, body.get("observations", ""), eid))
    conn.commit()
    return {"ok": True}

@app.get("/api/checklists/summary")
def checklist_summary(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("""
        SELECT phase, date, COUNT(*) as total, SUM(completed) as done
        FROM checklist_entries WHERE user_id=?
        GROUP BY phase, date ORDER BY date DESC
    """, (user["id"],)).fetchall()
    return [dict(r) for r in rows]

# --- Incidents ---
class IncidentBody(BaseModel):
    category: str = "otros"
    description: str
    urgency: str = "media"
    photo: str = ""

@app.get("/api/incidents")
def list_incidents(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    return [dict(r) for r in rows]

@app.get("/api/incidents/stats/summary")
def incident_stats(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT status, COUNT(*) as count FROM incidents WHERE user_id=? GROUP BY status",
                        (user["id"],)).fetchall()
    return {r["status"]: r["count"] for r in rows}

@app.get("/api/incidents/{iid}")
def get_incident(iid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    row = conn.execute("SELECT * FROM incidents WHERE id = ?", (iid,)).fetchone()
    if not row:
        raise HTTPException(status_code=404)
    return dict(row)

@app.post("/api/incidents")
def create_incident(body: IncidentBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    iid = str(uuid.uuid4())
    conn.execute("INSERT INTO incidents (id,user_id,category,description,urgency,photo) VALUES (?,?,?,?,?,?)",
                 (iid, user["id"], body.category, body.description, body.urgency, body.photo))
    conn.commit()
    return dict(conn.execute("SELECT * FROM incidents WHERE id = ?", (iid,)).fetchone())

@app.put("/api/incidents/{iid}")
def update_incident(iid: str, body: dict, user: dict = Depends(get_token_user)):
    conn = get_db
    now = datetime.utcnow().isoformat() if body.get("status") == "resuelta" else None
    conn.execute("UPDATE incidents SET category=?,description=?,urgency=?,status=?,resolution=?,resolved_at=? WHERE id=?",
                 (body.get("category", "otros"), body.get("description", ""), body.get("urgency", "media"),
                  body.get("status", "abierta"), body.get("resolution", ""), now, iid))
    conn.commit()
    return dict(conn.execute("SELECT * FROM incidents WHERE id = ?", (iid,)).fetchone())

@app.delete("/api/incidents/{iid}")
def delete_incident(iid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("DELETE FROM incidents WHERE id = ?", (iid,))
    conn.commit()
    return {"ok": True}

# --- Timesheet ---
class TimesheetBody(BaseModel):
    date: str
    start_time: str
    end_time: str
    break_minutes: int = 0
    shift_type: str = "manana"
    notes: str = ""

class TimesheetConfigBody(BaseModel):
    contract_hours_week: float = 40
    contract_hours_month: float = 160
    gross_annual_salary: float = 17878.95
    morning_days_on: int = 7
    morning_days_off: int = 3
    afternoon_days_on: int = 7
    afternoon_days_off: int = 4

@app.get("/api/timesheet")
def get_timesheet(month: int, year: int, user: dict = Depends(get_token_user)):
    conn = get_db()
    prefix = f"{year:04d}-{month:02d}"
    rows = conn.execute("SELECT * FROM timesheet WHERE user_id=? AND date LIKE ? ORDER BY date",
                        (user["id"], f"{prefix}%")).fetchall()
    return [dict(r) for r in rows]

@app.post("/api/timesheet")
def create_timesheet(body: TimesheetBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    tid = str(uuid.uuid4())
    total = calc_hours(body.start_time, body.end_time, body.break_minutes)
    conn.execute("INSERT INTO timesheet (id,user_id,date,start_time,end_time,break_minutes,total_hours,shift_type,notes) VALUES (?,?,?,?,?,?,?,?,?)",
                 (tid, user["id"], body.date, body.start_time, body.end_time, body.break_minutes, total, body.shift_type, body.notes))
    conn.commit()
    return dict(conn.execute("SELECT * FROM timesheet WHERE id = ?", (tid,)).fetchone())

@app.put("/api/timesheet/{tid}")
def update_timesheet(tid: str, body: TimesheetBody, user: dict = Depends(get_token_user)):
    conn = get_db
    total = calc_hours(body.start_time, body.end_time, body.break_minutes)
    conn.execute("UPDATE timesheet SET date=?,start_time=?,end_time=?,break_minutes=?,total_hours=?,shift_type=?,notes=? WHERE id=?",
                 (body.date, body.start_time, body.end_time, body.break_minutes, total, body.shift_type, body.notes, tid))
    conn.commit()
    return dict(conn.execute("SELECT * FROM timesheet WHERE id = ?", (tid,)).fetchone())

@app.delete("/api/timesheet/{tid}")
def delete_timesheet(tid: str, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("DELETE FROM timesheet WHERE id = ?", (tid,))
    conn.commit()
    return {"ok": True}

import calendar
from datetime import date

def get_expected_work_days(year: int, month: int):
    cycle_pattern = [True]*7 + [False]*3 + [True]*7 + [False]*4
    cycle_start = date(2026, 1, 5) # Monday, Jan 5 2026
    days_in_month = calendar.monthrange(year, month)[1]
    work_days = []
    for day in range(1, days_in_month + 1):
        current = date(year, month, day)
        diff_days = (current - cycle_start).days
        cycle_day = diff_days % 21
        if cycle_pattern[cycle_day]:
            work_days.append(current.strftime("%Y-%m-%d"))
    return work_days

@app.get("/api/timesheet/summary")
def timesheet_summary(month: int, year: int, user: dict = Depends(get_token_user)):
    conn = get_db()
    prefix = f"{year:04d}-{month:02d}"
    rows = conn.execute("SELECT * FROM timesheet WHERE user_id=? AND date LIKE ?", (user["id"], f"{prefix}%")).fetchall()
    
    total_hours = sum(r["total_hours"] for r in rows)
    total_worked = round(total_hours, 2)
    days_worked = len(rows)
    days_in_month = calendar.monthrange(year, month)[1]
    
    cfg = conn.execute("SELECT * FROM timesheet_config WHERE user_id=?", (user["id"],)).fetchone()
    contract_hours_month = cfg["contract_hours_month"] if cfg else 160
    gross_annual = cfg["gross_annual_salary"] if cfg else 17878.95
    
    monthly_gross = round(gross_annual / 12, 2)
    hourly_rate = round(monthly_gross / contract_hours_month, 2) if contract_hours_month else 0
    estimated_salary = round(total_worked * hourly_rate, 2)
    difference = round(total_worked - contract_hours_month, 2)
    
    expected_work_days = get_expected_work_days(year, month)
    expected_hours = round(len(expected_work_days) * 7, 2)
    
    morning_entries = [r for r in rows if r["shift_type"] == "mañana"]
    afternoon_entries = [r for r in rows if r["shift_type"] == "tarde"]
    special_entries = [r for r in rows if r["shift_type"] == "especial"]
    descanso_entries = [r for r in rows if r["shift_type"] == "descanso"]
    
    return {
        "month": month,
        "year": year,
        "daysInMonth": days_in_month,
        "daysWorked": days_worked,
        "totalWorked": total_worked,
        "contractHoursMonth": contract_hours_month,
        "difference": difference,
        "expectedWorkDays": len(expected_work_days),
        "expectedHours": expected_hours,
        "salary": {
            "grossAnnual": gross_annual,
            "monthlyGross": monthly_gross,
            "hourlyRate": hourly_rate,
            "estimated": estimated_salary,
            "full": monthly_gross
        },
        "shifts": {
            "morning": {"count": len(morning_entries), "hours": round(sum(r["total_hours"] for r in morning_entries), 2)},
            "afternoon": {"count": len(afternoon_entries), "hours": round(sum(r["total_hours"] for r in afternoon_entries), 2)},
            "special": {"count": len(special_entries), "hours": round(sum(r["total_hours"] for r in special_entries), 2)},
            "descanso": {"count": len(descanso_entries)}
        },
        "rotation": expected_work_days,
        "config": dict(cfg) if cfg else None,
        # Legacy compat
        "total_hours": total_worked,
        "total_entries": days_worked,
        "missing_hours": round(max(0, -difference), 2)
    }

@app.get("/api/timesheet/config")
def get_timesheet_config(user: dict = Depends(get_token_user)):
    conn = get_db()
    cfg = conn.execute("SELECT * FROM timesheet_config WHERE user_id=?", (user["id"],)).fetchone()
    if not cfg:
        return {"contract_hours_week": 40, "contract_hours_month": 160, "gross_annual_salary": 17878.95,
                "morning_days_on": 7, "morning_days_off": 3, "afternoon_days_on": 7, "afternoon_days_off": 4}
    return dict(cfg)

@app.put("/api/timesheet/config")
def update_timesheet_config(body: TimesheetConfigBody, user: dict = Depends(get_token_user)):
    conn = get_db()
    conn.execute("""
        UPDATE timesheet_config SET contract_hours_week=?,contract_hours_month=?,gross_annual_salary=?,
        morning_days_on=?,morning_days_off=?,afternoon_days_on=?,afternoon_days_off=? WHERE user_id=?
    """, (body.contract_hours_week, body.contract_hours_month, body.gross_annual_salary,
          body.morning_days_on, body.morning_days_off, body.afternoon_days_on, body.afternoon_days_off, user["id"]))
    conn.commit()
    return {"ok": True}

# --- Settings ---
@app.get("/api/settings")
def get_settings(user: dict = Depends(get_token_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM app_settings").fetchall()
    return {r["key"]: r["value"] for r in rows}

@app.put("/api/settings")
def update_settings(body: dict, user: dict = Depends(get_token_user)):
    conn = get_db()
    for k, v in body.items():
        conn.execute("INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)", (k, str(v)))
    conn.commit()
    return {"ok": True}

@app.get("/api/settings/export")
def export_settings(user: dict = Depends(get_token_user)):
    conn = get_db()
    data = {}
    for table in ["users","checklist_templates","checklist_entries","products","product_batches","timesheet","timesheet_config","incidents","app_settings"]:
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        data[table] = [dict(r) for r in rows]
    return data

@app.post("/api/settings/import")
def import_settings(body: dict, user: dict = Depends(get_token_user)):
    conn = get_db()
    for table, rows in body.items():
        if not rows:
            continue
        cols = ", ".join(rows[0].keys())
        placeholders = ", ".join("?" for _ in rows[0])
        conn.executemany(f"INSERT OR REPLACE INTO {table} ({cols}) VALUES ({placeholders})",
                         [list(r.values()) for r in rows])
    conn.commit()
    return {"ok": True}

# --- Helpers ---
def calc_hours(start: str, end: str, break_min: int) -> float:
    try:
        sh, sm = map(int, start.split(":"))
        eh, em = map(int, end.split(":"))
        total = (eh * 60 + em) - (sh * 60 + sm) - break_min
        return round(max(0, total) / 60, 2)
    except (ValueError, AttributeError):
        return 0

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
