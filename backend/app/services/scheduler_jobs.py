import logging
import asyncio
from app.db.client import get_supabase
from app.integrations.telegram import TelegramClient

logger = logging.getLogger(__name__)

async def send_weekly_attendance_check():
    """
    Cron job triggered every Friday evening.
    Asks users via Telegram to update their attendance percentage.
    """
    logger.info("Running weekly attendance check job...")
    db = get_supabase()
    
    # Fetch users who have Telegram connected and notifications enabled
    res = db.table("users").select("id, full_name, telegram_chat_id").eq("telegram_notifications_enabled", True).execute()
    users = res.data or []
    
    telegram = TelegramClient()
    count = 0
    
    for user in users:
        chat_id = user.get("telegram_chat_id")
        if chat_id:
            # Send message
            first_name = user.get("full_name", "there").split()[0]
            msg = (
                f"🏫 Hey {first_name}! It's time for your weekly attendance check.\n\n"
                "To keep your Risk Engine accurate, please reply with your current overall attendance percentage (e.g., 'My attendance is at 82%')."
            )
            success = await telegram.send_message(chat_id, msg)
            if success:
                count += 1
            # Add a small delay to avoid rate limiting
            await asyncio.sleep(0.5)
            
    logger.info(f"Weekly attendance check complete. Messages sent: {count}")
