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
            let pollInterval = setInterval(async () => {
                try {
                    const statusRes = await apiClient.get(`/intelligence/status/${reportId}`, token);
                    if (statusRes.data?.status === 'completed') {
                        clearInterval(pollInterval);
                        if (ws) ws.close();
                        resolve({ success: true, data: statusRes.data.report, message: 'Completed' });
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
                                ws!.close();
                                resolve({ success: true, data: msg.report, message: 'Completed' });
                            } else if (msg.type === 'INTELLIGENCE_REPORT_FAILED') {
                                clearInterval(pollInterval);
                                ws!.close();
                                resolve({ success: false, data: null as any, message: msg.error });
                            }
                        }
                    } catch (e) {
                        console.error("WS parse error", e);
                    }
                };
            }
        });
    },

    processNotice: async (data: IntelligenceRequest, token: string): Promise<APIResponse<IntelligenceResponse>> => {
        const initial = await apiClient.post(API_ENDPOINTS.INTELLIGENCE_PROCESS, data, token);
        if (!initial.success || !initial.data?.report_id) {
            return initial;
        }
        return IntelligenceService._waitForWs(initial.data.report_id, token);
    },
    // Alias for compatibility
    process: function(data: IntelligenceRequest, token: string) {
        return this.processNotice(data, token);
    }
};
