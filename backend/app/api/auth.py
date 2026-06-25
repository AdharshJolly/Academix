"""
Auth Router
Handles user registration and login via Supabase Auth.
Does NOT implement custom JWT — delegates to Supabase.
"""
from fastapi import APIRouter
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, AuthResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=APIResponse[AuthResponse])
def register(request: UserRegisterRequest):
    """Register a new student account via Supabase Auth."""
    # TODO: Call Supabase Auth API
    pass


@router.post("/login", response_model=APIResponse[AuthResponse])
def login(request: UserLoginRequest):
    """Authenticate and return a Supabase JWT token."""
    # TODO: Call Supabase Auth API
    pass

