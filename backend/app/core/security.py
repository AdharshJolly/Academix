"""
Security Utilities
Custom JWT authentication — no Supabase Auth dependency.
Passwords: SHA-256 pre-hash → bcrypt (eliminates the 72-byte bcrypt limit entirely).
Tokens: python-jose HS256 JWTs.
"""
import hashlib
import logging
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from app.core.cache import cache

# ── Config ────────────────────────────────────────────────────────────────────
from app.core.settings import settings

SECRET_KEY = settings.SECRET_KEY
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable must be set.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72   # 3 days

bcrypt_rounds = 12
bearer_scheme = HTTPBearer(auto_error=False)

def blacklist_token(token: str, expire_seconds: int):
    """Add a token to the Redis blacklist until it naturally expires."""
    if not cache:
        return
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    # Add a small buffer to the expiration
    cache.setex(f"jwt_blacklist:{token_hash}", max(1, expire_seconds), "1")

def is_token_blacklisted(token: str) -> bool:
    """Check if a token has been blacklisted."""
    if not cache:
        return False
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return cache.exists(f"jwt_blacklist:{token_hash}") > 0

def revoke_token(token: str):
    """Decode a token without verification to get its expiration, then blacklist it."""
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get("exp")
        if exp:
            remaining = int(exp) - int(datetime.now(timezone.utc).timestamp())
            if remaining > 0:
                blacklist_token(token, remaining)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to revoke token: {e}")



def _sha256(plain: str) -> bytes:
    """SHA-256 of the plain password as bytes. Always 32 bytes → safe for bcrypt."""
    return hashlib.sha256(plain.encode("utf-8")).digest()


def hash_password(plain: str) -> str:
    """SHA-256 pre-hash then bcrypt. Immune to the 72-byte bcrypt limit."""
    return bcrypt.hashpw(_sha256(plain), bcrypt.gensalt(rounds=bcrypt_rounds)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify plain password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(_sha256(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str, email: str) -> str:
    """Mint a signed JWT containing user_id and email."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Mint a signed JWT refresh token for 30 days."""
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str) -> str:
    """Verify refresh token and return user_id."""
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if not user_id or token_type != "refresh":
            raise JWTError("Invalid token type or missing subject")
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired refresh token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> dict:
    """
    FastAPI dependency — verifies our own JWT from the Authorization header.
    Returns {"id": ..., "email": ...} on success.
    Raises 401 if missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = credentials.credentials
    if is_token_blacklisted(token_str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token_str, SECRET_KEY, algorithms=[ALGORITHM]
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if not user_id:
            raise JWTError("Missing subject")
        return {"id": user_id, "email": email}
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

logger = logging.getLogger(__name__)

def verify_ws_token(token: str) -> dict | None:
    """Manually verify JWT token for WebSockets."""
    if is_token_blacklisted(token):
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if not user_id:
            raise JWTError("Missing subject")
        return {"id": user_id, "email": email}
    except Exception as e:
        logger.warning(f"WebSocket token verification failed: {e}")
        return None
