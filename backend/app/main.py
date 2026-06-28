"""
Academix FastAPI Application Entry Point
Architecture: v1.2 (Frozen)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, tasks, intelligence, automations, calendar, attendance
from app.core.settings import settings

missing_settings = settings.validate()
if missing_settings:
    raise RuntimeError(f"Missing critical environment variables: {', '.join(missing_settings)}")

from app.core.logging_setup import setup_logging
from asgi_correlation_id import CorrelationIdMiddleware

setup_logging()

from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.scheduler_jobs import send_weekly_attendance_check

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule the weekly check for Friday at 5:00 PM
    scheduler.add_job(
        send_weekly_attendance_check, 
        'cron', 
        day_of_week='fri', 
        hour=17, 
        minute=0,
        id='weekly_attendance'
    )
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="Academix API",
    description="Autonomous Academic Copilot — Backend API",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.api.intelligence import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(CorrelationIdMiddleware)

PREFIX = settings.API_V1_PREFIX  # /api/v1

app.include_router(auth.router,          prefix=PREFIX)
app.include_router(dashboard.router,     prefix=PREFIX)
app.include_router(tasks.router,         prefix=PREFIX)
app.include_router(intelligence.router,  prefix=PREFIX)
app.include_router(automations.router,   prefix=PREFIX)
app.include_router(calendar.router,      prefix=PREFIX)
app.include_router(attendance.router,    prefix=PREFIX)


@app.get("/", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.2.0", "service": "Academix API"}


from fastapi import WebSocket, WebSocketDisconnect
from app.core.ws_manager import manager
from app.core.security import verify_ws_token

import asyncio

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        token_msg = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
        token = token_msg.get("token") if isinstance(token_msg, dict) else None
        
        user = verify_ws_token(token) if token else None
        if not user:
            await websocket.close(code=1008)
            return

        user_id = user["id"]
        # Connect to manager but skip manager's internal accept
        if user_id not in manager.connections:
            manager.connections[user_id] = []
        manager.connections[user_id].append(websocket)
        
        while True:
            await websocket.receive_text()
    except Exception:
        if 'user_id' in locals():
            manager.disconnect(user_id, websocket)
        else:
            try:
                await websocket.close(code=1008)
            except:
                pass

