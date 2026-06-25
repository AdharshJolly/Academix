"""
Automation Schemas
"""
from typing import Literal

from pydantic import BaseModel


WorkflowType = Literal["task", "notice", "schedule"]
AutomationStatus = Literal["pending", "success", "failed"]


class TriggerRequest(BaseModel):
    type: WorkflowType
    payload: dict


class TriggerResponse(BaseModel):
    workflow_type: str
    status: str
    log_id: str
    message: str


class AutomationLogCallback(BaseModel):
    workflow_type: WorkflowType
    status: Literal["success", "failed"]
    user_id: str
    log_id: str
    whatsapp_message_id: str | None = None
    error: str | None = None


class AutomationLogResponse(BaseModel):
    id: str
    workflow_type: str
    status: str
    triggered_at: str
    completed_at: str | None = None
    payload: dict | None = None
    response: dict | None = None


class AutomationCallbackResponse(BaseModel):
    logged: bool


class IncomingMessageWebhook(BaseModel):
    platform: Literal["telegram", "whatsapp"]
    sender_id: str
    text: str


class IncomingMessageResponse(BaseModel):
    success: bool
    message: str
