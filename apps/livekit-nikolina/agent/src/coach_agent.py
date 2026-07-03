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
)
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins.google.realtime import RealtimeModel

# Load environment variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("it-coach-agent")
logging.basicConfig(level=logging.INFO)

def prewarm(proc: JobProcess):
    proc.userdata["model"] = RealtimeModel(
        model="gemini-3.1-flash-live-preview",
        instructions=(
            "You are an expert IT English Teacher. Your name is Nikolina. "
            "You are conducting a speaking practice session with a student. "
            "Speak clearly and professionally. If the user makes a grammar mistake or mispronounces something, "
            "politely correct them and explain why. Keep your answers concise to maintain a conversation."
        ),
        voice="Aoede",
        temperature=0.6,
    )

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    agent = Agent(
        model=ctx.proc.userdata["model"]
    )
    
    session = AgentSession(agent)
    
    logger.info("Starting AgentSession...")
    await session.start(agent=agent, room=ctx.room)

    _greeted = False

    async def send_initial_greeting():
        nonlocal _greeted
        if _greeted: return
        _greeted = True

        for attempt in range(1, 6):
            await asyncio.sleep(2.0 * attempt)
            if hasattr(session, 'is_running') and not session.is_running:
                continue
            
            logger.info("Sending proactive greeting...")
            try:
                await session.generate_reply(
                    instructions="Introduce yourself briefly as Nikolina, the IT English Coach. Ask the user if they are ready to start their speaking practice."
                )
                return
            except Exception as e:
                logger.warning(f"Greeting failed: {e}")

    @ctx.room.on("participant_connected")
    def on_participant_connected(participant):
        logger.info(f"Participant connected: {participant.identity}")
        asyncio.create_task(send_initial_greeting())

    if ctx.room.remote_participants:
        asyncio.create_task(send_initial_greeting())

    logger.info("Coach Nikolina is fully OPERATIONAL and listening")
    
    disconnect_event = asyncio.Event()
    ctx.room.on("disconnected", lambda: disconnect_event.set())
    await disconnect_event.wait()
    
if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            agent_name="it-coach-agent",
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            port=int(os.getenv("LIVEKIT_WORKER_PORT", 8082)),
        ),
    )
