import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv("/Users/manu/Desktop/CuentosMagicos_AI/.env", override=True)

async def test():
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"Testing OpenAI key: {api_key[:15]}...")
    client = AsyncOpenAI(api_key=api_key)
    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input="Hola, esto es una prueba del sistema de narración de alta fidelidad.",
            speed=0.9,
            response_format="mp3"
        )
        print(f"Success! Audio length: {len(response.content)} bytes")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
