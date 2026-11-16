import sys
import os
import uuid
sys.path.insert(0, os.path.abspath("backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system():
    r = client.get("/api/system/health")
    assert r.status_code == 200
    assert r.json()["status"] == "online"
    
    r2 = client.get("/api/system/db-status")
    assert r2.status_code == 200
    print("System health & DB status OK:", r2.json())

def test_auth_and_crud():
    # Login as default demo user
    r_login = client.post("/api/auth/login", json={
        "email": "alex.sterling@devmatrix.io",
        "password": "chronos2026password"
    })
    assert r_login.status_code == 200, r_login.text
    data = r_login.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Auth Login OK, user:", data["user"]["name"])

    # Test User Registration with custom names, email, and password
    test_user_email = f"engineer_{uuid.uuid4().hex[:6]}@devmatrix.io"
    r_reg = client.post("/api/auth/register", json={
        "name": "Jean Luc Mugisha",
        "email": test_user_email,
        "password": "securepassword123"
    })
    assert r_reg.status_code == 200, r_reg.text
    reg_data = r_reg.json()
    assert reg_data["user"]["name"] == "Jean Luc Mugisha"
    assert reg_data["user"]["email"] == test_user_email
    print(f"Registration OK: {reg_data['user']['name']} ({test_user_email})")

    # Test Forgot Password Recovery
    r_forgot = client.post("/api/auth/forgot-password", json={
        "email": test_user_email
    })
    assert r_forgot.status_code == 200, r_forgot.text
    forgot_data = r_forgot.json()
    recovery_code = forgot_data["code"]
    assert len(recovery_code) == 6
    print("Forgot Password request OK, recovery code:", recovery_code)

    # Test Reset Password with code and new password
    r_reset = client.post("/api/auth/reset-password", json={
        "email": test_user_email,
        "code": recovery_code,
        "new_password": "brandnewpassword456"
    })
    assert r_reset.status_code == 200, r_reset.text
    print("Reset Password OK:", r_reset.json()["message"])

    # Test Login with newly reset password
    r_login_new = client.post("/api/auth/login", json={
        "email": test_user_email,
        "password": "brandnewpassword456"
    })
    assert r_login_new.status_code == 200, r_login_new.text
    print("Login with updated password OK")

    # Get /me
    r_me = client.get("/api/auth/me", headers=headers)
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "alex.sterling@devmatrix.io"

    # Tasks CRUD
    r_tasks = client.get("/api/tasks", headers=headers)
    assert r_tasks.status_code == 200
    tasks = r_tasks.json()
    assert isinstance(tasks, list)
    print(f"Tasks list OK: {len(tasks)} tasks returned")

    # Create Task
    r_create_task = client.post("/api/tasks", headers=headers, json={
        "title": "Test Automated Architecture Task",
        "description": "Verification of FastAPI endpoint",
        "category": "Work",
        "priority": "Urgent",
        "status": "In Progress",
        "dueDate": "2026-11-20",
        "startTime": "10:00",
        "endTime": "11:00",
        "timeSpentSeconds": 120,
        "subtasks": [{"id": "st-1", "text": "Run unit tests", "completed": True}]
    })
    assert r_create_task.status_code == 200
    created_task = r_create_task.json()
    task_id = created_task["id"]
    print("Create task OK, ID:", task_id)

    # Accumulate time
    r_time = client.post(f"/api/tasks/{task_id}/time", headers=headers, json={"seconds": 60})
    assert r_time.status_code == 200
    assert r_time.json()["timeSpentSeconds"] == 180

    # Toggle task
    r_toggle = client.post(f"/api/tasks/{task_id}/toggle", headers=headers)
    assert r_toggle.status_code == 200
    assert r_toggle.json()["status"] == "Completed"

    # Routines CRUD
    r_create_rt = client.post("/api/routines", headers=headers, json={
        "title": "Morning Focus Protocol",
        "period": "Morning",
        "time": "06:30",
        "duration": 20,
        "completed": False,
        "streak": 3,
        "days": [1, 2, 3, 4, 5, 6, 7]
    })
    assert r_create_rt.status_code == 200
    created_rt = r_create_rt.json()
    rt_id = created_rt["id"]
    print(f"Routine create OK: {rt_id}")

    r_routines = client.get("/api/routines", headers=headers)
    assert r_routines.status_code == 200
    routines = r_routines.json()
    assert isinstance(routines, list)
    print(f"Routines list OK: {len(routines)} routines returned")

    # Toggle routine
    r_toggle_rt = client.post(f"/api/routines/{rt_id}/toggle", headers=headers)
    assert r_toggle_rt.status_code == 200
    print("Routine toggle OK")

    # Notes CRUD
    r_create_note = client.post("/api/notes", headers=headers, json={
        "title": "System Architecture Log",
        "content": "Verified full real-time database flow",
        "tags": ["Dev", "Architecture"],
        "pinned": True
    })
    assert r_create_note.status_code == 200
    created_note = r_create_note.json()
    note_id = created_note["id"]
    print(f"Note create OK: {note_id}")

    r_notes = client.get("/api/notes", headers=headers)
    assert r_notes.status_code == 200
    notes = r_notes.json()
    assert isinstance(notes, list)
    print(f"Notes list OK: {len(notes)} notes returned")

    # Analytics summary
    r_analytics = client.get("/api/analytics/summary", headers=headers)
    assert r_analytics.status_code == 200
    analytics_data = r_analytics.json()
    assert "productivityScore" in analytics_data
    print("Analytics score OK:", analytics_data["productivityScore"])

    # Analytics PDF export
    r_pdf = client.get("/api/analytics/export-pdf", headers=headers)
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert len(r_pdf.content) > 1000
    print(f"Analytics PDF export OK: {len(r_pdf.content)} bytes generated")

    # Notifications settings and test digest
    r_notif = client.get("/api/notifications/settings", headers=headers)
    assert r_notif.status_code == 200
    
    r_digest = client.post("/api/notifications/send-digest", headers=headers)
    assert r_digest.status_code == 200
    print("Notifications digest dispatch OK:", r_digest.json()["status"])

    # Delete test task, routine, and note
    r_del = client.delete(f"/api/tasks/{task_id}", headers=headers)
    assert r_del.status_code == 200
    r_del_rt = client.delete(f"/api/routines/{rt_id}", headers=headers)
    assert r_del_rt.status_code == 200
    r_del_note = client.delete(f"/api/notes/{note_id}", headers=headers)
    assert r_del_note.status_code == 200
    print("Cleaned up test task, routine, and note successfully")

if __name__ == "__main__":
    test_system()
    test_auth_and_crud()
    print("ALL BACKEND ENDPOINTS AND TESTS PASSED SUCCESSFULLY!")
