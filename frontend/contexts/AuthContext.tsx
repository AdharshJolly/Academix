'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserOut, UserLoginRequest, UserRegisterRequest } from '../types';
import { AuthService } from '../services/auth.service';

interface AuthContextType {
    user: UserOut | null;
    token: string | null;
    isLoading: boolean;
    login: (data: UserLoginRequest) => Promise<void>;
    register: (data: UserRegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isLoading: false,
    login: async () => {},
    register: async () => {},
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
            // Mock authentication delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockUser = {
                id: '1',
                email: data.email,
                full_name: 'Demo User',
                avatar_url: '/avatars/doodle_dog.png',
                created_at: new Date().toISOString()
            };
            
            setToken('mock-jwt-token-12345');
            setUser(mockUser);
            localStorage.setItem('campusflow_token', 'mock-jwt-token-12345');
            localStorage.setItem('campusflow_user', JSON.stringify(mockUser));
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: UserRegisterRequest) => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockUser = {
                id: '2',
                email: data.email,
                full_name: data.full_name || 'New Student',
                avatar_url: 'https://robohash.org/newuser?set=set4&bgset=bg2',
                created_at: new Date().toISOString()
            };
            
            setToken('mock-jwt-token-67890');
            setUser(mockUser);
            localStorage.setItem('campusflow_token', 'mock-jwt-token-67890');
            localStorage.setItem('campusflow_user', JSON.stringify(mockUser));
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
