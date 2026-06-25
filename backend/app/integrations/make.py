"""
Make.com Integration Client
Sends one WhatsApp-only webhook payload to the Make.com Router scenario.
"""
import logging
import time

import httpx

from app.core.settings import settings

logger = logging.getLogger(__name__)


class MakeClient:
    """Sends pre-built WhatsApp messages to the Make.com webhook."""

    def __init__(self):
        self.webhook_url = settings.MAKE_WEBHOOK_URL

    def send_whatsapp(self, workflow_type: str, payload: dict) -> dict:
        """
        POST to the single Make.com webhook.
        Retries once after 5 seconds on network or non-2xx failure.
        """
        if not self.webhook_url:
            raise RuntimeError("MAKE_WEBHOOK_URL is not set in environment variables")

        body = {"type": workflow_type, "payload": payload}
        last_error: Exception | None = None

        for attempt in range(2):
            try:
                logger.info("Triggering Make.com WhatsApp route [%s]", workflow_type)
                with httpx.Client(timeout=15.0) as client:
                    response = client.post(self.webhook_url, json=body)
                    response.raise_for_status()
                    return response.json() if response.content else {"status": "triggered"}
            except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                last_error = exc
                logger.warning("Make.com webhook attempt %s failed: %s", attempt + 1, exc)
                if attempt == 0:
                    time.sleep(5)

        raise RuntimeError(f"Make.com webhook failed: {last_error}")
