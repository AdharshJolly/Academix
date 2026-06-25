"""
n8n Integration Client
POSTs webhook requests to n8n to trigger automation workflows.
Workflow URLs are mapped by type: task | notice | schedule
"""
import logging
import httpx
from app.core.settings import settings

logger = logging.getLogger(__name__)

WEBHOOK_PATHS = {
    "task":     "/webhook/task-workflow",
    "notice":   "/webhook/notice-workflow",
    "schedule": "/webhook/schedule-workflow",
}


class N8NClient:
    """Sends payloads to n8n webhook endpoints."""

    def __init__(self):
        self.base_url = settings.N8N_BASE_URL.rstrip("/")
        self.api_key = settings.N8N_API_KEY

    def trigger_workflow(self, workflow_type: str, payload: dict) -> dict:
        """
        POST to the n8n webhook for the given workflow_type.
        Returns the n8n response JSON.
        Raises RuntimeError on connection failure.

        Args:
            workflow_type: 'task' | 'notice' | 'schedule'
            payload:       Dict with workflow-specific fields
        """
        path = WEBHOOK_PATHS.get(workflow_type)
        if not path:
            raise ValueError(f"Unknown workflow_type: {workflow_type}")

        if not self.base_url:
            raise RuntimeError("N8N_BASE_URL is not set in environment variables")

        url = f"{self.base_url}{path}"
        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            logger.info(f"Triggering n8n workflow [{workflow_type}] → {url}")
            with httpx.Client(timeout=15.0) as client:
                response = client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                logger.info(f"n8n [{workflow_type}] responded: {response.status_code}")
                return response.json() if response.content else {"status": "triggered"}
        except httpx.HTTPStatusError as e:
            logger.error(f"n8n HTTP error [{workflow_type}]: {e}")
            raise RuntimeError(f"n8n workflow failed with status {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"n8n connection error [{workflow_type}]: {e}")
            raise RuntimeError(f"Cannot connect to n8n at {self.base_url}: {e}")
