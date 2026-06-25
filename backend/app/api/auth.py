"""
Auth Router
Custom email/password authentication — no Supabase Auth.
Passwords are bcrypt-hashed and stored in the public.users table.
JWTs are minted by our own security module.
"""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.integrations.calendar import GoogleCalendarClient
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, UserLoginRequest, UserOut, UserRegisterRequest
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
user_repo = UserRepository()
calendar_client = GoogleCalendarClient()


@router.post("/register", response_model=APIResponse[AuthResponse])
async def register(request: UserRegisterRequest):
    """
    Register a new student account.
    1. Check email is not already taken
    2. Hash password and store in users table
    3. Return JWT + user profile
    """
    try:
        # Check duplicate email
        existing = user_repo.get_by_email(request.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )

        user_id = str(uuid.uuid4())
        password_hash = hash_password(request.password)

        user_profile = user_repo.create(
            user_id=user_id,
            email=request.email,
            full_name=request.full_name,
            password_hash=password_hash,
            whatsapp_number=request.whatsapp_number,
        )

        token = create_access_token(user_id=user_id, email=request.email)

        return APIResponse(
            success=True,
            message="Registration successful",
            data=AuthResponse(token=token, user=user_profile),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=APIResponse[AuthResponse])
async def login(request: UserLoginRequest):
    """
    Authenticate a student with email + password.
    Returns our own signed JWT on success.
    """
    try:
        user = user_repo.get_by_email_with_password(request.email)

        if not user or not verify_password(request.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_access_token(user_id=user["id"], email=user["email"])

        user_profile = UserOut(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            avatar_url=user.get("avatar_url"),
            google_calendar_connected=user.get("google_calendar_connected", False),
            whatsapp_number=user.get("whatsapp_number"),
        )

        return APIResponse(
            success=True,
            message="Login successful",
            data=AuthResponse(token=token, user=user_profile),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed. Check credentials.",
        )


@router.get("/google/connect", response_model=APIResponse[dict])
def connect_google_calendar(user: dict = Depends(verify_token)):
    """Return the Google OAuth URL for connecting the user's calendar."""
    try:
        authorization_url = calendar_client.build_authorization_url(state=user["id"])
        return APIResponse(
            success=True,
            message="Google Calendar authorization URL generated",
            data={"authorization_url": authorization_url},
        )
    except Exception as e:
        logger.error(f"Google OAuth URL error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start Google Calendar OAuth: {str(e)}",
        )


@router.get("/google/callback")
def google_calendar_callback(code: str, state: str):
    """Exchange Google OAuth code for a refresh token, save it, then redirect to frontend."""
    from fastapi.responses import RedirectResponse
    from app.core.settings import settings

    frontend_url = settings.FRONTEND_URL or "https://campus-flow-six-rho.vercel.app"

    try:
        refresh_token = calendar_client.exchange_code_for_refresh_token(code)
        user_repo.save_google_refresh_token(user_id=state, refresh_token=refresh_token)
        return RedirectResponse(url=f"{frontend_url}/settings?google_connected=true")
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        return RedirectResponse(url=f"{frontend_url}/settings?google_error={str(e)}")
