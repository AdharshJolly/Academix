/**
 * Auth Service
 * Authentication via Supabase Auth + backend verification.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { UserLoginRequest, UserRegisterRequest, AuthResponse, APIResponse } from '../types';

export const AuthService = {
    login: (data: UserLoginRequest): Promise<APIResponse<AuthResponse>> =>
        // TODO: Call Supabase Auth then POST to backend
        apiClient.post(API_ENDPOINTS.AUTH_LOGIN, data),

    register: (data: UserRegisterRequest): Promise<APIResponse<AuthResponse>> =>
        apiClient.post(API_ENDPOINTS.AUTH_REGISTER, data),

    connectGoogleCalendar: (): Promise<APIResponse<{authorization_url: string}>> =>
        apiClient.get('/auth/google/connect'),

    verifyGoogleCallback: (code: string, state: string): Promise<APIResponse<any>> =>
        apiClient.get(`/auth/google/callback?code=${code}&state=${state}`),
};

