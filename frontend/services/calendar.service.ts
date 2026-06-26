/**
 * Calendar Service
 * Read and write events to/from the user's connected Google Calendar.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { APIResponse } from '../types';

export interface CalendarEvent {
    id?: string;
    title: string;
    date: string;            // YYYY-MM-DD
    description?: string;
    start_time?: string;
    end_time?: string;
    all_day?: boolean;
    type: string;
    source?: 'google' | 'local' | 'task';
}
interface CreateEventPayload {
    title: string;
    date: string;
    description?: string;
    all_day?: boolean;
    start_time?: string;
    duration_hours?: number;
}
export const CalendarService = {
    /**
     * Fetch events from the user's Google Calendar for a given year/month.
     * Returns empty array if not connected — does NOT throw.
     */
    getEvents: (year: number, month: number, token: string): Promise<APIResponse<CalendarEvent[]>> =>
        apiClient.get<APIResponse<CalendarEvent[]>>(
            `${API_ENDPOINTS.CALENDAR_EVENTS}?year=${year}&month=${month}`,
            token
        ),

    /**
     * Create a new event in the user's Google Calendar.
     * Throws if not connected.
     */
    createEvent: (data: CreateEventPayload, token: string): Promise<APIResponse<any>> =>
        apiClient.post<APIResponse<any>>(API_ENDPOINTS.CALENDAR_EVENTS, data, token),
};
