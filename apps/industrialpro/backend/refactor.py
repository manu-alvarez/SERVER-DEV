import re

db_path = "/Users/manu/Desktop/SERVER-DEV/apps/industrialpro/backend/database.py"
with open(db_path, "r") as f:
    content = f.read()

# Make sure logger is imported
if "import logging" not in content:
    content = "import logging\nlogger = logging.getLogger(__name__)\n" + content

# Fix integrity error pass
content = re.sub(
    r'except sqlite3\.IntegrityError:\n\s+pass',
    r'except sqlite3.IntegrityError as e:\n        logger.warning(f"Integrity error (duplicate user): {e}")',
    content
)

# Add get_running_timers
if "def get_running_timers(" not in content:
    get_rt_code = """
def get_running_timers():
    conn = get_conn()
    # Join with operations to get the operation name
    query = '''
        SELECT t.*, o.name as operation_name 
        FROM timers t
        JOIN operations o ON t.operation_id = o.id
        WHERE t.is_running = 1
    '''
    rows = [dict(r) for r in conn.execute(query).fetchall()]
    conn.close()
    return rows
"""
    content += get_rt_code

with open(db_path, "w") as f:
    f.write(content)

print("database.py updated.")

app_path = "/Users/manu/Desktop/SERVER-DEV/apps/industrialpro/backend/app.py"
with open(app_path, "r") as f:
    app_content = f.read()

if "import logging" not in app_content:
    app_content = "import logging\nlogger = logging.getLogger(__name__)\n" + app_content

# Rewrite check_timers
old_check_timers = r'''@app\.get\("/api/timers/check"\)
def check_timers\(user: dict = Depends\(get_current_user\)\):
    ops = db\.get_operations\("running"\)
    finished = \[\]
    for op in ops:
        full = db\.get_operation\(op\["id"\]\)
        for t in full\.get\("timers", \[\]\):
            if t\["is_running"\] and t\["last_tick"\]:
                now = datetime\.utcnow\(\)
                try:
                    last = datetime\.fromisoformat\(t\["last_tick"\]\)
                except:
                    continue
                dt = \(now - last\)\.total_seconds\(\)
                new_elapsed = t\["elapsed_seconds"\] \+ dt
                if new_elapsed >= t\["duration_seconds"\]:
                    db\.update_timer\(t\["id"\], \{"is_running": 0, "elapsed_seconds": t\["duration_seconds"\]\}\)
                    finished\.append\(\{"timer_name": t\["name"\], "operation_name": op\["name"\], "timer_id": t\["id"\]\}\)
                else:
                    db\.update_timer\(t\["id"\], \{"elapsed_seconds": new_elapsed, "last_tick": now\.isoformat\(\)\}\)
    return \{"finished": finished\}'''

new_check_timers = '''@app.get("/api/timers/check")
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
            
    return {"finished": finished}'''

app_content = re.sub(old_check_timers, new_check_timers, app_content)

# Replace other excepts in app.py
app_content = re.sub(r'except:\n\s+raise HTTPException\(401, "Invalid token"\)', r'except Exception as e:\n        logger.warning(f"Token error: {e}")\n        raise HTTPException(401, "Invalid token")', app_content)
app_content = re.sub(r'except:\n\s+raise HTTPException\(401, "Invalid signature"\)', r'except Exception as e:\n        logger.warning(f"Signature error: {e}")\n        raise HTTPException(401, "Invalid signature")', app_content)
app_content = re.sub(r'except:\n\s+raise HTTPException\(401, "Invalid payload"\)', r'except Exception as e:\n        logger.warning(f"Payload error: {e}")\n        raise HTTPException(401, "Invalid payload")', app_content)
app_content = re.sub(r'except Exception:\n\s+raise HTTPException\(401, "Invalid payload"\)', r'except Exception as e:\n        logger.warning(f"Payload error: {e}")\n        raise HTTPException(401, "Invalid payload")', app_content)
app_content = re.sub(r'except:\n\s+raise HTTPException\(400, "Error importing data"\)', r'except Exception as e:\n        logger.error(f"Import error: {e}")\n        raise HTTPException(400, "Error importing data")', app_content)

with open(app_path, "w") as f:
    f.write(app_content)

print("app.py updated.")
