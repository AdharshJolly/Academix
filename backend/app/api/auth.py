"""
Auth Router
Custom email/password authentication — no Supabase Auth.
Passwords are bcrypt-hashed and stored in the public.users table.
JWTs are minted by our own security module.
"""

import logging
import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from app.core.cache import cache
from app.core.rate_limit import limiter

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    hash_password,
    verify_password,
    verify_token,
    revoke_token,
    bearer_scheme
)
from pydantic import BaseModel
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
def register(payload: UserRegisterRequest, request: Request, response: Response):
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

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30 * 24 * 60 * 60,
        )

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
def login(payload: UserLoginRequest, request: Request, response: Response):
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

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30 * 24 * 60 * 60,
        )

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
def refresh_token(request: Request, response: Response, payload: RefreshRequest | None = None):
    """
    Refresh the access token using a valid refresh token from cookie or payload.
    """
    try:
        # Check cookie first, fallback to payload for backward compatibility
        token_to_verify = request.cookies.get("refresh_token")
        if not token_to_verify and payload:
            token_to_verify = payload.refresh_token
            
        if not token_to_verify:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token missing.",
            )
            
        user_id = verify_refresh_token(token_to_verify)
        user = user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists.",
            )

        new_access_token = create_access_token(user_id=user["id"], email=user["email"])
        new_refresh_token = create_refresh_token(user_id=user["id"])

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=30 * 24 * 60 * 60,
        )

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


class LogoutRequest(BaseModel):
    refresh_token: str | None = None

from fastapi import Security
from fastapi.security import HTTPAuthorizationCredentials
@router.post("/logout", response_model=APIResponse[None])
def logout(
    request: Request,
    response: Response,
    payload: LogoutRequest | None = None,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme)
):
    """
    Invalidate both the access token and refresh token.
    """
    if credentials and credentials.credentials:
        revoke_token(credentials.credentials)

    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token and payload:
        refresh_token = payload.refresh_token

    if refresh_token:
        revoke_token(refresh_token)

    response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="none")

    return APIResponse(success=True, message="Successfully logged out", data=None)


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
    if not cache:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Redis is required for OAuth flows."
        )
    try:
        nonce = secrets.token_urlsafe(32)
        cache.setex(f"oauth_nonce:{nonce}", 900, user["id"])

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

    if not cache:
        logger.error("Redis is required for OAuth flows.")
        return RedirectResponse(url=f"{frontend_url}/settings?google_error=Server+Configuration+Error")

    user_id = cache.get(f"oauth_nonce:{state}")
    if user_id:
        cache.delete(f"oauth_nonce:{state}")

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
