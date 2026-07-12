from fastapi import WebSocket
import json
from typing import Dict, Any
import asyncio

class ConnectionManager:
    def __init__(self):
        # Maps node_id to WebSocket connection
        self.active_nodes: Dict[str, WebSocket] = {}
        # Stores pending responses from nodes
        self.pending_responses: Dict[str, asyncio.Future] = {}

    async def connect(self, websocket: WebSocket, node_id: str):
        await websocket.accept()
        self.active_nodes[node_id] = websocket

    def disconnect(self, node_id: str):
        if node_id in self.active_nodes:
            del self.active_nodes[node_id]

    def get_connected_nodes(self):
        return list(self.active_nodes.keys())

    async def send_command_to_node(self, node_id: str, action: str, payload: dict) -> dict:
        """Sends a command to a specific node and waits for its response."""
        websocket = self.active_nodes.get(node_id)
        if not websocket:
            return {"status": "error", "message": f"Node {node_id} is not connected."}

        import uuid
        task_id = str(uuid.uuid4())
        
        message = {
            "task_id": task_id,
            "action": action,
            "payload": payload
        }
        
        # Create a future to wait for the response
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self.pending_responses[task_id] = future

        try:
            await websocket.send_text(json.dumps(message))
            # Wait for the node to respond (with a timeout of 30 seconds)
            response = await asyncio.wait_for(future, timeout=30.0)
            return response
        except asyncio.TimeoutError:
            return {"status": "error", "message": f"Timeout waiting for node {node_id} to respond."}
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            if task_id in self.pending_responses:
                del self.pending_responses[task_id]

    async def handle_node_response(self, task_id: str, response: dict):
        """Called when a node replies to a command."""
        future = self.pending_responses.get(task_id)
        if future and not future.done():
            future.set_result(response)

node_manager = ConnectionManager()
