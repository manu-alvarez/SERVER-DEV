import sqlite3, os, json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "industrialpro.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'operator',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            product_id INTEGER REFERENCES products(id),
            status TEXT DEFAULT 'running',
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS timers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            duration_seconds INTEGER NOT NULL,
            elapsed_seconds REAL DEFAULT 0,
            is_running INTEGER DEFAULT 0,
            last_tick TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS valves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'closed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pumps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'stopped',
            rpm INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_id INTEGER REFERENCES operations(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            category TEXT DEFAULT '',
            checked INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

# --- Users ---
def create_user(name, password_hash):
    conn = get_conn()
    try:
        cur = conn.execute("INSERT INTO users (name, password_hash) VALUES (?, ?)", (name, password_hash))
        conn.commit()
        row = dict(conn.execute("SELECT * FROM users WHERE id = ?", (cur.lastrowid,)).fetchone())
        conn.close()
        return row
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_user_by_name(name):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(uid):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return dict(row) if row else None

# --- Products ---
def get_products():
    conn = get_conn()
    rows = [dict(r) for r in conn.execute("SELECT * FROM products ORDER BY category, name").fetchall()]
    conn.close()
    return rows

def create_product(name, category, color):
    conn = get_conn()
    cur = conn.execute("INSERT INTO products (name, category, color) VALUES (?, ?, ?)", (name, category, color))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM products WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return row

def update_product(pid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE products SET {sets} WHERE id = ?", list(data.values()) + [pid])
    conn.commit()
    row = dict(conn.execute("SELECT * FROM products WHERE id = ?", (pid,)).fetchone())
    conn.close()
    return row

def delete_product(pid):
    conn = get_conn()
    conn.execute("DELETE FROM products WHERE id = ?", (pid,))
    conn.commit()
    conn.close()

# --- Operations ---
def create_operation(name, product_id, created_by):
    conn = get_conn()
    cur = conn.execute("INSERT INTO operations (name, product_id, created_by) VALUES (?, ?, ?)", (name, product_id, created_by))
    oid = cur.lastrowid
    conn.commit()
    row = dict(conn.execute("SELECT * FROM operations WHERE id = ?", (oid,)).fetchone())
    conn.close()
    return row

def get_operations(status=None):
    conn = get_conn()
    query = "SELECT o.*, p.name as product_name FROM operations o LEFT JOIN products p ON o.product_id = p.id"
    if status:
        query += f" WHERE o.status = '{status}'"
    query += " ORDER BY o.created_at DESC"
    rows = [dict(r) for r in conn.execute(query).fetchall()]
    # Attach child entities (timers, valves, pumps, checklists) to each operation
    for op in rows:
        oid = op["id"]
        op['timers'] = [dict(r) for r in conn.execute("SELECT * FROM timers WHERE operation_id = ?", (oid,)).fetchall()]
        op['valves'] = [dict(r) for r in conn.execute("SELECT * FROM valves WHERE operation_id = ?", (oid,)).fetchall()]
        op['pumps'] = [dict(r) for r in conn.execute("SELECT * FROM pumps WHERE operation_id = ?", (oid,)).fetchall()]
        op['checklists'] = [dict(r) for r in conn.execute("SELECT * FROM checklist_items WHERE operation_id = ?", (oid,)).fetchall()]
    conn.close()
    return rows

def get_operation(oid):
    conn = get_conn()
    op = conn.execute("SELECT o.*, p.name as product_name FROM operations o LEFT JOIN products p ON o.product_id = p.id WHERE o.id = ?", (oid,)).fetchone()
    if not op: return None
    op = dict(op)
    op['timers'] = [dict(r) for r in conn.execute("SELECT * FROM timers WHERE operation_id = ?", (oid,)).fetchall()]
    op['valves'] = [dict(r) for r in conn.execute("SELECT * FROM valves WHERE operation_id = ?", (oid,)).fetchall()]
    op['pumps'] = [dict(r) for r in conn.execute("SELECT * FROM pumps WHERE operation_id = ?", (oid,)).fetchall()]
    op['checklists'] = [dict(r) for r in conn.execute("SELECT * FROM checklist_items WHERE operation_id = ?", (oid,)).fetchall()]
    conn.close()
    return op

def update_operation(oid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE operations SET {sets} WHERE id = ?", list(data.values()) + [oid])
    conn.commit()
    conn.close()
    return get_operation(oid)

# --- Timers ---
def create_timer(oid, name, duration_seconds):
    conn = get_conn()
    cur = conn.execute("INSERT INTO timers (operation_id, name, duration_seconds, last_tick) VALUES (?, ?, ?, ?)", (oid, name, duration_seconds, datetime.utcnow().isoformat()))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM timers WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return row

def update_timer(tid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE timers SET {sets} WHERE id = ?", list(data.values()) + [tid])
    conn.commit()
    row = dict(conn.execute("SELECT * FROM timers WHERE id = ?", (tid,)).fetchone())
    conn.close()
    return row

def delete_timer(tid):
    conn = get_conn()
    conn.execute("DELETE FROM timers WHERE id = ?", (tid,))
    conn.commit()
    conn.close()

# --- Valves ---
def create_valve(oid, name):
    conn = get_conn()
    cur = conn.execute("INSERT INTO valves (operation_id, name) VALUES (?, ?)", (oid, name))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM valves WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return row

def update_valve(vid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE valves SET {sets} WHERE id = ?", list(data.values()) + [vid])
    conn.commit()
    row = dict(conn.execute("SELECT * FROM valves WHERE id = ?", (vid,)).fetchone())
    conn.close()
    return row

# --- Pumps ---
def create_pump(oid, name):
    conn = get_conn()
    cur = conn.execute("INSERT INTO pumps (operation_id, name) VALUES (?, ?)", (oid, name))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM pumps WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return row

def update_pump(pid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE pumps SET {sets} WHERE id = ?", list(data.values()) + [pid])
    conn.commit()
    row = dict(conn.execute("SELECT * FROM pumps WHERE id = ?", (pid,)).fetchone())
    conn.close()
    return row

# --- Checklists ---
def create_checklist_item(oid, text, category):
    conn = get_conn()
    cur = conn.execute("INSERT INTO checklist_items (operation_id, text, category) VALUES (?, ?, ?)", (oid, text, category))
    conn.commit()
    row = dict(conn.execute("SELECT * FROM checklist_items WHERE id = ?", (cur.lastrowid,)).fetchone())
    conn.close()
    return row

def update_checklist_item(cid, data):
    conn = get_conn()
    sets = ", ".join(f"{k} = ?" for k in data)
    conn.execute(f"UPDATE checklist_items SET {sets} WHERE id = ?", list(data.values()) + [cid])
    conn.commit()
    row = dict(conn.execute("SELECT * FROM checklist_items WHERE id = ?", (cid,)).fetchone())
    conn.close()
    return row

def delete_checklist_item(cid):
    conn = get_conn()
    conn.execute("DELETE FROM checklist_items WHERE id = ?", (cid,))
    conn.commit()
    conn.close()

# --- Stats ---
def get_stats():
    conn = get_conn()
    total_ops = conn.execute("SELECT COUNT(*) FROM operations").fetchone()[0]
    running_ops = conn.execute("SELECT COUNT(*) FROM operations WHERE status = 'running'").fetchone()[0]
    completed_ops = conn.execute("SELECT COUNT(*) FROM operations WHERE status = 'completed'").fetchone()[0]
    total_products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_timers = conn.execute("SELECT COUNT(*) FROM timers").fetchone()[0]
    active_timers = conn.execute("SELECT COUNT(*) FROM timers WHERE is_running = 1").fetchone()[0]
    conn.close()
    return {
        "total_operations": total_ops,
        "running_operations": running_ops,
        "completed_operations": completed_ops,
        "total_products": total_products,
        "total_timers": total_timers,
        "active_timers": active_timers,
    }

# --- Export/Import ---
def export_all():
    conn = get_conn()
    data = {
        "products": [dict(r) for r in conn.execute("SELECT * FROM products").fetchall()],
        "operations": [dict(r) for r in conn.execute("SELECT * FROM operations").fetchall()],
        "timers": [dict(r) for r in conn.execute("SELECT * FROM timers").fetchall()],
        "valves": [dict(r) for r in conn.execute("SELECT * FROM valves").fetchall()],
        "pumps": [dict(r) for r in conn.execute("SELECT * FROM pumps").fetchall()],
        "checklists": [dict(r) for r in conn.execute("SELECT * FROM checklist_items").fetchall()],
    }
    conn.close()
    return data

def import_all(data):
    conn = get_conn()
    try:
        for table in ['products', 'operations', 'timers', 'valves', 'pumps', 'checklist_items']:
            if table in data and data[table]:
                columns = [k for k in data[table][0].keys() if k != 'id']
                placeholders = ", ".join("?" * len(columns))
                cols_str = ", ".join(columns)
                for row in data[table]:
                    conn.execute(f"INSERT OR REPLACE INTO {table} ({cols_str}) VALUES ({placeholders})",
                               [row.get(c) for c in columns])
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        return False
    finally:
        conn.close()
