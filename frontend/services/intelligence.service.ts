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
        
        const reportId = initial.data.report_id;
        return IntelligenceService._waitForWs(reportId, token);
    },
    
    _waitForWs: async (reportId: string, token: string): Promise<APIResponse<IntelligenceResponse>> => {
        return new Promise((resolve) => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws?token=${token}`;
            
            let ws: WebSocket | null = null;
            try {
                ws = new WebSocket(wsUrl);
            } catch (e) {
                console.warn("Failed to connect WS", e);
            }
            
            // Backup polling just in case WS fails or is blocked
            let timeoutId: any;
            let pollInterval = setInterval(async () => {
                try {
                    const statusRes = await apiClient.get<any>(`/intelligence/status/${reportId}`, token);
                    if (statusRes.data?.status === 'completed') {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        if (ws) ws.close();
                        resolve({ success: true, data: statusRes.data.report, message: 'Completed' });
                    } else if (statusRes.data?.status === 'failed') {
                        clearInterval(pollInterval);
                        clearTimeout(timeoutId);
                        if (ws) ws.close();
                        resolve({ success: false, data: null as any, message: 'Report processing failed.' });
                    }
                } catch (e) {}
            }, 5000); 

            if (ws) {
                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.report_id === reportId) {
                            if (msg.type === 'INTELLIGENCE_REPORT_COMPLETE') {
                                clearInterval(pollInterval);
                                clearTimeout(timeoutId);
                                ws!.close();
                                resolve({ success: true, data: msg.report, message: 'Completed' });
                            } else if (msg.type === 'INTELLIGENCE_REPORT_FAILED') {
                                clearInterval(pollInterval);
                                clearTimeout(timeoutId);
                                ws!.close();
                                resolve({ success: false, data: null as any, message: msg.error });
                            }
                        }
                    } catch (e) {
                        console.error("WS parse error", e);
                    }
                };
            }
            
            // Timeout to prevent infinite polling
            timeoutId = setTimeout(() => {
                clearInterval(pollInterval);
                if (ws) ws.close();
                resolve({ success: false, data: null as any, message: 'Request timed out after 120 seconds.' });
            }, 120000);
        });
    },

    processNotice: async (data: IntelligenceRequest, token: string): Promise<APIResponse<IntelligenceResponse>> => {
        const initial = await apiClient.post<any>(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token);
        if (!initial.success || !initial.data?.report_id) {
            return initial;
        }
        return IntelligenceService._waitForWs(initial.data.report_id, token);
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
