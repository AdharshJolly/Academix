import os
import sys
import uuid
from datetime import datetime, timedelta

# Add backend to path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.db.client import get_supabase
from app.repositories.user_repository import UserRepository
from app.repositories.task_repository import TaskRepository

def seed_demo_data(email: str):
    print(f"[*] Seeding demo data for user: {email}")
    user_repo = UserRepository()
    task_repo = TaskRepository()
    
    # 1. Check if user exists
    user = user_repo.get_by_email(email)
    if not user:
        print(f"[!] Error: User with email '{email}' not found. Please register first.")
        return
        
    user_id = user.id
    print(f"[+] Found user: {user.full_name} ({user_id})")
    
    # 2. Update Profile to look realistic
    print("[*] Updating academic profile...")
    user_repo.update(user_id, {
        "academic_year": "Junior",
        "major": "Computer Science",
        "gpa": "3.8",
        "study_hours": "15",
        "primary_objective": "Prepare for FAANG internships and maintain high GPA",
        "learning_protocols": ["Feynman Technique", "Pomodoro (50/10)", "Spaced Repetition"]
    })
    
    # 3. Create realistic tasks
    print("[*] Generating sample tasks...")
    now = datetime.now()
    
    tasks_to_create = [
        {
            "title": "CS 301: Final Project Proposal",
            "description": "Submit a 2-page proposal for the distributed systems final project.",
            "status": "in_progress",
            "priority": "high",
            "due_date": (now + timedelta(days=2)).isoformat()
        },
        {
            "title": "MATH 201: Problem Set 8",
            "description": "Chapters 4.3 to 4.5. Focus on eigenvectors.",
            "status": "pending",
            "priority": "medium",
            "due_date": (now + timedelta(days=4)).isoformat()
        },
        {
            "title": "Register for Next Semester Courses",
            "description": "Registration opens at 8am. Need to snipe CS 440.",
            "status": "pending",
            "priority": "high",
            "due_date": (now + timedelta(days=5)).isoformat()
        },
        {
            "title": "PHYS 101: Lab Report",
            "description": "Thermodynamics lab write-up. Needs graph.",
            "status": "pending",
            "priority": "low",
            "due_date": (now + timedelta(days=7)).isoformat()
        },
        {
            "title": "Apply for Summer Internships",
            "description": "Send resume to 5 more companies.",
            "status": "pending",
            "priority": "medium",
            "due_date": (now + timedelta(days=14)).isoformat()
        }
    ]
    
    created_count = 0
    for task_data in tasks_to_create:
        try:
            task_repo.create(user_id=user_id, task_data=task_data)
            created_count += 1
        except Exception as e:
            print(f"[!] Failed to create task '{task_data['title']}': {e}")
            
    print(f"[+] Successfully seeded {created_count} tasks!")
    print("\n[✓] Done. You can now refresh the app dashboard.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_demo_data.py <user_email>")
        print("Example: python seed_demo_data.py demo@example.com")
        sys.exit(1)
        
    target_email = sys.argv[1]
    seed_demo_data(target_email)
