"""
WhatsApp Integration via Twilio
Triggered via Make.com, not directly from backend.
This module holds the message payload builder only.
"""


class WhatsAppPayloadBuilder:

    def build_message_payload(self, recipient: str, message: str) -> dict:
        """
        Build a Twilio WhatsApp API-compatible message payload.
        """
        return {
            "To": f"whatsapp:{recipient}",
            "Body": message
        }

