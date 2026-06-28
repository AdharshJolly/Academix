import pytest
import os
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum!!"
os.environ["SUPABASE_URL"] = "https://fake.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "fake-service-role-key"
os.environ["GROQ_API_KEY"] = "fake-groq-key"
os.environ["WEBHOOK_SECRET"] = "fake-webhook-secret"

@pytest.fixture
def mock_supabase():
    """Function-scoped mock Supabase client."""
    mock = MagicMock()
    # Default table chain: .table().select().eq().execute() => data=[]
    mock.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    mock.table.return_value.insert.return_value.execute.return_value.data = []
    mock.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    mock.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
    return mock

@pytest.fixture
def client(mock_supabase):
    import app.db.client
    app.db.client._client = mock_supabase
    
    with patch("app.services.groq_client.Groq"):
        from app.main import app
        return TestClient(app)

@pytest.fixture
def auth_token():
    from app.core.security import create_access_token
    return create_access_token("test-user-id", "test@example.com")

@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

@pytest.fixture
def expired_token():
    from datetime import datetime, timedelta, timezone
    from jose import jwt
    payload = {"sub": "test-user-id", "email": "test@example.com",
               "exp": datetime.now(timezone.utc) - timedelta(hours=1)}
    return jwt.encode(payload, os.environ["SECRET_KEY"], algorithm="HS256")
