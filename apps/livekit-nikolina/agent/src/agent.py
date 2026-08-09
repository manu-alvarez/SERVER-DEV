"""
MSB LiveKit Voice Assistant — Restaurant Reservation Agent

Multimodal voice agent powered by Gemini Live API (RealtimeModel + VoiceAssistant)
"""

import os
import asyncio
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
import json as _json

from dotenv import load_dotenv
import google.genai.types as gtypes

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import google

# Import shared core from the Server decouple
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../server/src')))
from core.database import db

# Load environment variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(dotenv_path=env_path)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FILE = os.path.join(os.path.dirname(__file__), "../agent.log")

formatter = logging.Formatter(LOG_FORMAT)
file_handler = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=2)
file_handler.setFormatter(formatter)
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)

logger = logging.getLogger("msb-assistant")
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(console_handler)

async def send_metadata(ctx: JobContext, metadata: dict):
    """Utility to send JSON metadata to the frontend via DataChannel."""
    try:
        import json as _json
        payload = _json.dumps(metadata).encode("utf-8")
        await ctx.room.local_participant.publish_data(payload, topic="lk-metadata")
    except Exception as e:
        logger.warning(f"Failed to send metadata: {e}")

async def get_summary(messages) -> str:
    """Generate a brief summary of the conversation."""
    if not messages:
        return "No hubo conversación."
    user_msgs = [m for m in messages if m["isUser"]]
    if not user_msgs:
        return "El usuario no habló."
    return f"Conversación con {len(messages)} mensajes. Último mensaje: {messages[-1]['message'][:50]}"

