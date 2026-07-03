import os
import glob
import re

APPS_DIR = "/Users/manu/Desktop/SERVER-DEV/apps"

def process_python():
    # msbross
    msbross_path = os.path.join(APPS_DIR, "msbross/server.py")
    if os.path.exists(msbross_path):
        with open(msbross_path, "r") as f:
            content = f.read()
        content = content.replace(
            "with sqlite3.connect(DB_PATH) as conn:",
            "with sqlite3.connect(DB_PATH) as conn:\n        conn.execute(\"PRAGMA journal_mode=WAL;\")\n        conn.execute(\"PRAGMA synchronous=NORMAL;\")"
        )
        with open(msbross_path, "w") as f:
            f.write(content)
            
    # livekit
    livekit_path = os.path.join(APPS_DIR, "livekit-nikolina/server/src/core/database.py")
    if os.path.exists(livekit_path):
        with open(livekit_path, "r") as f:
            content = f.read()
        content = content.replace(
            "conn.row_factory = sqlite3.Row",
            "conn.row_factory = sqlite3.Row\n        conn.execute(\"PRAGMA journal_mode=WAL;\")\n        conn.execute(\"PRAGMA synchronous=NORMAL;\")"
        )
        with open(livekit_path, "w") as f:
            f.write(content)
            
    # iaputa-os
    iaputa_path = os.path.join(APPS_DIR, "iaputa-os/backend/app/application/use_cases/memory_service.py")
    if os.path.exists(iaputa_path):
        with open(iaputa_path, "r") as f:
            content = f.read()
        content = content.replace(
            "conn = sqlite3.connect(DB_PATH)",
            "conn = sqlite3.connect(DB_PATH)\n    conn.execute(\"PRAGMA journal_mode=WAL;\")\n    conn.execute(\"PRAGMA synchronous=NORMAL;\")"
        ).replace(
            "            conn = sqlite3.connect(DB_PATH)\n    conn.execute(\"PRAGMA journal_mode=WAL;\")\n    conn.execute(\"PRAGMA synchronous=NORMAL;\")",
            "            conn = sqlite3.connect(DB_PATH)\n            conn.execute(\"PRAGMA journal_mode=WAL;\")\n            conn.execute(\"PRAGMA synchronous=NORMAL;\")"
        )
        with open(iaputa_path, "w") as f:
            f.write(content)

def process_frontend():
    # We will look for localStorage.setItem in specific files found earlier
    targets = [
        "logisearch/src/lib/storage.ts",
        "logisearch/src/services/perplexity.ts",
        "edelweiss/src/hooks/useStats.js",
        "edelweiss/src/hooks/useConfig.js"
    ]
    for rel_path in targets:
        path = os.path.join(APPS_DIR, rel_path)
        if os.path.exists(path):
            with open(path, "r") as f:
                content = f.read()
            
            # Simple regex to wrap localStorage.setItem in try/catch if not already
            # Actually, just a simple line replacement is safer.
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if "localStorage.setItem(" in line and "try {" not in line:
                    indent = line[:len(line) - len(line.lstrip())]
                    lines[i] = indent + "try { " + line.lstrip() + " } catch(e) { console.warn('Storage disabled', e); }"
            
            with open(path, "w") as f:
                f.write('\n'.join(lines))

def remove_any():
    targets = [
        "it-english-coach-frontend/src/lib/llm.ts",
        "it-english-coach-frontend/src/views/TutorView.tsx",
        "iaputa-os/frontend/src/hooks/useCamera.ts"
    ]
    for rel_path in targets:
        path = os.path.join(APPS_DIR, rel_path)
        if os.path.exists(path):
            with open(path, "r") as f:
                content = f.read()
            
            content = content.replace("catch (e: any)", "catch (e)").replace("catch (err: any)", "catch (err)").replace("catch (fallbackErr: any)", "catch (fallbackErr)")
            with open(path, "w") as f:
                f.write(content)

process_python()
process_frontend()
remove_any()
print("Mega refactor done.")
