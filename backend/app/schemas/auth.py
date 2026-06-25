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


class AuthResponse(BaseModel):
    """Returned after successful login or registration."""
    token: str
    user: UserOut

