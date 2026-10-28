"""Rate limiting real con slowapi para IA Prod OS."""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return Response(
        content='{"error":"Too many requests, please try again later."}',
        status_code=429,
        media_type="application/json",
        headers={"Retry-After": str(int(exc.retry_after or 60))},
    )

def apply_rate_limiting(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
