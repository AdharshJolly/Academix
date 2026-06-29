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


def get_supabase_admin() -> Client:
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

class ScopedTable:
    """
    Helper to automatically scope all DB operations to a specific user_id.
    Prevents leaking data across users.
    """
    def __init__(self, table_name: str, user_id: str):
        self.db = get_supabase_admin()
        self.table_name = table_name
        self.user_id = user_id

    def select(self, *columns, **kwargs):
        return self.db.table(self.table_name).select(*columns, **kwargs).eq("user_id", self.user_id)

    def insert(self, data, **kwargs):
        if isinstance(data, dict):
            data["user_id"] = self.user_id
        elif isinstance(data, list):
            for item in data:
                item["user_id"] = self.user_id
        return self.db.table(self.table_name).insert(data, **kwargs)

    def update(self, data, **kwargs):
        return self.db.table(self.table_name).update(data, **kwargs).eq("user_id", self.user_id)

    def delete(self, **kwargs):
        return self.db.table(self.table_name).delete(**kwargs).eq("user_id", self.user_id)
