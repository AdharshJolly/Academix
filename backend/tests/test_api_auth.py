class TestHealthCheck:
    def test_health_returns_200(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

class TestRegistration:
    def test_register_creates_user_and_returns_token(self, client, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
            "id": "new-uuid", "email": "new@student.com", "full_name": "New Student", "whatsapp_number": "1234567890",
            "google_calendar_connected": False, "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"
        }]
        r = client.post("/api/v1/auth/register", json={"email": "new@student.com", "password": "SecurePass123", "full_name": "New Student", "whatsapp_number": "1234567890"})
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert "token" in body["data"]

    def test_register_duplicate_email_returns_400(self, client, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "existing-user", "email": "taken@student.com", "full_name": "Existing User"}
        ]
        r = client.post("/api/v1/auth/register", json={"email": "taken@student.com", "password": "pass", "full_name": "Test", "whatsapp_number": "1234567890"})
        assert r.status_code == 400

    def test_register_missing_email_returns_422(self, client):
        r = client.post("/api/v1/auth/register", json={"password": "pass", "full_name": "Test"})
        assert r.status_code == 422

class TestAuthentication:
    def test_protected_route_without_token_returns_401(self, client):
        r = client.get("/api/v1/tasks")
        assert r.status_code == 401

    def test_protected_route_with_expired_token_returns_401(self, client, expired_token):
        r = client.get("/api/v1/tasks", headers={"Authorization": f"Bearer {expired_token}"})
        assert r.status_code == 401

    def test_protected_route_with_garbage_token_returns_401(self, client):
        r = client.get("/api/v1/tasks", headers={"Authorization": "Bearer not.a.real.token"})
        assert r.status_code == 401

    def test_protected_route_with_valid_token_passes_auth(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        r = client.get("/api/v1/tasks", headers=auth_headers)
        assert r.status_code != 401
