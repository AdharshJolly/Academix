'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserOut, UserLoginRequest, UserRegisterRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { CalendarService } from '../services/calendar.service';

interface AuthContextType {
    user: UserOut | null;
    token: string | null;
    isLoading: boolean;
    login: (data: UserLoginRequest) => Promise<{user: UserOut, token: string}>;
    register: (data: UserRegisterRequest) => Promise<{user: UserOut, token: string}>;
    logout: () => void;
    updateUser: (user: UserOut) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: false,
    login: async () => ({} as {user: UserOut, token: string}),
    register: async () => ({} as {user: UserOut, token: string}),
    logout: () => {},
    updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserOut | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading for hydration

    useEffect(() => {
        // Hydrate from HttpOnly cookie by silently calling refresh
        let isMounted = true;
        const hydrate = async () => {
            try {
                const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({})
                });
                
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data.success && data.data && isMounted) {
                        setToken(data.data.token);
                        setUser(data.data.user);
                        localStorage.setItem('academix_user', JSON.stringify(data.data.user)); // Keep user for fast UI
                        if (data.data.user?.google_calendar_connected) {
                            CalendarService.prefetch(data.data.token).catch(e => console.error("Prefetch error:", e));
                        }
                    }
                } else {
                    // Stale or missing cookie
                    localStorage.removeItem('academix_user');
                    // Clean up old stale tokens if they exist
                    localStorage.removeItem('academix_token');
                    localStorage.removeItem('academix_refresh_token');
                }
            } catch (e) {
                console.error("Hydration failed", e);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Listen for silent refreshes from api.ts
        const handleTokenRefreshed = (e: any) => {
            if (e.detail?.token) setToken(e.detail.token);
            if (e.detail?.user) setUser(e.detail.user);
        };
        window.addEventListener('academix_token_refreshed', handleTokenRefreshed);

        hydrate();

        return () => {
            isMounted = false;
            window.removeEventListener('academix_token_refreshed', handleTokenRefreshed);
        };
    }, []);

    const handleAuthSuccess = (res: any, fallbackErrorMsg: string) => {
        if (res.success && res.data) {
            setToken(res.data.token);
            setUser(res.data.user);
            // DO NOT store token in localStorage to prevent XSS
            localStorage.setItem('academix_user', JSON.stringify(res.data.user));
            
            // Fire and forget prefetch for calendar caching
            if (res.data.user?.google_calendar_connected) {
                CalendarService.prefetch(res.data.token).catch(e => console.error("Prefetch error:", e));
            }

            return { user: res.data.user, token: res.data.token };
        } else {
            throw new Error(res.message || fallbackErrorMsg);
        }
    };

    const login = async (data: UserLoginRequest) => {
        setIsLoading(true);
        try {
            const res = await AuthService.login(data);
            return handleAuthSuccess(res, 'Login failed');
        } catch (err: any) {
            throw new Error(err.response?.data?.detail || err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: UserRegisterRequest) => {
        setIsLoading(true);
        try {
            const res = await AuthService.register(data);
            return handleAuthSuccess(res, 'Registration failed');
        } catch (err: any) {
            throw new Error(err.response?.data?.detail || err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (token) {
            try {
                // We only need to pass null for refresh token now because it's in the HttpOnly cookie
                await AuthService.logout(null, token);
            } catch (e) {
                console.error("Failed to call backend logout:", e);
            }
        }

        setToken(null);
        setUser(null);
        localStorage.removeItem('academix_token');
        localStorage.removeItem('academix_refresh_token');
        localStorage.removeItem('academix_user');
    };

    const updateUser = (updatedUser: UserOut) => {
        setUser(updatedUser);
        localStorage.setItem('academix_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
