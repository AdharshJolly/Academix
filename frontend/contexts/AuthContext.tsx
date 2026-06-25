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
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: false,
    login: async () => ({} as UserOut),
    register: async () => ({} as UserOut),
    logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserOut | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Hydrate from localStorage on client mount
        try {
            const storedToken = localStorage.getItem('campusflow_token');
            const storedUser = localStorage.getItem('campusflow_user');
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            // ignore parse errors
        }
    }, []);

    const login = async (data: UserLoginRequest) => {
        setIsLoading(true);
        try {
            const res = await AuthService.login(data);
            if (res.success && res.data) {
                setToken(res.data.token);
                setUser(res.data.user);
                localStorage.setItem('campusflow_token', res.data.token);
                localStorage.setItem('campusflow_user', JSON.stringify(res.data.user));
                return res.data.user;
            } else {
                throw new Error(res.message || 'Login failed');
            }
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
            if (res.success && res.data) {
                setToken(res.data.token);
                setUser(res.data.user);
                localStorage.setItem('campusflow_token', res.data.token);
                localStorage.setItem('campusflow_user', JSON.stringify(res.data.user));
                return res.data.user;
            } else {
                throw new Error(res.message || 'Registration failed');
            }
        } catch (err: any) {
            throw new Error(err.response?.data?.detail || err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('campusflow_token');
        localStorage.removeItem('campusflow_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };
