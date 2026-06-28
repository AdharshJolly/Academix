import pytest
from unittest.mock import patch
from app.core.settings import settings

class TestAutomationsAPI:
    def test_list_automation_logs_returns_list(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [
            {"id": "a1", "workflow_type": "schedule", "status": "success", "triggered_at": "2026-06-28T12:00:00Z", "completed_at": "2026-06-28T12:01:00Z", "payload": {}, "response": {}}
        ]
        response = client.get("/api/v1/automations/logs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["workflow_type"] == "schedule"

    def test_trigger_automation_creates_log(self, client, auth_headers, mock_supabase):
        # mock insert to return a row with id
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{"id": "log123"}]
        
        response = client.post("/api/v1/automations/trigger/schedule", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["log_id"] == "log123"
        assert data["data"]["type"] == "schedule"

    def test_test_telegram_connection_success(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        response = client.post("/api/v1/automations/test-telegram", json={"telegram_username": "@testuser"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_test_telegram_connection_fails_without_username(self, client, auth_headers):
        response = client.post("/api/v1/automations/test-telegram", json={}, headers=auth_headers)
        assert response.status_code == 200 # App logic returns 200 with success=False
        assert response.json()["success"] is False