# ---------------------------------------------------------------------------
# Restaurant Agent Tools (Function Calling)
# ---------------------------------------------------------------------------
class RestaurantTools(llm.ToolContext):
    def __init__(self, ctx, session_state):
        super().__init__(tools=[])
        self.ctx = ctx
        self.session_state = session_state

    @llm.function_tool(description="Check table availability at the restaurant. Always use this BEFORE creating a reservation.")
    async def check_availability(self, date: str, time: str, num_guests: int) -> str:
        logger.info("Tool: check_availability(date=%s, time=%s, guests=%d)", date, time, num_guests)
        try:
            available_tables = db.check_availability(date, time, num_guests)
            if not available_tables:
                return f"Lo siento, no hay mesas disponibles para {num_guests} personas el {date} a las {time}."
            table = available_tables[0]
            return f"Sí, tenemos disponibilidad. Podemos ofrecerle la mesa {table['table_number']} en la zona de {table['location']}. ¿Desea que le reserve una?"
        except Exception as exc:
            logger.error("check_availability failed: %s", exc)
            return "Ha ocurrido un error al consultar la disponibilidad. Inténtelo de nuevo."

    @llm.function_tool(description="Create a table reservation at the restaurant. IMPORTANT: Always call check_availability first.")
    async def create_reservation(self, customer_name: str, date: str, time: str, num_guests: int, customer_phone: str = "", notes: str = "") -> str:
        logger.info("Tool: create_reservation(name=%s, date=%s, time=%s, guests=%d)", customer_name, date, time, num_guests)
        try:
            result = db.create_reservation(
                customer_name=customer_name, date=date, time=time, num_guests=num_guests,
                customer_phone=customer_phone, notes=notes, source="phone"
            )
            self.session_state["result"] = "Reserva"
            asyncio.create_task(send_metadata(self.ctx, {"mood": "happy"}))
            return f"Reserva confirmada. Número de reserva: {result['reservation_id']}. A nombre de {result['customer_name']}, el {result['date']} a las {result['time']}, para {result['num_guests']} personas, mesa {result['table_number']} ({result['table_location']}). Muchas gracias por confiar en nosotros."
        except ValueError as ve:
            return str(ve)
        except Exception as exc:
            logger.error("create_reservation failed: %s", exc)
            return "Lo siento, ha ocurrido un error al procesar su reserva. Por favor, inténtelo de nuevo en unos minutos."

    @llm.function_tool(description="Cancel an existing reservation. Can cancel by reservation ID, or by customer name and phone.")
    async def cancel_reservation(self, customer_name: str = "", customer_phone: str = "", reservation_id: int = 0) -> str:
        logger.info("Tool: cancel_reservation(name=%s, phone=%s, id=%d)", customer_name, customer_phone, reservation_id)
        try:
            rid = reservation_id if reservation_id > 0 else None
            success = db.cancel_reservation(reservation_id=rid, customer_name=customer_name or None, customer_phone=customer_phone or None)
            if success:
                self.session_state["result"] = "Cancelación"
                asyncio.create_task(send_metadata(self.ctx, {"mood": "calm"}))
                return "La reserva ha sido cancelada correctamente. ¿Puedo ayudarle en algo más?"
            return "No he encontrado ninguna reserva activa con esos datos. ¿Puede facilitarme el nombre o número de reserva?"
        except Exception as exc:
            logger.error("cancel_reservation failed: %s", exc)
            return "Ha ocurrido un error al cancelar la reserva."

    @llm.function_tool(description="Get general information about the restaurant: name, address, opening hours, cuisine type, and special features.")
    async def get_restaurant_info(self) -> str:
        logger.info("Tool: get_restaurant_info()")
        try:
            info = db.get_restaurant_info()
            if not info:
                return "No hay información del restaurante disponible en este momento."
            return f"Restaurante: {info['name']}. Dirección: {info['address']}. Cocina: {info['cuisine_type']}. {info['description']} Horario de comidas: {info['opening_time_lunch']} a {info['closing_time_lunch']}. Horario de cenas: {info['opening_time_dinner']} a {info['closing_time_dinner']}. Días abiertos: {info['days_open']}. Cerrado: {info['days_closed']}. {info.get('special_notes', '')}"
        except Exception as exc:
            logger.error("get_restaurant_info failed: %s", exc)
            return "Error al obtener la información del restaurante."

    @llm.function_tool(description="Look up existing reservations for a customer by their phone number. Use this when a customer wants to check, modify or confirm their reservation.")
    async def find_reservations(self, customer_phone: str) -> str:
        logger.info("Tool: find_reservations(phone=%s)", customer_phone)
        try:
            reservations = db.find_reservations_by_phone(customer_phone)
            if not reservations:
                return "No he encontrado reservas activas con ese número de teléfono."
            self.session_state["result"] = "Modificación"
            lines = [f"Reserva #{r['id']}: {r['customer_name']}, {r['date']} a las {r['time']}, {r['num_guests']} personas, mesa {r['table_number']}" for r in reservations]
            return "Reservas encontradas:\n" + "\n".join(lines)
        except Exception as exc:
            logger.error("find_reservations failed: %s", exc)
            return "Error al buscar las reservas."

    @llm.function_tool(description="Log a special request, preference, or note from the customer (e.g., 'mesa cerca de la ventana', 'alergia'). Use this as soon as the customer mentions any specific requirement to ensure it is recorded in the call log.")
    async def log_special_request(self, request: str) -> str:
        logger.info("Tool: log_special_request(request=%s)", request)
        self.session_state["notes"].append(request)
        return f"Nota registrada: {request}. Tendremos esto en cuenta."

    @llm.function_tool(description="Get the restaurant menu. Can optionally filter by category: 'entrante', 'principal', 'postre', 'bebida', 'tapa', 'especial'. Use this when a customer asks about the menu, dishes, prices, or allergens.")
    async def consultar_carta_restaurante(self, category: str = "") -> str:
        logger.info("Tool: consultar_carta_restaurante(category=%s)", category)
        asyncio.create_task(send_metadata(self.ctx, {"action": "show_menu"}))
        try:
            items = db.get_menu(category=category if category else None)
            if not items:
                return "No hay platos disponibles en este momento en esa categoría."
            current_category = ""
            lines = []
            for item in items:
                if item['category'] != current_category:
                    current_category = item['category']
                    lines.append(f"\n{current_category.capitalize()}:")
                allergen_info = f" [Alérgenos: {item['allergens']}]" if item['allergens'] else ""
                special = " ⭐ ESPECIAL" if item.get('is_daily_special') else ""
                lines.append(f"  - {item['name']}: {item['description']}. Precio: {item['price']:.2f}€{allergen_info}{special}")
            return "Carta del restaurante:\n" + "\n".join(lines)
        except Exception as exc:
            logger.error("consultar_carta_restaurante failed: %s", exc)
            return "Error al obtener la carta del restaurante."

    @llm.function_tool(description="Consult the internal restaurant manual / knowledge base (RAG). Use this if the customer asks about rules (dress code, pets, corkage fee), history of the restaurant, or policies not covered by general info.")
    async def consultar_conocimiento_restaurante(self, query: str) -> str:
        logger.info("Tool: consultar_conocimiento_restaurante(query=%s)", query)
        info = db.query_knowledge_base(query)
        if info:
            return info
        return "Según el manual del restaurante, no tengo una respuesta específica para esa consulta. Le sugiero que hable directamente con el encargado al (555) 123-456."

    @llm.function_tool(description="Use THIS tool ONLY to hang up, end, or terminate the call when the user says goodbye or no longer needs assistance.")
    async def end_call(self) -> str:
        logger.info("Tool: end_call() invoked. Disconnecting room...")
        asyncio.create_task(self.ctx.room.disconnect())
        return "Desconectando llamada..."

