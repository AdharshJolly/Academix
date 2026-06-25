"""
Tasks Router
CRUD operations for academic tasks.
All endpoints require authentication.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verify_token
from app.repositories.task_repository import TaskRepository
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.tasks import TaskCreate, TaskResponse, TaskUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["tasks"])
task_repo = TaskRepository()


@router.get("/", response_model=PaginatedResponse[TaskResponse])
def get_tasks(
    page: int = 1,
    size: int = 20,
    status: str | None = None,
    priority: str | None = None,
    user: dict = Depends(verify_token),
):
    """List all tasks for the authenticated user with optional filters."""
    tasks, total = task_repo.get_all(
        user_id=user["id"],
        page=page,
        size=size,
        status=status,
        priority=priority,
    )
    return PaginatedResponse(
        success=True,
        message="Tasks retrieved",
        data=tasks,
        total=total,
        page=page,
        size=size,
    )


@router.post("/", response_model=APIResponse[TaskResponse])
def create_task(
    request: TaskCreate,
    user: dict = Depends(verify_token),
):
    """Create a new academic task."""
    try:
        task = task_repo.create(user_id=user["id"], data=request)
        return APIResponse(success=True, message="Task created", data=task)
    except Exception as e:
        logger.error(f"Create task error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}",
        )


@router.get("/{task_id}", response_model=APIResponse[TaskResponse])
def get_task(
    task_id: str,
    user: dict = Depends(verify_token),
):
    """Get a single task by ID."""
    task = task_repo.get_by_id(task_id, user["id"])
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return APIResponse(success=True, message="Task retrieved", data=task)


@router.put("/{task_id}", response_model=APIResponse[TaskResponse])
def update_task(
    task_id: str,
    request: TaskUpdate,
    user: dict = Depends(verify_token),
):
    """Update an existing task. Only provided fields are changed."""
    task = task_repo.update(task_id, user["id"], request)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return APIResponse(success=True, message="Task updated", data=task)


@router.delete("/{task_id}", response_model=APIResponse[None])
def delete_task(
    task_id: str,
    user: dict = Depends(verify_token),
):
    """Delete a task by ID."""
    deleted = task_repo.delete(task_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return APIResponse(success=True, message="Task deleted", data=None)
