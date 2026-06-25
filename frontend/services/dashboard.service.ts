/**
 * Dashboard Service
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { DashboardResponse, APIResponse } from '../types';

export const DashboardService = {
    getDashboard: (token: string): Promise<APIResponse<DashboardResponse>> =>
        apiClient.get(API_ENDPOINTS.DASHBOARD, token),
};

