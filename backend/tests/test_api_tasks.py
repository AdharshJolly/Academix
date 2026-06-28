import pytest

class TestTasksAPI:
    def test_get_tasks_returns_list(self, client, auth_headers, mock_supabase):
        # Setup mock return data
        mock_supabase.table.return_value.select.return_value.eq.return_value.is_.return_value.order.return_value.range.return_value.execute.return_value.data = [
            {"id": "t1", "title": "Math Homework", "user_id": "test-user-id", "status": "pending", "priority": "high", "created_at": "2026-06-28", "updated_at": "2026-06-28"},
            {"id": "t2", "title": "Science Project", "user_id": "test-user-id", "status": "completed", "priority": "low", "created_at": "2026-06-28", "updated_at": "2026-06-28"}
        ]
        # Mock total count return
        mock_supabase.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value.data = [
            {"count": 2}
        ]
        
        response = client.get("/api/v1/tasks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2
        assert data["data"][0]["title"] == "Math Homework"

    def test_create_task_success(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "t3", "title": "New Task", "user_id": "test-user-id", "status": "pending", "priority": "medium", "created_at": "2026-06-28", "updated_at": "2026-06-28"}
        ]
        mock_supabase.table.return_value.insert.reset_mock()
        
        response = client.post("/api/v1/tasks", json={"title": "New Task"}, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "New Task"
        mock_supabase.table.return_value.insert.assert_called()

    def test_update_task_success(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": "t1", "title": "Updated Title", "user_id": "test-user-id", "status": "completed", "priority": "high", "created_at": "2026-06-28", "updated_at": "2026-06-28"}
        ]
        response = client.put("/api/v1/tasks/t1", json={"status": "completed", "title": "Updated Title"}, headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "completed"

    def test_update_task_not_found(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        response = client.put("/api/v1/tasks/missing-id", json={"status": "completed"}, headers=auth_headers)
        assert response.status_code == 404

    def test_delete_task_success(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": "t1", "title": "Deleted"}
        ]
        response = client.delete("/api/v1/tasks/t1", headers=auth_headers)
        assert response.status_code == 200

    def test_delete_task_not_found(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        response = client.delete("/api/v1/tasks/missing-id", headers=auth_headers)
        assert response.status_code == 404
