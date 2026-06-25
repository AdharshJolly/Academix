"""
UserRepository
Data access layer for the public.users table.
Handles all CRUD operations including password_hash storage.
"""
import logging
from app.db.client import get_supabase
from app.schemas.auth import UserOut

logger = logging.getLogger(__name__)

TABLE = "users"


class UserRepository:

    def get_by_id(self, user_id: str) -> UserOut | None:
        """Fetch user profile by UUID."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("id, email, full_name, avatar_url, google_calendar_connected, whatsapp_number, academic_year, major, gpa, study_hours, primary_objective, learning_protocols")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not response.data:
            return None
        return UserOut(**response.data)

    def get_by_email(self, email: str) -> UserOut | None:
        """Fetch safe user profile by email (no password_hash)."""
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("id, email, full_name, avatar_url, google_calendar_connected, whatsapp_number, academic_year, major, gpa, study_hours, primary_objective, learning_protocols")
            .eq("email", email)
            .execute()
        )
        if not response.data:
            return None
        return UserOut(**response.data[0])

    def get_by_email_with_password(self, email: str) -> dict | None:
        """
        Fetch full user row including password_hash.
        Only for use during login — never expose password_hash to the client.
        """
        db = get_supabase()
        response = (
            db.table(TABLE)
            .select("*")
            .eq("email", email)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(
        self,
        user_id: str,
        email: str,
        full_name: str,
        password_hash: str,
        whatsapp_number: str | None = None,
    ) -> UserOut:
        """
        Insert a new user row with a bcrypt-hashed password.
        """
        db = get_supabase()
        payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "password_hash": password_hash,
        }
        if whatsapp_number:
            payload["whatsapp_number"] = whatsapp_number

        response = db.table(TABLE).insert(payload).execute()
        row = response.data[0]
        return UserOut(
            id=row["id"],
            email=row["email"],
            full_name=row["full_name"],
            avatar_url=row.get("avatar_url"),
            google_calendar_connected=row.get("google_calendar_connected", False),
            whatsapp_number=row.get("whatsapp_number"),
            academic_year=row.get("academic_year"),
            major=row.get("major"),
            gpa=row.get("gpa"),
            study_hours=row.get("study_hours"),
            primary_objective=row.get("primary_objective"),
            learning_protocols=row.get("learning_protocols"),
        )

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
        row = response.data[0]
        return UserOut(
            id=row["id"],
            email=row["email"],
            full_name=row["full_name"],
            avatar_url=row.get("avatar_url"),
            google_calendar_connected=row.get("google_calendar_connected", False),
            whatsapp_number=row.get("whatsapp_number"),
            academic_year=row.get("academic_year"),
            major=row.get("major"),
            gpa=row.get("gpa"),
            study_hours=row.get("study_hours"),
            primary_objective=row.get("primary_objective"),
            learning_protocols=row.get("learning_protocols"),
        )

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
