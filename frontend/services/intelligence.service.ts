/**
 * Intelligence Service
 * Single entry point for the Academic Intelligence Engine.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { IntelligenceRequest, IntelligenceResponse, APIResponse } from '../types';

export const IntelligenceService = {
    processNotice: (data: IntelligenceRequest, token: string): Promise<APIResponse<IntelligenceResponse>> =>
        apiClient.post(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token),
    // Alias for compatibility
    process: (data: IntelligenceRequest, token: string): Promise<APIResponse<IntelligenceResponse>> =>
        apiClient.post(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token),
};
