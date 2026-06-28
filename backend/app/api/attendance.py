from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.attendance import AttendanceRecordOut, AttendanceRecordCreate, AttendanceRecordUpdate, AttendanceAnalyticsResponse
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

@router.get("/analytics", response_model=APIResponse[AttendanceAnalyticsResponse])
@handle_db_errors("Fetch attendance analytics")
def get_attendance_analytics(
    current_user: dict = Depends(verify_token),
    repo: AttendanceRepository = Depends(get_attendance_repo)
):
    """Get aggregate stats and subject-specific predictive analytics."""
    user_id = str(current_user["id"])
    stats = repo.get_stats(user_id)
    if not stats:
        stats = {
            "total_hours_conducted": 0,
            "total_hours_attended": 0,
            "overall_percentage": 0,
            "total_subjects": 0,
            "subjects_at_risk": 0
        }
    
    records = repo.get_by_user(user_id)
    subjects = []
    
    for r in records:
        logs = repo.get_logs(r["id"], user_id)
        
        streak = 0
        for log in reversed(logs):
            if log["status"] == "attended":
                streak += 1
            else:
                break
                
        current_percent = 0
        if r["hours_conducted"] > 0:
            current_percent = (r["hours_attended"] / r["hours_conducted"]) * 100
            
        target = r["target_percentage"]
        classes_needed = 0
        classes_can_miss = 0
        
        if current_percent < target and target < 100:
            diff = (r["hours_conducted"] * target - r["hours_attended"] * 100) / (100 - target)
            classes_needed = int(diff) + (1 if diff > int(diff) else 0)
        elif current_percent >= target and target > 0:
            diff = (r["hours_attended"] * 100 - r["hours_conducted"] * target) / target
            classes_can_miss = int(diff)
            
        subjects.append({
            "record_id": r["id"],
            "subject_name": r["subject_name"],
            "current_percentage": round(current_percent, 2),
            "target_percentage": target,
            "streak": streak,
            "classes_to_attend_for_target": max(0, classes_needed),
            "classes_can_miss_for_target": max(0, classes_can_miss),
            "trend_data": []
        })
        
    return APIResponse(
        success=True,
        message="Analytics fetched successfully",
        data={
            "stats": stats,
            "subjects": subjects
        }
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
