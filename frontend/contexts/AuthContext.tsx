'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserOut, UserLoginRequest, UserRegisterRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { CalendarService } from '../services/calendar.service';

interface AuthContextType {
    user: UserOut | null;
    token: string | null;
    isLoading: boolean;
    login: (data: UserLoginRequest) => Promise<UserOut>;
    register: (data: UserRegisterRequest) => Promise<UserOut>;
    logout: () => void;
    updateUser: (user: UserOut) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: false,
    login: async () => ({} as UserOut),
    register: async () => ({} as UserOut),
    logout: () => {},
    updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserOut | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading for hydration

    useEffect(() => {
        // Hydrate from localStorage on client mount
        try {
            const storedToken = localStorage.getItem('academix_token');
            const storedUser = localStorage.getItem('academix_user');
            if (storedToken && storedUser) {
                // Validate it's our own JWT (3 dot-separated segments)
                // Old Supabase tokens have a different format and will cause 401s
                const segments = storedToken.split('.');
                if (segments.length !== 3) {
                    // Stale token from old Supabase Auth — clear and force re-login
                    localStorage.removeItem('academix_token');
                    localStorage.removeItem('academix_refresh_token');
                    localStorage.removeItem('academix_user');
                } else {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);
                    
                    if (parsedUser?.google_calendar_connected) {
                        CalendarService.prefetch(storedToken).catch(e => console.error("Prefetch hydration error:", e));
                    }
                }
            }
        } catch (e) {
            localStorage.removeItem('academix_token');
            localStorage.removeItem('academix_refresh_token');
            localStorage.removeItem('academix_user');
        } finally {
            setIsLoading(false); // Hydration complete
        }
    }, []);

    const handleAuthSuccess = (res: any, fallbackErrorMsg: string) => {
        if (res.success && res.data) {
            setToken(res.data.token);
            setUser(res.data.user);
            localStorage.setItem('academix_token', res.data.token);
            if (res.data.refresh_token) {
                localStorage.setItem('academix_refresh_token', res.data.refresh_token);
            }
            localStorage.setItem('academix_user', JSON.stringify(res.data.user));
            
            // Fire and forget prefetch for calendar caching
            if (res.data.user?.google_calendar_connected) {
                CalendarService.prefetch(res.data.token).catch(e => console.error("Prefetch error:", e));
            }

            return res.data.user;
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
        const currentToken = token || localStorage.getItem('academix_token');
        const currentRefreshToken = localStorage.getItem('academix_refresh_token');
        
        if (currentToken) {
            try {
                await AuthService.logout(currentRefreshToken, currentToken);
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
