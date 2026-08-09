"""
Restaurante Atenea — FastAPI Backend
Serves menu, reservations, and restaurant info for the Atenea web experience.
"""

import os
import sys
import logging
from datetime import datetime
from typing import Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import db

load_dotenv()

logger = logging.getLogger("atenea-server")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Restaurante Atenea API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.manuelalvarez\.dev|https://.*\.msbross\.me|http://localhost:\d+",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReservationCreate(BaseModel):
    customer_name: str
    customer_phone: str = ""
    date: str
    time: str
    num_guests: int = 2
    notes: str = ""


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "atenea-backend", "timestamp": datetime.now().isoformat()}


@app.get("/api/restaurant")
def get_restaurant():
    return db.get_restaurant_info()


@app.get("/api/menu")
def get_menu(category: Optional[str] = None, available_only: bool = True):
    return db.get_menu(category=category, available_only=available_only)


@app.get("/api/reservations")
def get_reservations(date: Optional[str] = None):
    return db.get_reservations(date=date)


@app.post("/api/reservations")
def create_reservation(res: ReservationCreate):
    try:
        return db.create_reservation(
            customer_name=res.customer_name,
            date=res.date,
            time=res.time,
            num_guests=res.num_guests,
            customer_phone=res.customer_phone,
            notes=res.notes,
            source="web",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/public/reservations")
def create_reservation_public(res: ReservationCreate):
    return create_reservation(res)


async def _dispatch_agent(url: str, key: str, secret: str, room: str) -> None:
    if not url:
        return
    http_url = url.replace("wss://", "https://").replace("ws://", "http://")
    try:
        from livekit.api import LiveKitAPI
        from livekit.api.agent_dispatch_service import CreateAgentDispatchRequest
        lkapi = LiveKitAPI(http_url, key, secret)
        dispatch_req = CreateAgentDispatchRequest()
        dispatch_req.agent_name = "msb-assistant"
        dispatch_req.room = room
        dispatch_req.metadata = ""
        await lkapi.agent_dispatch.create_dispatch(dispatch_req)
        await lkapi.aclose()
        logger.info(f"Agent dispatched to room '{room}'")
    except Exception as exc:
        logger.warning(f"Agent dispatch failed (may already be in room): {exc}")

@app.post("/api/public/token")
async def get_public_token(request: Request):
    """Returns a LiveKit token with protocol-negotiated WebSocket URL and dispatches the Agent."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="LiveKit not configured")

    livekit_url = os.getenv("LIVEKIT_URL")
    if not livekit_url:
        raise HTTPException(status_code=500, detail="LIVEKIT_URL not configured")

    from livekit.api import AccessToken, VideoGrants
    import json
    
    try:
        data = await request.json()
        caller_name = data.get("caller_name", "Cliente")
    except:
        caller_name = "Cliente"
        
    room_name = f"atenea-{os.urandom(4).hex()}"
    
    godmode_token = request.headers.get("x-godmode-token", "")
    custom_keys = request.headers.get("x-user-custom-keys", "")

    token = AccessToken(api_key, api_secret) \
        .with_identity(f"cliente-{os.urandom(4).hex()}") \
        .with_name(caller_name) \
        .with_grants(VideoGrants(room_join=True, room=room_name))
        
    metadata = {}
    if godmode_token:
        metadata["x-godmode-token"] = godmode_token
    if custom_keys:
        metadata["x-user-custom-keys"] = custom_keys
        
    if metadata:
        token = token.with_metadata(json.dumps(metadata))
        
    jwt = token.to_jwt()

    await _dispatch_agent(livekit_url, api_key, api_secret, room_name)

    return {
        "accessToken": jwt,
        "livekitUrl": livekit_url,
        "room": room_name
    }


from fastapi.staticfiles import StaticFiles

SERVE_FRONTEND = os.getenv("SERVE_FRONTEND", "true").lower() == "true"
if SERVE_FRONTEND:
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
    if os.path.isdir(frontend_dir):
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
        logger.info("Serving frontend from %s", frontend_dir)
    else:
        logger.warning("Frontend directory not found at %s", frontend_dir)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8009"))
    uvicorn.run(app, host="0.0.0.0", port=port)
