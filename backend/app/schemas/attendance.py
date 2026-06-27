from pydantic import BaseModel, Field, UUID4
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

    class Config:
        from_attributes = True
