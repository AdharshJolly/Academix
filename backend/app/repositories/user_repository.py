"""
UserRepository
Data access layer for the users table.
"""
from app.schemas.auth import UserOut


class UserRepository:

    def get_by_id(self, user_id: str) -> UserOut:
        """Fetch user profile by ID. TODO: Implement Supabase query."""
        pass

    def get_by_email(self, email: str) -> UserOut:
        """Fetch user profile by email. TODO: Implement Supabase query."""
        pass

    def create(self, user_id: str, email: str, full_name: str) -> UserOut:
        """Create user profile after Supabase Auth registration. TODO: Implement."""
        pass

    def update(self, user_id: str, data: dict) -> UserOut:
        """Update user profile fields. TODO: Implement Supabase update."""
        pass

