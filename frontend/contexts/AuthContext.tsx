/**
 * AuthContext
 * Provides the authenticated user state across the application.
 * Uses Supabase Auth session under the hood.
 * TODO: Implement using createContext + useSupabaseClient
 */
import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
    // TODO: Return current user and auth methods from context
    return useContext(AuthContext);
};

