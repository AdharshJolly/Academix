"""
Supabase Database Client
Initializes a single shared Supabase client instance.
Uses the service role key — never expose this to the frontend.

NOTE: This project intentionally does NOT use an ORM (like SQLAlchemy) or db/models.py.
Repositories use the raw Supabase client to fetch and insert raw Python dictionaries, 
and type safety is enforced at the API boundary using Pydantic schemas in app/schemas/.
"""
from supabase import create_client, Client
from app.core.settings import settings

_client: Client | None = None


def get_supabase() -> Client:
    """
    Return the shared Supabase client.
    Initializes on first call (lazy singleton).
    """
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
            )
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _client
