"""
n8n Integration
Sends webhook requests to n8n to trigger automation workflows.
"""
from app.core.settings import settings


class N8NClient:

    def trigger_workflow(self, workflow_type: str, payload: dict) -> dict:
        """
        POST to n8n webhook URL for the given workflow_type.
        TODO: Implement HTTP POST to N8N_BASE_URL
        """
        pass

