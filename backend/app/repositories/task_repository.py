"""
TaskRepository
Data access layer for the tasks table.
Routers must never access the database directly.
"""
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskResponse


class TaskRepository:

    def get_all(self, user_id: str, page: int, size: int,
                status: str = None, priority: str = None) -> list[TaskResponse]:
        """Fetch paginated tasks for a user. TODO: Implement Supabase query."""
        pass

    def get_by_id(self, task_id: str, user_id: str) -> TaskResponse:
        """Fetch a single task by ID. TODO: Implement Supabase query."""
        pass

    def create(self, user_id: str, data: TaskCreate) -> TaskResponse:
        """Insert a new task. TODO: Implement Supabase insert."""
        pass

    def update(self, task_id: str, user_id: str, data: TaskUpdate) -> TaskResponse:
        """Update a task. TODO: Implement Supabase update."""
        pass

    def delete(self, task_id: str, user_id: str) -> None:
        """Delete a task. TODO: Implement Supabase delete."""
        pass

