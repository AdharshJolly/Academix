/**
 * Intelligence Service
 * Single entry point for the Academic Intelligence Engine.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { IntelligenceRequest, IntelligenceResponse, APIResponse } from '../types';

export const IntelligenceService = {
    processNotice: async (data: IntelligenceRequest, token: string): Promise<APIResponse<IntelligenceResponse>> => {
        const initial = await apiClient.post(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token);
        if (!initial.success || !initial.data?.report_id) {
            return initial;
        }
        
        const reportId = initial.data.report_id;
        
        // Poll for completion
        while (true) {
            await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
            const statusRes = await apiClient.get(`/intelligence/status/${reportId}`, token);
            if (statusRes.data?.status === 'completed') {
                return { success: true, data: statusRes.data.report, message: 'Completed' };
            }
            if (!statusRes.success) {
                return statusRes; // Bubble up errors
            }
        }
    },
    // Alias for compatibility
    process: function(data: IntelligenceRequest, token: string) {
        return this.processNotice(data, token);
    }
};
