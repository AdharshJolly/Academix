import inspect
import logging
from functools import wraps
from typing import Callable, TypeVar

from fastapi import HTTPException

F = TypeVar("F", bound=Callable)


def handle_db_errors(operation_name: str) -> Callable[[F], F]:
    """Convert unexpected route errors into consistent HTTP 500 responses."""

    def decorator(func: F) -> F:
        logger = logging.getLogger(func.__module__)

        if inspect.iscoroutinefunction(func):

            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                try:
                    return await func(*args, **kwargs)
                except HTTPException:
                    raise
                except Exception as exc:
                    logger.error("%s error: %s", operation_name, exc)
                    raise HTTPException(
                        status_code=500,
                        detail=f"{operation_name} failed",
                    ) from exc

            return async_wrapper  # type: ignore[return-value]

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except HTTPException:
                raise
            except Exception as exc:
                logger.error("%s error: %s", operation_name, exc)
                raise HTTPException(
                    status_code=500,
                    detail=f"{operation_name} failed",
                ) from exc

        return sync_wrapper  # type: ignore[return-value]

    return decorator
