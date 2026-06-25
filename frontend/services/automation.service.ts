/**
 * Automation Service
 * Triggers n8n workflows via backend.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { TriggerResponse, APIResponse } from '../types';

export const AutomationService = {
    triggerTaskWorkflow: (payload: Record<string, unknown>, token?: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_TASK, { type: 'task', payload }, token),

    triggerNoticeWorkflow: (payload: Record<string, unknown>, token?: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_NOTICE, { type: 'notice', payload }, token),

    triggerScheduleWorkflow: (payload: Record<string, unknown>, token?: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_SCHEDULE, { type: 'schedule', payload }, token),
};
