"""
Security Utilities
Custom JWT authentication — no Supabase Auth dependency.
Passwords: SHA-256 pre-hash → bcrypt (eliminates the 72-byte bcrypt limit entirely).
Tokens: python-jose HS256 JWTs.
"""
import hashlib
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "changeme-very-secret-key-replace-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72   # 3 days

bcrypt_rounds = 12
bearer_scheme = HTTPBearer(auto_error=False)


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
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    """Mint a signed JWT containing user_id and email."""
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


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

    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
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

def verify_ws_token(token: str) -> dict:
    """Manually verify JWT token for WebSockets."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if not user_id:
            raise JWTError("Missing subject")
        return {"id": user_id, "email": email}
    except Exception as e:
        return None