# ---------------------------------------------------------------------------
# System Instructions — Restaurant Personality
# ---------------------------------------------------------------------------
def build_system_prompt() -> str:
    """Build the system prompt dynamically from database config."""
    info = db.get_restaurant_info()
    name = info.get("name", "el restaurante")
    today = datetime.now().strftime("%Y-%m-%d")
    day_name = datetime.now().strftime("%A")

    day_map = {
        "Monday": "lunes", "Tuesday": "martes", "Wednesday": "miércoles",
        "Thursday": "jueves", "Friday": "viernes", "Saturday": "sábado", "Sunday": "domingo",
    }
    day_es = day_map.get(day_name, day_name)

    llm_config = db.get_llm_config()
    base_prompt = llm_config.get("system_prompt", "Eres el asistente telefónico automático del restaurante.")
    base_prompt = base_prompt.replace("{restaurant_name}", name)

    recent_calls = db.get_recent_calls(minutes=60)
    if recent_calls:
        memory_lines = [
            f"  - Llamada [{c.get('room_name', '')}]: {c.get('result', 'unknown')} ({c.get('duration_seconds', 0)}s). Resumen: {c.get('summary', 'Sin resumen')}"
            for c in recent_calls[:5]
        ]
        memory_block = "MEMORIA RECIENTE (llamadas última hora):\n" + "\n".join(memory_lines)
    else:
        memory_block = "MEMORIA RECIENTE: No ha habido llamadas en la última hora."

    return f"""{base_prompt}

INFORMACIÓN IMPORTANTE:
- Hoy es {day_es}, {today}.
- El restaurante sirve cocina {info.get('cuisine_type', 'mediterránea')}.
- Horario de comidas: {info.get('opening_time_lunch', '13:00')} a {info.get('closing_time_lunch', '16:00')}.
- Horario de cenas: {info.get('opening_time_dinner', '20:00')} a {info.get('closing_time_dinner', '23:30')}.
- Días cerrado: {info.get('days_closed', 'domingo')}.
- Máximo por mesa: {info.get('max_party_size', 10)} personas.

{memory_block}

REGLAS DE COMPORTAMIENTO:
1. Siempre habla en español, con tono cálido y profesional.
2. Tu nombre es Nikolina. Al contestar la llamada, SIEMPRE preséntate brevemente: "Hola, soy Nikolina, asistente virtual de {name}. ¿En qué puedo ayudarle?"
3. Si el cliente quiere reservar, pregunta: nombre, fecha, hora y número de comensales.
4. SIEMPRE consulta disponibilidad ANTES de confirmar una reserva (usa check_availability).
5. Confirma todos los datos antes de crear la reserva.
6. Si no hay disponibilidad, sugiere horarios alternativos cercanos.
7. Si preguntan por el menú, la carta o los platos, usa consultar_carta_restaurante.
8. Si preguntan por la dirección u horarios, usa get_restaurant_info.
9. Mantén las respuestas cortas y naturales — esto es una conversación telefónica.
10. No inventes información. Si no sabes algo, di que va a consultarlo con el personal.
11. Al despedirte, agradece la llamada y desea un buen día/noche.
12. IMPORTANTE: Si el cliente menciona alguna petición especial, preferencia de mesa, o alergia, usa el comando 'log_special_request' de inmediato para registrarlo."""

# ---------------------------------------------------------------------------
# LiveKit Agent Lifecycle
# ---------------------------------------------------------------------------
def prewarm(proc: JobProcess) -> None:
    logger.info("Worker process prewarmed (pid=%s)", os.getpid())

