import asyncio
import websockets
import json
import subprocess
import os
import platform

# Configuración del Nodo
NODE_ID = platform.node()  # Usa el hostname por defecto, ej. "MacBook-Manu"
SERVER_URL = "wss://api.manuelalvarez.dev/ws/nodes/"  # Cambiar a ws://localhost:8000 para dev local

async def execute_command(command: str) -> str:
    """Ejecuta un comando en el sistema local y devuelve la salida."""
    try:
        # Usar shell=True para permitir pipes y comandos complejos
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        output = stdout.decode()
        error = stderr.decode()
        
        if process.returncode == 0:
            return output if output else "Comando ejecutado con éxito (sin salida)."
        else:
            return f"Error (Código {process.returncode}):\n{error}\n{output}"
            
    except Exception as e:
        return f"Excepción al ejecutar comando: {e}"

async def listen():
    uri = f"{SERVER_URL}{NODE_ID}"
    print(f"[*] Conectando MSBrOSs Node [{NODE_ID}] a {uri}...")
    
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print(f"[+] Conectado y esperando comandos de la IA...")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        action = data.get("action")
                        task_id = data.get("task_id")
                        payload = data.get("payload", {})
                        
                        if action == "execute_shell":
                            command = payload.get("command", "")
                            print(f"[>] Ejecutando comando ordenado por la IA: {command}")
                            
                            result = await execute_command(command)
                            print(f"[<] Enviando resultado ({len(result)} bytes)...")
                            
                            response = {
                                "task_id": task_id,
                                "status": "success" if not result.startswith("Error") else "error",
                                "result": result
                            }
                            await websocket.send(json.dumps(response))
                            
                    except json.JSONDecodeError:
                        print("[-] Recibido mensaje no JSON:", message)
                    except Exception as e:
                        print(f"[-] Error procesando comando: {e}")
                        
        except Exception as e:
            print(f"[-] Conexión perdida o fallida: {e}. Reconectando en 5s...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(listen())
    except KeyboardInterrupt:
        print("\n[*] MSBrOSs Node apagado por el usuario.")
