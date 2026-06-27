import pytest
from unittest.mock import patch

class TestDashboardAPI:
    def test_get_dashboard_returns_full_dashboard_response(self, client, auth_headers, mock_supabase):
        # We need to mock the various repository calls that happen inside the dashboard endpoint.
        # Since we are mocking the db client, we can just return empty arrays for tasks, etc.
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        dashboard_data = data["data"]
        assert "academic_health" in dashboard_data
        assert "upcoming_deadlines" in dashboard_data
        assert "crunch_windows" in dashboard_data
        assert "today_schedule" in dashboard_data
        assert "calendar_preview" in dashboard_data
        assert "recent_automations" in dashboard_data

    def test_create_study_session_success(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "s1", "user_id": "test-user-id", "duration_minutes": 60, "title": "Math Study"}
        ]
        # mock user hours update
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"study_hours": 10.0}
        ]
        
        response = client.post("/api/v1/dashboard/study-sessions", json={"duration_minutes": 60, "title": "Math Study"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True
