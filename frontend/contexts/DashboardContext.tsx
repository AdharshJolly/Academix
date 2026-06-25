'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DashboardResponse, CalendarEvent } from '../types';
import { DashboardService } from '../services/dashboard.service';
import { useAuth } from './AuthContext';

interface DashboardContextType {
    data: DashboardResponse | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    localTasks: Record<string, CalendarEvent[]>;
    completedTasks: Record<string, boolean>;
    importantTasks: Record<string, boolean>;
    setLocalTasks: React.Dispatch<React.SetStateAction<Record<string, CalendarEvent[]>>>;
    setCompletedTasks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setImportantTasks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const DashboardContext = createContext<DashboardContextType>({
    data: null,
    isLoading: false,
    error: null,
    refresh: async () => {},
    localTasks: {},
    completedTasks: {},
    importantTasks: {},
    setLocalTasks: () => {},
    setCompletedTasks: () => {},
    setImportantTasks: () => {},
});

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Calendar persistent state
    const [localTasks, setLocalTasks] = useState<Record<string, CalendarEvent[]>>({});
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
    const [importantTasks, setImportantTasks] = useState<Record<string, boolean>>({});

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
        <DashboardContext.Provider value={{ 
            data, isLoading, error, refresh, 
            localTasks, setLocalTasks, 
            completedTasks, setCompletedTasks,
            importantTasks, setImportantTasks
        }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => useContext(DashboardContext);
export { DashboardContext };
