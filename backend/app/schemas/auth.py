"""
Auth Schemas
Authentication uses Supabase Auth.
No custom JWT implementation.
"""
from pydantic import BaseModel, EmailStr


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    whatsapp_number: str


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Safe user representation — no sensitive fields."""
    id: str
    email: str
    full_name: str
    avatar_url: str | None = None
    google_calendar_connected: bool = False
    whatsapp_number: str | None = None
    academic_year: str | None = None
    major: str | None = None
    gpa: float | None = None
    study_hours: float | None = None
    primary_objective: str | None = None
    learning_protocols: list[str] | None = None
    telegram_chat_id: str | None = None
    telegram_username: str | None = None
    whatsapp_notifications_enabled: bool = True
    telegram_notifications_enabled: bool = False

    @classmethod
    def from_row(cls, row: dict) -> "UserOut":
        """Build UserOut safely from a database row, ignoring extra fields."""
        return cls(**row)

class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    whatsapp_number: str | None = None
    academic_year: str | None = None
    major: str | None = None
    gpa: float | None = None
    study_hours: float | None = None
    primary_objective: str | None = None
    learning_protocols: list[str] | None = None
    telegram_chat_id: str | None = None
    telegram_username: str | None = None
    whatsapp_notifications_enabled: bool | None = None
    telegram_notifications_enabled: bool | None = None


class AuthResponse(BaseModel):
    """Returned after successful login or registration."""
    token: str
    refresh_token: str | None = None
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str

