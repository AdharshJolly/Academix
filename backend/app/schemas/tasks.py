"""
Task Schemas
"""
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date

TaskStatus = Literal["pending", "in_progress", "completed", "cancelled", "pending_review"]
TaskPriority = Literal["low", "medium", "high", "urgent"]


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: TaskPriority = "medium"
    add_to_calendar: Optional[bool] = True
    reminder_time: Optional[str] = "24h"
    status: TaskStatus = "pending"

class StudySessionCreate(BaseModel):
    duration_minutes: int
    title: Optional[str] = None


class TaskUpdate(BaseModel):
    """All fields optional for partial updates."""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    """Task representation returned to the client."""
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date] = None
    created_at: str
    updated_at: str