async def entrypoint(ctx: JobContext) -> None:
    try:
        logger.info(f"--- New Agent Session: {ctx.job.id} ---")
        await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)

        system_prompt = build_system_prompt()
        session_state = {
            "result": "Nula/Consulta",
            "notes": []
        }
        messages_history = []
        _greeted = False

        fnc_ctx = RestaurantTools(ctx, session_state)

        logger.info("Configuring RealtimeModel (Gemini 3.1 Live)...")

        # Wait for participant before setting up the model
        participant = await ctx.wait_for_participant()
        logger.info(f"Participant joined: {participant.identity if participant else 'unknown'}")

        from livekit.agents.voice import Agent, AgentSession
        
        # SDK auto-reads GOOGLE_API_KEY from env — do NOT pass api_key manually
        # Gemini Live uses a direct WebSocket to Google — do NOT proxy via http_options
        model = google.realtime.RealtimeModel(
            model="gemini-3.1-flash-live-preview", 
            voice="Puck",
            temperature=0.6,
            enable_affective_dialog=False,
            proactivity=False,
            thinking_config=gtypes.ThinkingConfig(thinkingLevel="minimal")
        )

        agent = Agent(
            instructions=system_prompt,
            llm=model,
            tools=fnc_ctx.flatten() if fnc_ctx else [],
        )
        session = AgentSession()

        # Hook up events
        @session.on("agent_speech_committed")
        def _on_agent_speech(msg):
            try:
                content = getattr(msg, "content", "")
                if isinstance(content, list):
                    content = " ".join([c.text for c in content if hasattr(c, "text")])
                elif not isinstance(content, str):
                    content = str(content)
                if not content.strip():
                    return
                messages_history.append({"isUser": False, "message": content})
                payload = _json.dumps({"id": str(id(msg)), "message": content, "isUser": False}).encode("utf-8")
                asyncio.create_task(ctx.room.local_participant.publish_data(payload, topic="lk-chat"))
            except Exception as e:
                logger.warning(f"Chat hook (agent) error: {e}")

        @session.on("user_speech_committed")
        def _on_user_speech(msg):
            try:
                content = getattr(msg, "content", "")
                if isinstance(content, list):
                    content = " ".join([c.text for c in content if hasattr(c, "text")])
                elif not isinstance(content, str):
                    content = str(content)
                if not content.strip():
                    return
                messages_history.append({"isUser": True, "message": content})
                payload = _json.dumps({"id": str(id(msg)), "message": content, "isUser": True}).encode("utf-8")
                asyncio.create_task(ctx.room.local_participant.publish_data(payload, topic="lk-chat"))
            except Exception as e:
                logger.warning(f"Chat hook (user) error: {e}")

        @ctx.room.on("data_received")
        def on_data_received(dp):
            if dp.topic == "lk-chat":
                try:
                    payload = _json.loads(dp.data.decode("utf-8"))
                    message = payload.get("message")
                    if message and payload.get("isUser") is not False:
                        messages_history.append({"isUser": True, "message": message})
                        # Optionally handle text message injection
                except Exception as e:
                    pass

        # Start Session
        logger.info("Starting AgentSession...")
        start_time = datetime.now()
        asyncio.create_task(session.start(agent, room=ctx.room))

        async def send_initial_greeting():
            nonlocal _greeted
            if _greeted: return
            _greeted = True
            # Wait a short bit before sending initial greeting
            await asyncio.sleep(2.0)
            logger.info(f"Nikolina sending proactive greeting...")
            # Not needed with google.realtime usually, but just in case:
            # We can rely on system instructions to greet or manually trigger.
            # agent.generate_reply() might not exist on VoiceAssistant, so we just let instructions handle it.

        if ctx.room.remote_participants:
            asyncio.create_task(send_initial_greeting())

        @ctx.room.on("participant_connected")
        def on_participant_connected(participant):
            logger.info(f"Participant connected: {participant.identity}")
            asyncio.create_task(send_initial_greeting())

        async def log_final_call():
            logger.info("Shutdown: logging call history with MSB Enhanced Tracking")
            try:
                end_time = datetime.now()
                duration = int((end_time - start_time).total_seconds())
                summary = await get_summary(messages_history)

                db.log_call(
                    room_name=ctx.room.name, 
                    result=session_state["result"], 
                    summary=summary,
                    notes=" | ".join(session_state["notes"]),
                    transcription="\n".join([f"{'Usuario' if m['isUser'] else 'Nikolina'}: {m['message']}" for m in messages_history]),
                    duration_seconds=max(0, duration)
                )
                logger.info(f"LOGGED: Result={session_state['result']}, Messages={len(messages_history)}")
            except Exception as e:
                logger.error(f"Failed to log call: {e}")

        ctx.add_shutdown_callback(log_final_call)

        logger.info("Nikolina is fully OPERATIONAL and listening")
        
        disconnect_event = asyncio.Event()
        ctx.room.on("disconnected", lambda: disconnect_event.set())
        await disconnect_event.wait()

    except Exception as exc:
        logger.error(f"CRITICAL ERROR in entrypoint: {exc}", exc_info=True)
    finally:
        logger.info("Agent process cleanup")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            agent_name="msb-assistant",
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            port=8085,
        ),
    )
