"""
Auth Router
Custom email/password authentication — no Supabase Auth.
Passwords are bcrypt-hashed and stored in the public.users table.
JWTs are minted by our own security module.
"""

import logging
import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.cache import cache
from app.core.rate_limit import limiter

_oauth_nonce_store = {}

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    hash_password,
    verify_password,
    verify_token,
)
from app.integrations.calendar import GoogleCalendarClient
from app.repositories.user_repository import UserRepository, row_to_user_out
from app.schemas.auth import (
    AuthResponse,
    RefreshRequest,
    UserLoginRequest,
    UserOut,
    UserRegisterRequest,
)
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
user_repo = UserRepository()
calendar_client = GoogleCalendarClient()


@router.post("/register", response_model=APIResponse[AuthResponse])
@limiter.limit("5/minute")
def register(payload: UserRegisterRequest, request: Request):
    """
    Register a new student account.
    1. Check email is not already taken
    2. Hash password and store in users table
    3. Return JWT + user profile
    """
    try:
        # Check duplicate email
        existing = user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )

        user_id = str(uuid.uuid4())
        password_hash = hash_password(payload.password)

        user_profile = user_repo.create(
            user_id=user_id,
            email=payload.email,
            full_name=payload.full_name,
            password_hash=password_hash,
            whatsapp_number=payload.whatsapp_number,
        )

        token = create_access_token(user_id=user_id, email=payload.email)
        refresh_token = create_refresh_token(user_id=user_id)

        return APIResponse(
            success=True,
            message="Registration successful",
            data=AuthResponse(token=token, refresh_token=refresh_token, user=user_profile),
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
@limiter.limit("10/minute")
def login(payload: UserLoginRequest, request: Request):
    """
    Authenticate a student with email + password.
    Returns our own signed JWT on success.
    """
    try:
        user = user_repo.get_by_email_with_password(payload.email)

        if not user or not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_access_token(user_id=user["id"], email=user["email"])
        refresh_token = create_refresh_token(user_id=user["id"])

        user_profile = row_to_user_out(user)
        return APIResponse(
            success=True,
            message="Login successful",
            data=AuthResponse(token=token, refresh_token=refresh_token, user=user_profile),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}",
        )


@router.post("/refresh", response_model=APIResponse[AuthResponse])
def refresh_token(request: RefreshRequest):
    """
    Refresh the access token using a valid refresh token.
    """
    try:
        user_id = verify_refresh_token(request.refresh_token)
        user = user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists.",
            )

        new_access_token = create_access_token(user_id=user["id"], email=user["email"])
        new_refresh_token = create_refresh_token(user_id=user["id"])

        user_profile = row_to_user_out(user)
        return APIResponse(
            success=True,
            message="Token refreshed successfully",
            data=AuthResponse(token=new_access_token, refresh_token=new_refresh_token, user=user_profile),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refresh failed: {str(e)}",
        )


from app.schemas.auth import UserProfileUpdate


@router.put("/profile", response_model=APIResponse[UserOut])
def update_profile(
    request: UserProfileUpdate,
    user: dict = Depends(verify_token),
):
    """Update user academic profile fields."""
    update_data = request.model_dump(exclude_none=True, exclude_unset=True)
    if not update_data:
        return APIResponse(
            success=True,
            message="No fields to update",
            data=user_repo.get_by_id(user["id"]),
        )

    updated_user = user_repo.update(user["id"], update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    return APIResponse(
        success=True,
        message="Profile updated successfully",
        data=updated_user,
    )


@router.get("/google/connect", response_model=APIResponse[dict])
def connect_google_calendar(user: dict = Depends(verify_token)):
    """Return the Google OAuth URL for connecting the user's calendar."""
    try:
        nonce = secrets.token_urlsafe(32)
        if cache:
            cache.setex(f"oauth_nonce:{nonce}", 900, user["id"])
        else:
            _oauth_nonce_store[nonce] = user["id"]

        authorization_url = calendar_client.build_authorization_url(state=nonce)
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

    frontend_url = settings.FRONTEND_URL or "http://localhost:3000"

    user_id = None
    if cache:
        user_id = cache.get(f"oauth_nonce:{state}")
        if user_id:
            cache.delete(f"oauth_nonce:{state}")
    else:
        user_id = _oauth_nonce_store.pop(state, None)

    if not user_id:
        logger.error("Invalid or expired OAuth state parameter.")
        return RedirectResponse(url=f"{frontend_url}/settings?google_error=Invalid+State")

    try:
        refresh_token = calendar_client.exchange_code_for_refresh_token(code)
        user_repo.save_google_refresh_token(user_id=user_id, refresh_token=refresh_token)
        return RedirectResponse(url=f"{frontend_url}/settings?google_connected=true")
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        return RedirectResponse(url=f"{frontend_url}/settings?google_error={str(e)}")
