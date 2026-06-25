'use client';

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { DashboardProvider } from '../contexts/DashboardContext';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DashboardProvider>
                {children}
            </DashboardProvider>
        </AuthProvider>
    );
}
