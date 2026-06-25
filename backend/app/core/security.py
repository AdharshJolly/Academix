"""
Security Utilities
Authentication is handled by Supabase Auth.
No custom JWT minting — only JWT verification via Supabase.
"""


def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase-issued JWT token.
    Returns the decoded payload including user_id.
    TODO: Implement Supabase token verification
    """
    pass


def get_current_user(token: str) -> dict:
    """
    FastAPI dependency: extract authenticated user from request.
    TODO: Implement as FastAPI Depends()
    """
    pass

