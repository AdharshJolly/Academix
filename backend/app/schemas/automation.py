"""
Automation Schemas
"""
from pydantic import BaseModel
from typing import Literal


class TriggerRequest(BaseModel):
    type: Literal["task", "notice", "schedule"]
    payload: dict  # Workflow-specific fields


class TriggerResponse(BaseModel):
    workflow_type: str
    status: str          # pending | success | failed
    log_id: str
    message: str

