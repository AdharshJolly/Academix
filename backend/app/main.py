"""
CampusFlow FastAPI Application Entry Point
Architecture: v1.2 (Frozen)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, tasks, intelligence, automations
from app.core.settings import settings

app = FastAPI(
    title="CampusFlow API",
    description="Autonomous Academic Copilot — Backend API",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# TODO: Configure CORS origins from settings
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


@app.get("/", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.2.0", "service": "CampusFlow API"}

