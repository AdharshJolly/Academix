"""
Task Schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = "medium"  # low | medium | high | urgent


class TaskUpdate(BaseModel):
    """All fields optional for partial updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None     # pending | in_progress | completed | cancelled
    priority: Optional[str] = None   # low | medium | high | urgent


class TaskResponse(BaseModel):
    """Task representation returned to the client."""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[date] = None
    created_at: str
    updated_at: str

