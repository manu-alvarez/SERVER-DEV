import time, sqlite3
from app.config import settings


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _get_conn() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, title TEXT, created REAL)")
        conn.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conv_id TEXT, role TEXT, content TEXT, timestamp REAL)")


def get_conversations() -> list[dict]:
    with _get_conn() as conn:
        c = conn.execute("SELECT id, title, created FROM conversations ORDER BY created DESC")
        convs = []
        for row in c.fetchall():
            msgs = conn.execute(
                "SELECT role, content, timestamp FROM messages WHERE conv_id=? ORDER BY timestamp ASC",
                (row["id"],),
            ).fetchall()
            convs.append({
                "id": row["id"],
                "title": row["title"],
                "created": row["created"],
                "messages": [{"role": m["role"], "content": m["content"], "timestamp": m["timestamp"]} for m in msgs],
            })
        return convs


def get_conversation(cid: str) -> dict | None:
    with _get_conn() as conn:
        row = conn.execute("SELECT id, title, created FROM conversations WHERE id=?", (cid,)).fetchone()
        if not row:
            return None
        msgs = conn.execute(
            "SELECT role, content, timestamp FROM messages WHERE conv_id=? ORDER BY timestamp ASC",
            (cid,),
        ).fetchall()
        return {
            "id": row["id"],
            "title": row["title"],
            "created": row["created"],
            "messages": [{"role": m["role"], "content": m["content"], "timestamp": m["timestamp"]} for m in msgs],
        }


def create_conversation(cid: str, title: str):
    with _get_conn() as conn:
        conn.execute("INSERT OR IGNORE INTO conversations (id, title, created) VALUES (?, ?, ?)", (cid, title, time.time()))


def add_message(cid: str, role: str, content: str):
    with _get_conn() as conn:
        conn.execute("INSERT INTO messages (conv_id, role, content, timestamp) VALUES (?, ?, ?, ?)", (cid, role, content, time.time()))
