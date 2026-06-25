"""
Tasks Router
CRUD operations for academic tasks.
"""
from fastapi import APIRouter
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskResponse
from app.schemas.common import APIResponse, PaginatedResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=PaginatedResponse[TaskResponse])
def get_tasks(page: int = 1, size: int = 20, status: str = None, priority: str = None):
    """List all tasks for the authenticated user. Supports pagination and filters."""
    # TODO: Call TaskRepository.get_all(user_id, page, size, status, priority)
    pass


@router.post("/", response_model=APIResponse[TaskResponse])
def create_task(request: TaskCreate):
    """Create a new academic task."""
    # TODO: Call TaskRepository.create(user_id, request)
    pass


@router.put("/{id}", response_model=APIResponse[TaskResponse])
def update_task(id: str, request: TaskUpdate):
    """Update an existing task by ID."""
    # TODO: Call TaskRepository.update(id, user_id, request)
    pass


@router.delete("/{id}", response_model=APIResponse[None])
def delete_task(id: str):
    """Delete a task by ID."""
    # TODO: Call TaskRepository.delete(id, user_id)
    pass

