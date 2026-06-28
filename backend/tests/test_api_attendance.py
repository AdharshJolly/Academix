import pytest

RECORD_ID = "11111111-1111-4111-8111-111111111111"
USER_ID = "22222222-2222-4222-8222-222222222222"


class TestAttendanceAPI:
    def test_get_attendance_records(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {
                "id": RECORD_ID,
                "user_id": USER_ID,
                "semester": "Fall 2026",
                "subject_code": "CS101",
                "subject_name": "Intro to CS",
                "hours_conducted": 10.0,
                "hours_attended": 8.0,
                "target_percentage": 75.0,
                "created_at": "2026-06-28T12:00:00Z",
                "updated_at": "2026-06-28T12:00:00Z",
            }
        ]
        
        response = client.get("/api/v1/attendance", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["subject_name"] == "Intro to CS"
        assert data["data"][0]["hours_conducted"] == 10.0
        assert data["data"][0]["hours_attended"] == 8.0

    def test_create_attendance_record(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {
                "id": RECORD_ID,
                "user_id": USER_ID,
                "semester": "Fall 2026",
                "subject_code": "MATH101",
                "subject_name": "Calculus",
                "hours_conducted": 5.0,
                "hours_attended": 5.0,
                "target_percentage": 75.0,
                "created_at": "2026-06-28T12:00:00Z",
                "updated_at": "2026-06-28T12:00:00Z",
            }
        ]

        payload = {
            "subject_name": "Calculus",
            "subject_code": "MATH101",
            "hours_conducted": 5.0,
            "hours_attended": 5.0
        }
        
        response = client.post("/api/v1/attendance", json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["subject_name"] == "Calculus"

    def test_update_attendance_record(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {
                "id": RECORD_ID,
                "user_id": USER_ID,
                "semester": "Fall 2026",
                "subject_code": "CS101",
                "subject_name": "Intro to CS",
                "hours_conducted": 12.0,
                "hours_attended": 8.0,
                "target_percentage": 75.0,
                "created_at": "2026-06-28T12:00:00Z",
                "updated_at": "2026-06-28T12:00:00Z",
            }
        ]

        payload = {
            "hours_conducted": 12.0
        }
        
        response = client.put(f"/api/v1/attendance/{RECORD_ID}", json=payload, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["hours_conducted"] == 12.0

    def test_delete_attendance_record(self, client, auth_headers, mock_supabase):
        mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": RECORD_ID}]
        
        response = client.delete(f"/api/v1/attendance/{RECORD_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
