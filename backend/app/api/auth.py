"""
Auth Router
User registration and login via Supabase Auth.
No custom JWT — tokens are issued and verified by Supabase.
"""
import logging
from fastapi import APIRouter, HTTPException, status

from app.db.client import get_supabase
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, UserLoginRequest, UserOut, UserRegisterRequest
from app.schemas.common import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
user_repo = UserRepository()


@router.post("/register", response_model=APIResponse[AuthResponse])
def register(request: UserRegisterRequest):
    """
    Register a new student account.
    1. Creates Supabase Auth user
    2. Creates public user profile in users table
    3. Returns JWT token + user profile
    """
    try:
        db = get_supabase()
        auth_response = db.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {"full_name": request.full_name}
            },
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed. Email may already be registered.",
            )

        supabase_user = auth_response.user
        token = auth_response.session.access_token

        # Create or update user profile in public.users
        user_profile = user_repo.upsert(
            user_id=supabase_user.id,
            email=request.email,
            full_name=request.full_name,
        )

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
def login(request: UserLoginRequest):
    """
    Authenticate a student and return a Supabase JWT.
    Token must be passed as Authorization: Bearer <token> on all protected requests.
    """
    try:
        db = get_supabase()
        auth_response = db.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        supabase_user = auth_response.user
        token = auth_response.session.access_token

        # Fetch or upsert the user profile
        user_profile = user_repo.upsert(
            user_id=supabase_user.id,
            email=supabase_user.email,
            full_name=supabase_user.user_metadata.get("full_name", "Student"),
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
