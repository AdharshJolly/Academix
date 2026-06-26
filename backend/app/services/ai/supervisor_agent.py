import json
import logging
from app.services.groq_client import GroqClient
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import TaskCreate

logger = logging.getLogger(__name__)

class SupervisorAgent:
    """
    Agentic Orchestrator for CampusFlow.
    Uses Groq function calling to decide whether to extract notices, 
    generate schedules, or just chat.
    """
    def __init__(self):
        self.groq = GroqClient()
        self.intelligence = AcademicIntelligenceEngine()
        self.task_repo = TaskRepository()
        
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "extract_and_save_events",
                    "description": "Call this ONLY when the user sends an announcement, notice, syllabus, or deadline. It extracts the events and saves them to their calendar/task list.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "notice_text": {
                                "type": "string",
                                "description": "The raw text of the notice to process."
                            }
                        },
                        "required": ["notice_text"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_study_schedule",
                    "description": "Generates a study schedule for the user based on their current tasks.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "days_ahead": {
                                "type": "integer",
                                "description": "Number of days ahead to plan."
                            }
                        }
                    }
                }
            }
        ]
        
        self.system_prompt = (
            "You are the CampusFlow AI Coordinator, an intelligent student assistant. "
            "You receive messages from students on Telegram or WhatsApp. "
            "You must use the 'extract_and_save_events' tool if the message contains event details, deadlines, or class announcements. "
            "You must use the 'get_study_schedule' tool if they ask for a plan. "
            "If they just say hello or ask a general question, do not use tools—just reply nicely!"
        )

    def process_message(self, user_id: str, message: str) -> str:
        """
        Process an incoming message and return the response string to send back to the user.
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": message}
        ]
        
        try:
            # We call the LLM to decide what to do
            ai_msg = self.groq.generate_with_tools(messages, tools=self.tools)
            
            # If the LLM decided to call a tool:
            if getattr(ai_msg, "tool_calls", None):
                reply_texts = []
                for call in ai_msg.tool_calls:
                    fn_name = call.function.name
                    args = json.loads(call.function.arguments)
                    
                    if fn_name == "extract_and_save_events":
                        reply_texts.append(self._handle_extract(user_id, args.get("notice_text", message)))
                        
                    elif fn_name == "get_study_schedule":
                        reply_texts.append(self._handle_schedule(user_id, args.get("days_ahead", 14)))
                
                return "\\n\\n".join(reply_texts)
                
            # If the LLM just responded directly:
            if getattr(ai_msg, "content", None):
                return ai_msg.content
                
            return "I processed your message but have nothing to say."
            
        except Exception as e:
            logger.error(f"Supervisor error: {e}")
            return "Sorry, my brain encountered an error while thinking about that!"
            
    def _handle_extract(self, user_id: str, text: str) -> str:
        events = self.intelligence.extract_event(text)
        if not events:
            return "I read the message, but couldn't find any actionable deadlines, exams, or events in it."
            
        added = 0
        for event in events:
            try:
                desc = f"Type: {event.type}"
                if getattr(event, "subject", None):
                    desc += f"\\nSubject: {event.subject}"
                if getattr(event, "location", None):
                    desc += f"\\nLocation: {event.location}"

                task_data = TaskCreate(
                    title=event.title,
                    description=desc,
                    due_date=event.date if event.date and event.date != "unknown" else None,
                    priority="high" if event.type in ["exam", "assignment"] else "medium"
                )
                self.task_repo.create(user_id=user_id, data=task_data)
                added += 1
            except Exception as e:
                logger.error(f"Task creation failed for event {event}: {e}")
                
        return f"✅ Done! I extracted {added} event(s) from your message and added them to your CampusFlow workspace."
        
    def _handle_schedule(self, user_id: str, days_ahead: int) -> str:
        # Get tasks from DB
        tasks = self.task_repo.get_by_user(user_id)
        # Convert to ExtractedEvent format for the engine
        from app.schemas.intelligence import ExtractedEvent
        events = []
        for t in tasks:
            if t["due_date"]:
                events.append(ExtractedEvent(
                    title=t["title"],
                    date=t["due_date"],
                    type="task"
                ))
                
        schedule = self.intelligence.generate_schedule(events, days_ahead=days_ahead)
        if not schedule:
            return "You don't have any upcoming tasks that need scheduling!"
            
        response = "📅 **Your Study Schedule:**\\n"
        for block in schedule:
            response += f"- **{block.date}**: {block.focus_topic} ({block.duration_minutes} mins)\\n"
            
        return response
