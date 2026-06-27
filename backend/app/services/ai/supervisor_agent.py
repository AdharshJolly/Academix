import json
import logging
import asyncio
from app.services.groq_client import GroqClient
from app.services.intelligence_engine import AcademicIntelligenceEngine
from app.repositories.task_repository import TaskRepository
from app.repositories.chat_repository import ChatRepository
from app.services.calendar_sync_service import CalendarSyncService
from app.schemas.tasks import TaskCreate, TaskUpdate

logger = logging.getLogger(__name__)

# Keep strong references to background tasks so they aren't garbage collected
_background_tasks = set()

def _on_task_done(task):
    _background_tasks.discard(task)
    try:
        exc = task.exception()
        if exc:
            logger.error(f"Background task failed with exception: {exc}")
    except asyncio.CancelledError:
        pass

class SupervisorAgent:
    """
    Agentic Orchestrator for Academix.
    Uses Groq function calling to decide whether to extract notices, 
    generate schedules, or just chat.
    """
    def __init__(self):
        self.groq = GroqClient()
        self.intelligence = AcademicIntelligenceEngine()
        self.task_repo = TaskRepository()
        self.chat_repo = ChatRepository()
        self.calendar_sync = CalendarSyncService()
        
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
            },
            {
                "type": "function",
                "function": {
                    "name": "search_study_materials",
                    "description": "Searches the user's uploaded study materials (PDFs, syllabi) for answers to their questions.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The specific question or topic to search for."
                            }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "reschedule_task",
                    "description": "Call this when the user wants to reschedule an existing task or assignment.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_name": {
                                "type": "string",
                                "description": "The name or subject of the task to reschedule."
                            },
                            "new_date": {
                                "type": "string",
                                "description": "The new due date (YYYY-MM-DD or readable format)."
                            }
                        },
                        "required": ["task_name", "new_date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_task",
                    "description": "Call this when the user wants to delete or cancel an existing task.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "task_name": {
                                "type": "string",
                                "description": "The name or subject of the task to delete."
                            }
                        },
                        "required": ["task_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "log_attendance",
                    "description": "Call this when the user reports how many hours they attended or missed today, OR when they report their current overall attendance percentage.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "hours_conducted_today": {
                                "type": "number",
                                "description": "Total hours conducted today."
                            },
                            "hours_missed_today": {
                                "type": "number",
                                "description": "Hours missed today."
                            },
                            "overall_percentage": {
                                "type": "number",
                                "description": "The user's overall attendance percentage if they just tell you the final number."
                            }
                        }
                    }
                }
            }
        ]
        
        self.system_prompt = (
            "You are the Academix AI Coordinator, an intelligent student assistant. "
            "You receive messages from students on Telegram or WhatsApp. "
            "You must use the 'extract_and_save_events' tool if the message contains event details, deadlines, or class announcements. "
            "You must use the 'get_study_schedule' tool if they ask for a plan. "
            "You must use the 'search_study_materials' tool if they ask a question about their syllabus, classes, or uploaded documents. "
            "You must use 'reschedule_task' or 'delete_task' if they ask to modify or remove a task. "
            "You must use 'log_attendance' if the user reports missing classes, attending classes, or gives a daily/weekly attendance update. "
            "If they just say hello or ask a general question, do not use tools—just reply nicely!"
        )

    async def process_message(self, user_id: str, message: str) -> str:
        """
        Process an incoming message and return the response string to send back to the user.
        Includes full conversational memory context.
        """
        # 1. Save the new user message
        self.chat_repo.add_message(user_id, "user", message)
        
        # 2. Fetch history
        history = self.chat_repo.get_recent_messages(user_id, limit=10)
        
        # 3. Build messages array
        messages = [{"role": "system", "content": self.system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Ensure the current message is at the end (history already contains it since we just saved it,
        # but just in case we'll rely on history which should have it as the last element).
        
        try:
            # We call the LLM to decide what to do
            ai_msg = self.groq.generate_with_tools(messages, tools=self.tools)
            
            response_text = "I processed your message but have nothing to say."
            
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
                        
                    elif fn_name == "search_study_materials":
                        reply_texts.append(await self._handle_search_materials(user_id, args.get("query", message)))
                        
                    elif fn_name == "reschedule_task":
                        reply_texts.append(self._handle_reschedule(user_id, args.get("task_name"), args.get("new_date")))
                        
                    elif fn_name == "delete_task":
                        reply_texts.append(self._handle_delete(user_id, args.get("task_name")))
                        
                    elif fn_name == "log_attendance":
                        reply_texts.append(self._handle_log_attendance(user_id, args))
                
                response_text = "\n\n".join(reply_texts)
                
            # If the LLM just responded directly:
            elif getattr(ai_msg, "content", None):
                response_text = ai_msg.content
                
            # Save assistant response
            self.chat_repo.add_message(user_id, "assistant", response_text)
            return response_text
            
        except Exception as e:
            logger.error(f"Supervisor error: {e}")
            return "Sorry, my brain encountered an error while thinking about that!"
            
    def _handle_log_attendance(self, user_id: str, args: dict) -> str:
        hours_conducted = args.get("hours_conducted_today")
        hours_missed = args.get("hours_missed_today")
        overall_percentage = args.get("overall_percentage")

        from app.repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user = user_repo.get_by_id(user_id)
        if not user:
            return "I couldn't find your profile."

        if overall_percentage is not None:
            user_repo.update(user_id, {"attendance_percent": overall_percentage})
            return f"Got it! I've updated your overall attendance to {overall_percentage}%."

        if hours_conducted is not None and hours_missed is not None:
            attended_today = hours_conducted - hours_missed
            current_total = user.attendance_total_hours or 0.0
            current_attended = user.attendance_attended_hours or 0.0
            
            new_total = current_total + hours_conducted
            new_attended = current_attended + attended_today
            new_percent = round((new_attended / new_total) * 100, 1) if new_total > 0 else 0.0

            user_repo.update(user_id, {
                "attendance_total_hours": new_total,
                "attendance_attended_hours": new_attended,
                "attendance_percent": new_percent
            })
            
            return f"Logged! You attended {attended_today} out of {hours_conducted} hours today. Your new overall attendance is {new_percent}%."

        return "Please tell me how many total hours you had today, and how many you missed. Or just tell me your current overall percentage!"

    def _handle_extract(self, user_id: str, text: str) -> str:
        events = self.intelligence.extract_event(text)
        if not events:
            return "I read the message, but couldn't find any actionable deadlines, exams, or events in it."
            
        successful_events = []
        for event in events:
            try:
                desc = f"Type: {event.type}"
                if getattr(event, "subject", None):
                    desc += f"\nSubject: {event.subject}"
                if getattr(event, "location", None):
                    desc += f"\nLocation: {event.location}"

                task_data = TaskCreate(
                    title=event.title,
                    description=desc,
                    due_date=event.date if event.date and event.date != "unknown" else None,
                    priority="high" if event.type in ["exam", "assignment"] else "medium"
                )
                self.task_repo.create(user_id=user_id, data=task_data)
                successful_events.append(event)
            except Exception as e:
                logger.error(f"Task creation failed for event {event}: {e}")
                
        # Background Calendar Sync
        if successful_events:
            try:
                loop = asyncio.get_running_loop()
                task = loop.create_task(
                    asyncio.to_thread(self.calendar_sync.sync_events_background, user_id, successful_events)
                )
                _background_tasks.add(task)
                task.add_done_callback(_on_task_done)
            except Exception as e:
                logger.error(f"Failed to dispatch calendar sync background task: {e}")
                
        return f"✅ Done! I extracted {len(successful_events)} event(s) from your message and added them to your Academix workspace."
        
    def _handle_schedule(self, user_id: str, days_ahead: int) -> str:
        # Get tasks from DB
        tasks, _ = self.task_repo.get_all(user_id=user_id, size=50)
        
        # Convert to ExtractedEvent format for the intelligence engine
        from app.schemas.intelligence import ExtractedEvent
        events = []
        for t in tasks:
            if t.due_date:
                events.append(ExtractedEvent(
                    title=t.title,
                    date=t.due_date,
                    type="task"
                ))
                
        if not events:
            return "You don't have any pending tasks to schedule! Forward me some assignments first."
            
        # Fetch busy periods from calendar
        busy_periods = self.calendar_sync.get_busy_periods(user_id, days=days_ahead)
            
        schedule = self.intelligence.generate_schedule(events, days_ahead=days_ahead, busy_periods=busy_periods)
        
        if not schedule:
            return "I couldn't figure out a good study schedule right now."
            
        # Background Calendar Sync
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(
                asyncio.to_thread(self.calendar_sync.sync_schedules_background, user_id, schedule)
            )
            _background_tasks.add(task)
            task.add_done_callback(_on_task_done)
        except Exception as e:
            logger.error(f"Failed to dispatch schedule sync background task: {e}")
            
        response = "📅 **Your Study Schedule:**\n"
        for block in schedule:
            response += f"- **{block.date}**: {block.focus_topic} ({block.duration_minutes} mins)\n"
            
        return response

    async def _handle_search_materials(self, user_id: str, query: str) -> str:
        from app.services.ai.document_processor import DocumentProcessor
        doc_processor = DocumentProcessor()
        
        try:
            # 1. Embed the query
            query_embedding = await doc_processor.get_embedding(query)
            vector_literal = "[" + ",".join(map(str, query_embedding)) + "]"
            
            # 2. Search Supabase via the RPC function
            # Fetch more matches for reranking
            res = self.task_repo.db.rpc("match_study_materials", {
                "query_embedding": vector_literal,
                "match_threshold": 0.3, # lower threshold for wider recall
                "match_count": 10,
                "p_user_id": user_id
            }).execute()
            
            matches = res.data or []
            if not matches:
                return "I couldn't find any relevant information in your uploaded study materials."
                
            # 3. LLM Reranking (High Accuracy RAG)
            import json
            rerank_system = (
                "You are a relevance-scoring AI. You will be given a question and a list of numbered snippets. "
                "Output a JSON array of the integers corresponding to the snippets that are genuinely helpful for answering the question. "
                "Example output: [0, 2, 5]"
            )
            
            snippets_text = ""
            for i, m in enumerate(matches):
                snippets_text += f"\nSnippet {i}:\n{m['chunk_text']}\n"
                
            rerank_prompt = f"Question: {query}\n{snippets_text}\n\nReturn ONLY a JSON array of relevant indices."
            
            try:
                rerank_res = self.groq.generate_json(prompt=rerank_prompt, system=rerank_system)
                from app.services.ai.json_parser import JsonParser
                parser = JsonParser()
                # Use safe_extract which handles json parsing
                relevant_indices = parser.safe_extract(rerank_res, fallback=list(range(min(3, len(matches)))))
                if not isinstance(relevant_indices, list):
                    relevant_indices = list(range(min(3, len(matches))))
            except Exception as e:
                logger.warning(f"Reranking failed: {e}")
                relevant_indices = list(range(min(3, len(matches))))
                
            if not relevant_indices:
                return "I searched your documents but couldn't find anything relevant to answer that question."
                
            # Filter matches
            filtered_matches = [matches[i] for i in relevant_indices if i < len(matches)]
                
            # 4. Compile the context and answer
            context = "\n\n".join([f"Source ({m['filename']}): {m['chunk_text']}" for m in filtered_matches])
            
            system = (
                "You are an academic tutor. Use the provided study material excerpts to answer the student's question. "
                "If the answer is not in the context, tell them you don't know based on the uploaded files."
            )
            prompt = f"Context:\n{context}\n\nQuestion: {query}"
            
            answer = self.groq.generate(prompt=prompt, system=system)
            return answer
            
        except Exception as e:
            logger.error(f"Failed to search study materials: {e}")
            return "I ran into an issue searching your study materials!"
