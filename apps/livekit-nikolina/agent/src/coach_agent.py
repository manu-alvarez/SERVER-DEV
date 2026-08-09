"""
IT English Coach Agent — LiveKit Voice Agent

Uses Native Gemini Live API (RealtimeModel + VoiceAssistant) for sub-500ms latency.
"""

import os
import asyncio
import logging
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import google

# Load environment variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("it-coach-agent")
logging.basicConfig(level=logging.INFO)

COACH_INSTRUCTIONS = (
    "You are an expert IT English Teacher. Your name is Nikolina. "
    "You are conducting a speaking practice session with a student. "
    "Speak clearly and professionally. If the user makes a grammar mistake or mispronounces something, "
    "politely correct them and explain why. Keep your answers concise to maintain a conversation. "
    "Focus on IT vocabulary: software development, cloud computing, DevOps, networking, databases, "
    "and common workplace communication. Adapt your level to the student's proficiency."
)


def prewarm(proc: JobProcess):
    logger.info("IT Coach Agent prewarmed (pid=%s)", os.getpid())


async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    # We use SUBSCRIBE_ALL if we want video, otherwise AUDIO_ONLY is fine for English coach.
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)

    logger.info("Configuring RealtimeModel (Gemini 3.1 Live)...")
    from livekit.agents.voice import Agent, AgentSession
    
    # Native Speech-to-Speech Realtime Model
    model = google.realtime.RealtimeModel(
        model="gemini-2.5-flash-native-audio-preview-12-2025", 
        voice="Aoede",
        temperature=0.6,
    )

    # Init the Agent
    agent = Agent(
        instructions=COACH_INSTRUCTIONS,
        llm=model,
    )
    session = AgentSession()

    logger.info("Starting AgentSession...")
    asyncio.create_task(session.start(agent, room=ctx.room))
    
    logger.info("Coach Nikolina is fully OPERATIONAL and listening")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            agent_name="it-coach-agent",
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            port=int(os.getenv("LIVEKIT_WORKER_PORT", 8082)),
        ),
    )
