from app.repositories.task_repository import TaskRepository
from app.repositories.intelligence_repository import IntelligenceRepository
from app.repositories.automation_repository import AutomationRepository
from app.repositories.chat_repository import ChatRepository
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.services.automation_service import AutomationService

def get_task_repo() -> TaskRepository:
    return TaskRepository()

def get_intelligence_repo() -> IntelligenceRepository:
    return IntelligenceRepository()

def get_automation_repo() -> AutomationRepository:
    return AutomationRepository()

def get_chat_repo() -> ChatRepository:
    return ChatRepository()

def get_intelligence_engine() -> AcademicIntelligenceEngine:
    return AcademicIntelligenceEngine()

def get_automation_service() -> AutomationService:
    return AutomationService()
