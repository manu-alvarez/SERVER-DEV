from pydantic import BaseModel
from typing import Optional

class UserMessage(BaseModel):
    text: str

class AIResponse(BaseModel):
    transcript: str
    response: str
    audio_url: Optional[str] = None
    vision_url: Optional[str] = None
    emotion: str = "neutral"
