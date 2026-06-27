from typing import List, Optional
import uuid
from app.db.client import get_supabase_client
from app.schemas.attendance import AttendanceRecordCreate, AttendanceRecordUpdate

class AttendanceRepository:
    def __init__(self):
        self.client = get_supabase_client()
        self.table = "attendance_records"

    def get_by_user(self, user_id: str) -> List[dict]:
        response = self.client.table(self.table)\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .execute()
        return response.data

    def get_by_id(self, record_id: str, user_id: str) -> Optional[dict]:
        response = self.client.table(self.table)\
            .select("*")\
            .eq("id", record_id)\
            .eq("user_id", user_id)\
            .execute()
        if not response.data:
            return None
        return response.data[0]

    def create(self, user_id: str, data: AttendanceRecordCreate) -> dict:
        record_data = data.model_dump()
        record_data["user_id"] = user_id
        response = self.client.table(self.table)\
            .insert(record_data)\
            .execute()
        return response.data[0]

    def update(self, record_id: str, user_id: str, data: AttendanceRecordUpdate) -> Optional[dict]:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return self.get_by_id(record_id, user_id)
            
        update_data["updated_at"] = "now()"
        response = self.client.table(self.table)\
            .update(update_data)\
            .eq("id", record_id)\
            .eq("user_id", user_id)\
            .execute()
            
        if not response.data:
            return None
        return response.data[0]

    def delete(self, record_id: str, user_id: str) -> bool:
        response = self.client.table(self.table)\
            .delete()\
            .eq("id", record_id)\
            .eq("user_id", user_id)\
            .execute()
        return len(response.data) > 0
