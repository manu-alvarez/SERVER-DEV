"""Sandbox Docker para ejecución aislada de Python (execute_python)."""
import subprocess
import os
import tempfile
import uuid
from typing import Tuple, Optional

SANDBOX_IMAGE = "python:3.12-sandbox"
TIMEOUT_SECONDS = 30

def run_python_in_sandbox(code: str, timeout: int = TIMEOUT_SECONDS) -> Tuple[str, Optional[str]]:
    """Ejecuta código Python en un contenedor Docker aislado sin red."""
    container_name = f"iaprod-sandbox-{uuid.uuid4().hex[:8]}"
    try:
        # Escribir código a un archivo temporal
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, dir="/tmp") as f:
            f.write(code)
            script_path = f.name

        # Ejecutar en contenedor aislado (sin red, read-only filesystem excepto /tmp)
        result = subprocess.run(
            [
                "docker", "run", "--rm",
                "--name", container_name,
                "--network", "none",
                "--read-only",
                "--tmpfs", "/tmp:noexec,nosuid,size=100m",
                "--memory", "256m",
                "--cpus", "0.5",
                "-v", f"{script_path}:/script.py:ro",
                SANDBOX_IMAGE,
                "python3", "/script.py",
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        stdout = result.stdout or ""
        stderr = result.stderr or ""
        if result.returncode != 0:
            return stdout, f"Exit code {result.returncode}: {stderr}"
        return stdout, None
    except subprocess.TimeoutExpired:
        return "", f"Timeout después de {timeout}s"
    except FileNotFoundError:
        return "", "Docker no disponible en este entorno"
    except Exception as e:
        return "", str(e)
    finally:
        try:
            os.unlink(script_path)
        except Exception:
            pass
        try:
            subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
        except Exception:
            pass
