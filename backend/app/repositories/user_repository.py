"""
UserRepository
Data access layer for the users table.
Used after Supabase Auth creates the auth.users record.
"""
import logging
from app.db.client import get_supabase
from app.schemas.auth import UserOut

logger = logging.getLogger(__name__)

TABLE = "users"


class UserRepository:

    def get_by_id(self, user_id: str) -> UserOut | None:
        """Fetch user profile by Supabase auth UUID."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return UserOut(**response.data)

    def get_by_email(self, email: str) -> UserOut | None:
        """Fetch user profile by email address."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return UserOut(**response.data)

    def create(self, user_id: str, email: str, full_name: str) -> UserOut:
        """
        Create the public user profile after Supabase Auth registration.
        The user_id must match the Supabase auth.users UUID.
        """
        db = get_supabase()
        payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
        }
        response = db.table(TABLE).insert(payload).execute()
        return UserOut(**response.data[0])

    def update(self, user_id: str, data: dict) -> UserOut | None:
        """Partial update of user profile fields."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .update(data)
            .eq("id", user_id)
            .execute()
        )
        if not response.data:
            return None
        return UserOut(**response.data[0])

    def get_automation_profile(self, user_id: str) -> dict | None:
        """Fetch only fields needed by automation services."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("id, google_refresh_token, google_calendar_connected, whatsapp_number")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return response.data or None

    def save_google_refresh_token(self, user_id: str, refresh_token: str) -> None:
        """Persist a user's Google Calendar refresh token."""
        db = get_supabase()
        db.table(TABLE).update({
            "google_refresh_token": refresh_token,
            "google_calendar_connected": True,
        }).eq("id", user_id).execute()

    def upsert(self, user_id: str, email: str, full_name: str, whatsapp_number: str = None) -> UserOut:
        """
        Insert or update user profile — safe to call after every login.
        Prevents duplicate errors if profile already exists.
        """
        db = get_supabase()
        payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
        }
        if whatsapp_number:
            payload["whatsapp_number"] = whatsapp_number
        response = (
            db.table(TABLE)
            .upsert(payload, on_conflict="id")
            .execute()
        )
        return UserOut(**response.data[0])
