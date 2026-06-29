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
            credentials: 'include',
            body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
        });

        // 401 = token expired or invalid
        if (response.status === 401 && !_isHandling401) {
            _isHandling401 = true;
            if (typeof window !== 'undefined') {
                try {
                    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({}) // Refresh token is in HttpOnly cookie
                    });
                    
                    const refreshData = await refreshRes.json();
                    if (refreshRes.ok && refreshData.success) {
                        // Re-run original request with new token
                        _isHandling401 = false;
                        
                        // Emit an event so AuthContext can update its memory token
                        window.dispatchEvent(new CustomEvent('academix_token_refreshed', { 
                            detail: { token: refreshData.data.token, user: refreshData.data.user } 
                        }));
                        
                        return request<T>(method, endpoint, data, refreshData.data.token);
                    }
                } catch (e) {
                    console.error('Silent refresh failed:', e);
                }

                // If we get here, refresh failed -> force logout
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
