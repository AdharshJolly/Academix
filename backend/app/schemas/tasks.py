"""
Task Schemas
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "medium"
    add_to_calendar: Optional[bool] = True
    reminder_time: Optional[str] = "24h"
    status: Optional[str] = "pending"

class StudySessionCreate(BaseModel):
    duration_minutes: int
    title: Optional[str] = None


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

