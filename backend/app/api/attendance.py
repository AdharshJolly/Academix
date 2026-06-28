from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.attendance import AttendanceRecordOut, AttendanceRecordCreate, AttendanceRecordUpdate
from app.core.utils import handle_db_errors
from app.core.security import verify_token
from app.schemas.common import APIResponse
from app.repositories.attendance_repository import AttendanceRepository

router = APIRouter(prefix="/attendance", tags=["Attendance"])

from app.api.dependencies import get_attendance_repo

@router.get("", response_model=APIResponse[List[AttendanceRecordOut]])
@handle_db_errors("Fetch attendance records")
def get_attendance_records(
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Get all attendance records for the current user."""
    records = repo.get_by_user(str(current_user["id"]))
    return APIResponse(
        success=True,
        message="Attendance records fetched successfully",
        data=records
    )

@router.post("", response_model=APIResponse[AttendanceRecordOut])
@handle_db_errors("Create attendance record")
def create_attendance_record(
    record: AttendanceRecordCreate,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Create a new attendance tracking record."""
    created_record = repo.create(str(current_user["id"]), record)
    return APIResponse(
        success=True,
        message="Attendance record created successfully",
        data=created_record
    )

@router.put("/{record_id}", response_model=APIResponse[AttendanceRecordOut])
@handle_db_errors("Update attendance record")
def update_attendance_record(
    record_id: str,
    record: AttendanceRecordUpdate,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Update an existing attendance record (e.g. logging hours)."""
    updated_record = repo.update(record_id, str(current_user["id"]), record)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Attendance record not found or not owned by user")

    return APIResponse(
        success=True,
        message="Attendance record updated successfully",
        data=updated_record
    )

@router.delete("/{record_id}", response_model=APIResponse[None])
@handle_db_errors("Delete attendance record")
def delete_attendance_record(
    record_id: str,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Delete an attendance record."""
    success = repo.delete(record_id, str(current_user["id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Attendance record not found or not owned by user")

    return APIResponse(
        success=True,
        message="Attendance record deleted successfully",
        data=None
    )
