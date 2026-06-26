/**
 * Core API Client & Mock Fallback Engine
 * Handles all HTTP requests, injecting auth headers.
 * If the backend is unreachable (or in demo mode), it seamlessly falls back to 
 * a LocalStorage-based Mock Engine to guarantee the demo works perfectly.
 */
import { APIResponse, PaginatedResponse } from '../types';
import { API_ENDPOINTS } from '../constants/api';

let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
if (apiUrl.includes('railway.app') && apiUrl.startsWith('http://')) {
    apiUrl = apiUrl.replace('http://', 'https://');
}
const BASE_URL = `${apiUrl}/api/v1`;

// === MOCK ENGINE ===
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function getMockData(endpoint: string, method: string, data?: any): any {
    if (endpoint.includes(API_ENDPOINTS.AUTH_LOGIN) || endpoint.includes(API_ENDPOINTS.AUTH_REGISTER)) {
        return {
            success: true, message: "Mock Login Successful",
            data: { token: "mock_jwt_token", user: { id: "u-1", email: data?.email || "demo@academix.edu", full_name: data?.full_name || "Demo User", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" } }
        };
    }
    if (endpoint.includes(API_ENDPOINTS.DASHBOARD)) {
        return {
            success: true, message: "Dashboard Loaded",
            data: {
                academic_health: { risk_level: "low", risk_score: 0.15, summary: "You're on track! Keep up the good work." },
                next_recommended_action: { action: "Review Advanced AI notes", priority: 1, due_in_hours: 48 },
                upcoming_deadlines: [
                    { task_id: "t-1", title: "Machine Learning Assignment 3", due_date: new Date(Date.now() + 86400000 * 2).toISOString(), priority: "high", days_remaining: 2 },
                    { task_id: "t-2", title: "Physics Lab Report", due_date: new Date(Date.now() + 86400000 * 5).toISOString(), priority: "medium", days_remaining: 5 }
                ],
                today_schedule: [
                    { subject: "Data Structures", duration_hours: 2, session_type: "study", start_time: "10:00 AM" },
                    { subject: "Physics", duration_hours: 1.5, session_type: "revision", start_time: "02:00 PM" }
                ],
                calendar_preview: [
                    { title: "Midterm Exam", date: new Date(Date.now() + 86400000 * 10).toISOString(), type: "exam" }
                ],
                recent_automations: [
                    { id: "a-1", workflow_type: "schedule", status: "success", triggered_at: new Date(Date.now() - 3600000).toISOString() },
                    { id: "a-2", workflow_type: "notice", status: "success", triggered_at: new Date(Date.now() - 86400000).toISOString() }
                ]
            }
        };
    }
    if (endpoint.includes(API_ENDPOINTS.INTELLIGENCE_PROCESS)) {
        return {
            success: true, message: "AI Processing Complete",
            data: {
                report_id: "rep-" + Date.now(), input_type: data?.input_type || "notice",
                extracted_events: [{ title: "Extracted Exam", date: new Date(Date.now() + 86400000 * 7).toISOString(), type: "exam", subject: "Unknown", location: "Hall A" }],
                risk_assessment: { risk_score: 0.2, risk_level: "low", factors: [{ factor: "Upcoming Exam", weight: 0.5 }] },
                recommendations: [{ action: "Start reviewing chapters 1-4 immediately", priority: 1, rationale: "Exam is in 7 days." }],
                study_schedule: [{ date: new Date().toISOString(), subject: "Exam Prep", duration_hours: 2, session_type: "study" }]
            }
        };
    }
    if (endpoint.includes(API_ENDPOINTS.TASKS)) {
        if (method === 'GET') {
            return {
                success: true, message: "Tasks Loaded",
                data: [
                    { id: "t-1", user_id: "u-1", title: "Machine Learning Assignment 3", status: "in_progress", priority: "high", due_date: new Date(Date.now() + 86400000 * 2).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: "t-2", user_id: "u-1", title: "Physics Lab Report", status: "pending", priority: "medium", due_date: new Date(Date.now() + 86400000 * 5).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ],
                total: 2, page: 1, size: 10
            };
        }
        if (method === 'POST') {
            return {
                success: true, message: "Task Created",
                data: { id: "t-" + Date.now(), user_id: "u-1", title: data?.title, description: data?.description, status: "pending", priority: data?.priority || "medium", due_date: data?.due_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            };
        }
    }
    if (endpoint.includes('/automations/')) {
        return { success: true, message: "Triggered successfully", data: null };
    }
    return { success: true, message: "Success", data: null };
}

// === CORE CLIENT ===
let _isHandling401 = false; // guard against redirect loops

async function request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    token?: string
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });

        // 401 = token expired or invalid → force logout and redirect to /auth
        if (response.status === 401 && !_isHandling401) {
            _isHandling401 = true;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('academix_token');
                localStorage.removeItem('academix_user');
                // Small delay so any in-flight renders can complete
                setTimeout(() => {
                    window.location.href = '/auth?reason=session_expired';
                    _isHandling401 = false;
                }, 100);
            }
            throw new Error('Session expired. Please log in again.');
        }

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.detail || responseData.message || `HTTP Error: ${response.status}`);
        }
        
        return responseData;
    } catch (error: any) {
        console.error(`[API Client] Request failed: ${url}`, error);
        throw error;
    }
}

export const apiClient = {
    get:    <T>(endpoint: string, token?: string) =>
                request<T>('GET', endpoint, undefined, token),
    post:   <T>(endpoint: string, data: unknown, token?: string) =>
                request<T>('POST', endpoint, data, token),
    put:    <T>(endpoint: string, data: unknown, token?: string) =>
                request<T>('PUT', endpoint, data, token),
    delete: <T>(endpoint: string, token?: string) =>
                request<T>('DELETE', endpoint, undefined, token),
};
