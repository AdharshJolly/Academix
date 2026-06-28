from typing import List, Optional
import uuid
from app.db.client import get_supabase, ScopedTable
from app.schemas.attendance import AttendanceRecordCreate, AttendanceRecordUpdate

class AttendanceRepository:
    def __init__(self):
        self.table = "attendance_records"

    def get_by_user(self, user_id: str) -> List[dict]:
        db = ScopedTable(self.table, user_id)
        response = db.select("*").order("created_at", desc=True).execute()
        return response.data

    def get_by_id(self, record_id: str, user_id: str) -> Optional[dict]:
        db = ScopedTable(self.table, user_id)
        response = db.select("*").eq("id", record_id).single().execute()
        if not response.data:
            return None
        return response.data

    def create(self, user_id: str, data: AttendanceRecordCreate) -> dict:
        db = ScopedTable(self.table, user_id)
        record_data = data.model_dump()
        response = db.insert(record_data).execute()
        return response.data[0]

    def update(self, record_id: str, user_id: str, data: AttendanceRecordUpdate) -> Optional[dict]:
        db = ScopedTable(self.table, user_id)
        payload = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        if not payload:
            return self.get_by_id(record_id, user_id)
        
        payload["updated_at"] = "now()"
        response = db.update(payload).eq("id", record_id).execute()
        
        if not response.data:
            return None
        return response.data[0]

    def delete(self, record_id: str, user_id: str) -> bool:
        db = ScopedTable(self.table, user_id)
        response = db.delete().eq("id", record_id).execute()
        return len(response.data) > 0

    def get_stats(self, user_id: str) -> Optional[dict]:
        db = ScopedTable("user_attendance_stats", user_id)
        response = db.select("*").execute()
        if not response.data:
            return None
        return response.data[0]

    def get_logs(self, record_id: str, user_id: str) -> List[dict]:
        db = ScopedTable("attendance_logs", user_id)
        response = db.select("*").eq("record_id", record_id).order("date", desc=False).execute()
        return response.data
