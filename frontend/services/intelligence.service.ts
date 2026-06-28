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
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const initialRes = await fetch(`${apiUrl}/api/v1/intelligence/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const initial = await initialRes.json();
        
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/upload/timetable`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    },

    uploadStudyMaterial: async (file: File, token: string): Promise<APIResponse<any>> => {
        const formData = new FormData();
        formData.append('file', file);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v1/intelligence/upload/material`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    }
};
