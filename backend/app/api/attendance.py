from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.attendance import AttendanceRecordOut, AttendanceRecordCreate, AttendanceRecordUpdate
from app.core.security import verify_token
from app.schemas.common import APIResponse
from app.schemas.auth import UserOut
from app.repositories.attendance_repository import AttendanceRepository
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/attendance", tags=["Attendance"])

from app.api.dependencies import get_attendance_repo

@router.get("", response_model=APIResponse[List[AttendanceRecordOut]])
async def get_attendance_records(
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Get all attendance records for the current user."""
    try:
        records = repo.get_by_user(str(current_user["id"]))
        return APIResponse(
            success=True,
            message="Attendance records fetched successfully",
            data=records
        )
    except Exception as e:
        logger.error(f"Error fetching attendance records: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=APIResponse[AttendanceRecordOut])
async def create_attendance_record(
    record: AttendanceRecordCreate,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Create a new attendance tracking record."""
    try:
        created_record = repo.create(str(current_user["id"]), record)
        return APIResponse(
            success=True,
            message="Attendance record created successfully",
            data=created_record
        )
    except Exception as e:
        logger.error(f"Error creating attendance record: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{record_id}", response_model=APIResponse[AttendanceRecordOut])
async def update_attendance_record(
    record_id: str,
    record: AttendanceRecordUpdate,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Update an existing attendance record (e.g. logging hours)."""
    try:
        updated_record = repo.update(record_id, str(current_user["id"]), record)
        if not updated_record:
            raise HTTPException(status_code=404, detail="Attendance record not found or not owned by user")
            
        return APIResponse(
            success=True,
            message="Attendance record updated successfully",
            data=updated_record
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating attendance record: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{record_id}", response_model=APIResponse[None])
async def delete_attendance_record(
    record_id: str,
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Delete an attendance record."""
    try:
        success = repo.delete(record_id, str(current_user["id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Attendance record not found or not owned by user")
            
        return APIResponse(
            success=True,
            message="Attendance record deleted successfully",
            data=None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attendance record: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
