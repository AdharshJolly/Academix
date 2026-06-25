/**
 * Automation Service
 * Triggers n8n workflows via backend.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { TriggerRequest, TriggerResponse, APIResponse } from '../types';

export const AutomationService = {
    triggerTask: (data: TriggerRequest, token: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_TASK, data, token),

    triggerNotice: (data: TriggerRequest, token: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_NOTICE, data, token),

    triggerSchedule: (data: TriggerRequest, token: string): Promise<APIResponse<TriggerResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTOMATION_SCHEDULE, data, token),
};

