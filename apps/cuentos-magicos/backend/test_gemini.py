import os
import asyncio
import httpx
from dotenv import load_dotenv

async def test_gemini(env_path):
    load_dotenv(env_path, override=True)
    api_key = os.getenv("GOOGLE_API_KEY")
    voice = os.getenv("GEMINI_TTS_VOICE", "Puck")
    print(f"[{env_path}] Testing Google key: {api_key[:10]}... with voice: {voice}")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": "Hola, esto es una prueba de la narración de cuentos mágicos en alta fidelidad."}]
        }],
        "generationConfig": {
            "responseModalities": ["audio"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice
                    }
                }
            }
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    has_audio = False
                    for part in parts:
                        inline_data = part.get("inlineData", {})
                        if "data" in inline_data:
                            print(f"Success! Audio inline data size: {len(inline_data['data'])} chars")
                            has_audio = True
                            break
                    if not has_audio:
                        print("Response didn't contain inline audio data.")
                else:
                    print(f"No candidates found in response: {data}")
            else:
                print(f"Error response: {response.text}")
        except Exception as e:
            print(f"Error: {e}")

async def main():
    await test_gemini("/Users/manu/Desktop/CuentosMagicos_AI/backend/.env")
    await test_gemini("/Users/manu/Desktop/CuentosMagicos_AI/.env")

asyncio.run(main())
