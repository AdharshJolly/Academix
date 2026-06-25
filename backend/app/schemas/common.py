"""
Common Response Models
All API endpoints must return APIResponse[T] or PaginatedResponse[T].
No endpoint may invent a custom response shape.
"""
from pydantic import BaseModel
from typing import Any, Generic, List, Optional, TypeVar

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard wrapper for all single-resource API responses."""
    success: bool
    message: str
    data: Optional[T] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard wrapper for paginated list responses."""
    success: bool
    message: str
    data: List[T]
    total: int
    page: int
    size: int


class ErrorResponse(BaseModel):
    """Standard error shape returned on 4xx/5xx."""
    success: bool = False
    error_code: str  # e.g. VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND
    message: str

