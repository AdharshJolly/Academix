import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_row_to_user_out_ignores_sensitive_fields_and_applies_defaults():
    from app.repositories.user_repository import row_to_user_out

    user = row_to_user_out(
        {
            "id": "user-1",
            "email": "student@example.com",
            "full_name": "Student One",
            "password_hash": "do-not-leak",
        }
    )

    assert user.id == "user-1"
    assert user.email == "student@example.com"
    assert not hasattr(user, "password_hash")
    assert user.google_calendar_connected is False
    assert user.whatsapp_notifications_enabled is True
    assert user.telegram_notifications_enabled is False


def test_handle_db_errors_wraps_sync_router_failures():
    from app.core.utils import handle_db_errors

    @handle_db_errors("Fetch attendance records")
    def failing_route():
        raise RuntimeError("database unavailable")

    with pytest.raises(HTTPException) as exc_info:
        failing_route()

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Fetch attendance records failed"


@pytest.mark.asyncio
async def test_handle_db_errors_wraps_async_router_failures():
    from app.core.utils import handle_db_errors

    @handle_db_errors("Process intelligence")
    async def failing_route():
        raise RuntimeError("database unavailable")

    with pytest.raises(HTTPException) as exc_info:
        await failing_route()

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == "Process intelligence failed"


def test_handle_db_errors_preserves_http_exceptions():
    from app.core.utils import handle_db_errors

    @handle_db_errors("Update attendance record")
    def missing_record():
        raise HTTPException(status_code=404, detail="Attendance record not found")

    with pytest.raises(HTTPException) as exc_info:
        missing_record()

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Attendance record not found"
