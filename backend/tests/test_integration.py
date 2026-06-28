import pytest
import os
import requests
from app.db.client import get_supabase

# Skip integration tests unless explicitly enabled
pytestmark = pytest.mark.skipif(
    os.environ.get("TEST_INTEGRATION") != "1",
    reason="Integration tests require a running local Supabase instance. Set TEST_INTEGRATION=1"
)

def test_supabase_connection():
    """Verify that we can actually connect to the local Supabase stack."""
    supabase = get_supabase()
    
    # Try fetching a row from a core table (e.g., users)
    # This tests that the URL, anon key, and REST API are functioning
    response = supabase.table("users").select("id").limit(1).execute()
    
    # Assuming connection works, we expect a valid response object (even if empty)
    assert isinstance(response.data, list)

def test_pgvector_search_function_exists():
    """Verify that the match_documents function exists for vector search."""
    supabase = get_supabase()
    
    # We test calling the RPC function. 
    # If it fails due to invalid signature, we know the migration wasn't applied.
    # An empty or error response (e.g. from missing query_embedding) is fine, 
    # as long as it's not a 404 Function Not Found.
    try:
        response = supabase.rpc("match_documents", {
            "query_embedding": [0.0] * 384,
            "match_threshold": 0.5,
            "match_count": 5,
            "p_user_id": "00000000-0000-0000-0000-000000000000"
        }).execute()
        assert isinstance(response.data, list)
    except Exception as e:
        # We fail the test if the error is about the function not existing
        if "Could not find the function" in str(e) or "404" in str(e):
            pytest.fail(f"match_documents RPC function is missing: {e}")
