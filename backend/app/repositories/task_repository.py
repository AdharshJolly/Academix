"""
TaskRepository
Data access layer for the tasks table.
Routers call this — never the database directly.
"""
import logging
from datetime import datetime, timezone
from app.db.client import get_supabase, ScopedTable
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskResponse
from app.core.cache import invalidate_dashboard_cache

logger = logging.getLogger(__name__)

TABLE = "tasks"


class TaskRepository:

    def get_all(
        self,
        user_id: str,
        page: int = 1,
        size: int = 20,
        status: str | None = None,
        priority: str | None = None,
    ) -> tuple[list[TaskResponse], int]:
        """
        Fetch paginated tasks for a user.
        Returns (tasks, total_count).
        """
        db = ScopedTable(TABLE, user_id)
        offset = (page - 1) * size

        query = db.select("*", count="exact").is_("deleted_at", "null")
        if status:
            query = query.eq("status", status)
        if priority:
            query = query.eq("priority", priority)

        response = (
            query.order("created_at", desc=True)
            .range(offset, offset + size - 1)
            .execute()
        )

        tasks = [TaskResponse(**row) for row in (response.data or [])]
        total = response.count or 0
        return tasks, total

    def get_by_id(self, task_id: str, user_id: str) -> TaskResponse | None:
        """Fetch a single task by ID, scoped to user."""
        db = ScopedTable(TABLE, user_id)
        response = (
            db.select("*")
            .eq("id", task_id)
            .is_("deleted_at", "null")
            .single()
            .execute()
        )
        if not response.data:
            return None
        return TaskResponse(**response.data)

    def create(self, user_id: str, data: TaskCreate) -> TaskResponse:
        """Insert a new task row and return the created record."""
        db = ScopedTable(TABLE, user_id)
        payload = {
            "title": data.title,
            "description": data.description,
            "due_date": data.due_date.isoformat() if data.due_date else None,
            "priority": data.priority or "medium",
            "status": "pending",
            "subject": data.subject,
        }
        response = db.insert(payload).execute()
        invalidate_dashboard_cache(user_id)
        return TaskResponse(**response.data[0])

    def update(
        self, task_id: str, user_id: str, data: TaskUpdate
    ) -> TaskResponse | None:
        """Update task fields. Only non-None fields are patched."""
        db = ScopedTable(TABLE, user_id)
        payload = {k: v for k, v in data.model_dump().items() if v is not None}
        if "due_date" in payload and payload["due_date"]:
            payload["due_date"] = str(payload["due_date"])
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = (
            db.update(payload)
            .eq("id", task_id)
            .execute()
        )
        if not response.data:
            return None
        invalidate_dashboard_cache(user_id)
        return TaskResponse(**response.data[0])

    def delete(self, task_id: str, user_id: str) -> bool:
        """Soft-delete a task. Returns True if a row was updated."""
        db = ScopedTable(TABLE, user_id)
        response = (
            db.update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", task_id)
            .execute()
        )
        if response.data:
            invalidate_dashboard_cache(user_id)
        return bool(response.data)

    def get_upcoming(self, user_id: str, limit: int = 5) -> list[TaskResponse]:
        """Fetch upcoming tasks (pending, ordered by due_date) for dashboard."""
        db = ScopedTable(TABLE, user_id)
        response = (
            db.select("*")
            .in_("status", ["pending", "in_progress"])
            .not_.is_("due_date", "null")
            .is_("deleted_at", "null")
            .order("due_date", desc=False)
            .limit(limit)
            .execute()
        )
        return [TaskResponse(**row) for row in (response.data or [])]
