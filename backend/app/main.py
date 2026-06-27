"""
Academix FastAPI Application Entry Point
Architecture: v1.2 (Frozen)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, tasks, intelligence, automations, calendar, attendance
from app.core.settings import settings

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
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str):
    user = verify_ws_token(token)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = user["id"]
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception:
        manager.disconnect(user_id)

