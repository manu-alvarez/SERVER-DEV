#!/usr/bin/env python3
"""LiteLLM Wake Endpoint - lightweight HTTP server to wake the proxy on demand."""
import http.server
import socketserver
import subprocess
import os
import json
import urllib.request
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 4001  # Different from LiteLLM port
HEALTH_URL = "http://localhost:4000/health"

class WakeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.respond(200, {"status": "awake"})
            return
            
        if self.path == '/wake':
            self.wake_proxy()
            return
            
        if self.path == '/status':
            self.send_status()
            return
            
        self.respond(404, {"error": "Not found"})
    
    def do_POST(self):
        if self.path == '/wake':
            self.wake_proxy()
            return
        self.respond(404, {"error": "Not found"})
    
    def wake_proxy(self):
        try:
            # Check if proxy is already running
            try:
                req = urllib.request.Request(HEALTH_URL)
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        self.respond(200, {"status": "already_awake", "action": "none"})
                        return
            except:
                pass
            
            # Start the proxy
            result = subprocess.run(
                ["docker", "compose", "up", "-d"],
                cwd=SCRIPT_DIR,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Wait for health
                import time
                for _ in range(15):
                    try:
                        req = urllib.request.Request(HEALTH_URL)
                        with urllib.request.urlopen(req, timeout=2) as resp:
                            if resp.status == 200:
                                self.respond(200, {"status": "awake", "action": "started", "timestamp": datetime.now().isoformat()})
                                return
                    except:
                        time.sleep(1)
                
                self.respond(200, {"status": "starting", "action": "started", "message": "Proxy started but not yet healthy"})
            else:
                self.respond(500, {"status": "error", "action": "failed", "error": result.stderr})
                
        except Exception as e:
            self.respond(500, {"status": "error", "error": str(e)})
    
    def send_status(self):
        try:
            # Check container status
            ps = subprocess.run(["docker", "ps", "--filter", f"name=litellm-proxy", "--format", "{{.Status}}"], 
                              capture_output=True, text=True)
            container_status = ps.stdout.strip() or "not running"
            
            # Check health
            health = "unknown"
            try:
                req = urllib.request.Request(HEALTH_URL)
                with urllib.request.urlopen(req, timeout=2) as resp:
                    health = "healthy" if resp.status == 200 else f"unhealthy ({resp.status})"
            except:
                health = "unreachable"
            
            self.respond(200, {
                "proxy": container_status,
                "health": health,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            self.respond(500, {"error": str(e)})
    
    def respond(self, code, data):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def run():
    with socketserver.TCPServer(("", PORT), WakeHandler) as httpd:
        print(f"Wake endpoint listening on port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run()
