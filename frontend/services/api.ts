/**
 * Core API Client
 * Handles all HTTP requests, injecting auth headers.
 */

let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BASE_URL = `${apiUrl}/api/v1`;

let _isHandling401 = false; // guard against redirect loops

async function request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    token?: string
): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
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
