/**
 * Dashboard Service
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { DashboardResponse, APIResponse } from '../types';

export const DashboardService = {
    getDashboard: (token: string): Promise<APIResponse<DashboardResponse>> =>
        apiClient.get(API_ENDPOINTS.DASHBOARD, token),
        
    logStudySession: (data: { duration_minutes: number, title?: string, task_id?: string }, token: string): Promise<APIResponse<any>> =>
        apiClient.post(`${API_ENDPOINTS.DASHBOARD}/study-sessions`, data, token),
};

