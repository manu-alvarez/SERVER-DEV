"""Autenticación JWT para IA Prod OS."""
import os
import time
import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

SECRET_KEY = settings.JWT_SECRET_KEY or os.getenv("JWT_SECRET_KEY", "iaprod-local-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

security = HTTPBearer(auto_error=False)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = time.time() + (expires_delta or ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """Extrae usuario del header Authorization: Bearer <jwt> o del header x-api-key legado."""
    auth: Optional[HTTPAuthorizationCredentials] = await security(request)
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            return payload
    # Fallback legado: x-api-key (solo si IAPROD_API_KEY está definido)
    api_key = request.headers.get("x-api-key") or request.headers.get("X-API-KEY")
    if settings.IAPROD_API_KEY and api_key == settings.IAPROD_API_KEY:
        return {"sub": "admin", "role": "admin", "legacy": True}
    return None

def require_user(request: Request) -> Dict[str, Any]:
    """Dependencia que exige autenticación válida."""
    import asyncio
    try:
        user = asyncio.get_event_loop().run_until_complete(get_current_user(request))
    except RuntimeError:
        user = None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
