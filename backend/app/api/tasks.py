"""
Tasks Router
CRUD operations for academic tasks.
All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.rate_limit import limiter

from app.core.security import verify_token
from app.core.utils import handle_db_errors
from app.repositories.task_repository import TaskRepository
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.tasks import TaskCreate, TaskResponse, TaskUpdate, StudySessionCreate
from app.services.automation_service import AutomationService
from app.api.dependencies import get_task_repo, get_automation_service
from app.db.client import get_supabase

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=PaginatedResponse[TaskResponse])
@limiter.limit("60/minute")
def get_tasks(
    request_obj: Request,
    page: int = 1,
    size: int = 20,
    status: str | None = None,
    priority: str | None = None,
    user: dict = Depends(verify_token),
    task_repo: TaskRepository = Depends(get_task_repo),
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


@router.post("", response_model=APIResponse[TaskResponse])
@handle_db_errors("Create task")
@limiter.limit("30/minute")
def create_task(
    request: TaskCreate,
    request_obj: Request,
    user: dict = Depends(verify_token),
    task_repo: TaskRepository = Depends(get_task_repo),
    automation_service: AutomationService = Depends(get_automation_service),
):
    """Create a new academic task."""
    task = task_repo.create(user_id=user["id"], data=request)
    automation_service.run_for_task(
        user_id=user["id"],
        task=task,
        add_to_calendar=request.add_to_calendar,
        reminder_time=request.reminder_time
    )
    return APIResponse(success=True, message="Task created", data=task)


@router.get("/{task_id}", response_model=APIResponse[TaskResponse])
def get_task(
    task_id: str,
    user: dict = Depends(verify_token),
    task_repo: TaskRepository = Depends(get_task_repo),
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
    task_repo: TaskRepository = Depends(get_task_repo),
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
    task_repo: TaskRepository = Depends(get_task_repo),
):
    """Delete a task by ID."""
    deleted = task_repo.delete(task_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return APIResponse(success=True, message="Task deleted", data=None)

@router.post("/{task_id}/study-sessions", response_model=APIResponse[dict])
@handle_db_errors("Log study session")
def create_study_session(
    task_id: str,
    request: StudySessionCreate,
    user: dict = Depends(verify_token),
    task_repo: TaskRepository = Depends(get_task_repo),
):
    """Log a completed focus timer study session."""
    # Ensure task exists and belongs to user
    task = task_repo.get_by_id(task_id, user["id"])
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db = get_supabase()
    session_data = {
        "user_id": user["id"],
        "task_id": task_id,
        "title": request.title or task.title,
        "duration_minutes": request.duration_minutes
    }
    res = db.table("study_sessions").insert(session_data).execute()

    hours = request.duration_minutes / 60.0
    db.rpc("increment_study_hours", {"p_user_id": user["id"], "hours": hours}).execute()

    return APIResponse(success=True, message="Study session logged", data=res.data[0] if res.data else None)
