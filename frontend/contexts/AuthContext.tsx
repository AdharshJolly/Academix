'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserOut, UserLoginRequest, UserRegisterRequest } from '../types';
import { AuthService } from '../services/auth.service';

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
                    localStorage.removeItem('academix_user');
                } else {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            }
        } catch (e) {
            localStorage.removeItem('academix_token');
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
            localStorage.setItem('academix_user', JSON.stringify(res.data.user));
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

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('academix_token');
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
