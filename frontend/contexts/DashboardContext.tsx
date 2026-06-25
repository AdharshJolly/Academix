'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DashboardResponse } from '../types';
import { DashboardService } from '../services/dashboard.service';
import { useAuth } from './AuthContext';

interface DashboardContextType {
    data: DashboardResponse | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
    data: null,
    isLoading: false,
    error: null,
    refresh: async () => {},
});

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await DashboardService.getDashboard(token || '');
            if (res.success && res.data) {
                setData(res.data);
                setError(null);
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <DashboardContext.Provider value={{ data, isLoading, error, refresh }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
export { DashboardContext };
