import os
import pytest
from supabase import create_client, Client
import uuid

# These tests require a local Supabase instance running.
# Run `supabase start` and set run with:
# pytest tests/test_integration_rls.py

@pytest.fixture(scope="module")
def supabase_client():
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    # For RLS testing, we need the anon key to test Row Level Security
    key = os.environ.get("SUPABASE_KEY")
    
    if not key:
        pytest.skip("SUPABASE_KEY not set. Skipping integration tests.")
        
    return create_client(url, key)

@pytest.fixture(scope="module")
def admin_client():
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    service_role = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not service_role:
        pytest.skip("SUPABASE_SERVICE_ROLE_KEY not set.")
    return create_client(url, service_role)


def test_rls_tasks_table(supabase_client: Client, admin_client: Client):
    """Test that a user cannot see or edit another user's tasks."""
    
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())
    
    # 1. Admin creates tasks for both users (bypassing RLS)
    task1 = admin_client.table("tasks").insert({
        "user_id": user1_id,
        "title": "User 1 Task",
        "priority": "high",
        "subject": "CS101"
    }).execute()
    
    task2 = admin_client.table("tasks").insert({
        "user_id": user2_id,
        "title": "User 2 Task",
        "priority": "low"
    }).execute()
    
    task1_id = task1.data[0]["id"]
    task2_id = task2.data[0]["id"]
    
    # 2. Mock auth header for user 1 using PostgREST's set_config
    # In Supabase SDK, we can't easily mock auth.uid() for the anon client 
    # without a real JWT. Let's create a real JWT for user1.
    import jwt
    from datetime import datetime, timedelta, timezone
    
    jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    
    # Create valid Supabase JWT
    payload = {
        "sub": user1_id,
        "aud": "authenticated",
        "role": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1)
    }
    token = jwt.encode(payload, jwt_secret, algorithm="HS256")
    
    # Authenticate the client
    user1_client = supabase_client
    user1_client.postgrest.auth(token)
    
    # 3. Test Select RLS: User1 should only see their own task
    res = user1_client.table("tasks").select("*").execute()
    
    assert len(res.data) == 1
    assert res.data[0]["id"] == task1_id
    assert res.data[0]["title"] == "User 1 Task"
    
    # 4. Test Update RLS: User1 cannot update User2's task
    update_res = user1_client.table("tasks").update({"title": "Hacked"}).eq("id", task2_id).execute()
    assert len(update_res.data) == 0 # No rows updated
    
    # Verify it didn't change
    check = admin_client.table("tasks").select("title").eq("id", task2_id).execute()
    assert check.data[0]["title"] == "User 2 Task"
    
    # 5. Clean up
    admin_client.table("tasks").delete().in_("id", [task1_id, task2_id]).execute()
