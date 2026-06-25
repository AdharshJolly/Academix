"""
Telegram Integration
Triggered via Make.com (or n8n), not directly from backend.
This module holds the message payload builder only.
"""

class TelegramPayloadBuilder:

    def build_message_payload(self, chat_id: str, message: str) -> dict:
        """
        Build a Telegram API-compatible message payload.
        """
        return {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
