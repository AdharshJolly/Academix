/**
 * Intelligence Service
 * Single entry point for the Academic Intelligence Engine.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { IntelligenceRequest, IntelligenceResponse, APIResponse } from '../types';

export const IntelligenceService = {
    uploadNotice: async (file: File, token: string): Promise<APIResponse<IntelligenceResponse>> => {
        const formData = new FormData();
        formData.append('file', file);
        const initial = await apiClient.post<any>('/intelligence/upload', formData, token);
        
        if (!initial.success || !initial.data?.report_id) {
            return initial;
        }
        
        return initial;
    },
    
    processNotice: async (data: IntelligenceRequest, token: string): Promise<APIResponse<any>> => {
        const initial = await apiClient.post<any>(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token);
        return initial;
    },
    // Alias for compatibility
    process: function(data: IntelligenceRequest, token: string) {
        return this.processNotice(data, token);
    },
    
    getChatHistory: (token: string): Promise<APIResponse<any[]>> => {
        return apiClient.get('/intelligence/chat/history', token);
    },
    
    sendChatMessage: (content: string, token: string): Promise<APIResponse<{role: string, content: string}>> => {
        return apiClient.post('/intelligence/chat', { content }, token);
    },
    
    uploadTimetable: async (file: File, token: string): Promise<APIResponse<{subjects: string[]}>> => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<any>('/intelligence/upload/timetable', formData, token);
    },

    uploadStudyMaterial: async (file: File, token: string): Promise<APIResponse<any>> => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<any>('/intelligence/upload/material', formData, token);
    }
};
