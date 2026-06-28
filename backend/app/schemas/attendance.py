from pydantic import BaseModel, Field, UUID4, ConfigDict
from typing import Optional
from datetime import datetime

class AttendanceRecordBase(BaseModel):
    semester: str = Field(default="Current Semester", min_length=1, max_length=50)
    subject_code: Optional[str] = Field(None, max_length=50)
    subject_name: str = Field(..., min_length=1, max_length=255)
    hours_conducted: float = Field(default=0.0, ge=0.0)
    hours_attended: float = Field(default=0.0, ge=0.0)
    target_percentage: float = Field(default=75.0, ge=0.0, le=100.0)

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordUpdate(BaseModel):
    semester: Optional[str] = Field(None, min_length=1, max_length=50)
    subject_code: Optional[str] = Field(None, max_length=50)
    subject_name: Optional[str] = Field(None, min_length=1, max_length=255)
    hours_conducted: Optional[float] = Field(None, ge=0.0)
    hours_attended: Optional[float] = Field(None, ge=0.0)
    target_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)

class AttendanceRecordOut(AttendanceRecordBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttendanceLogOut(BaseModel):
    id: UUID4
    record_id: UUID4
    date: str
    status: str

class AttendanceStatsOut(BaseModel):
    total_hours_conducted: float
    total_hours_attended: float
    overall_percentage: float
    total_subjects: int
    subjects_at_risk: int

class TrendDataPoint(BaseModel):
    date: str
    attendance_percent: float

class SubjectAnalytics(BaseModel):
    record_id: UUID4
    subject_name: str
    current_percentage: float
    target_percentage: float
    streak: int
    classes_to_attend_for_target: int
    classes_can_miss_for_target: int
    trend_data: list[TrendDataPoint]

class AttendanceAnalyticsResponse(BaseModel):
    stats: AttendanceStatsOut
    subjects: list[SubjectAnalytics]
