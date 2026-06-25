/**
 * Core API Client
 * SOLE entry point for all HTTP requests.
 * No fetch() or axios calls outside this file.
 * Uses NEXT_PUBLIC_API_URL + API_V1_PREFIX.
 */
import { APIResponse, PaginatedResponse } from '../types';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`;

async function request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    token?: string
): Promise<T> {
    // TODO: Implement fetch with auth header, JSON body, and error handling
    throw new Error('Not implemented');
}

export const apiClient = {
    get:    <T>(endpoint: string, token?: string) =>
                request<T>('GET', endpoint, undefined, token),
    post:   <T>(endpoint: string, data: unknown, token?: string) =>
                request<T>('POST', endpoint, data, token),
    put:    <T>(endpoint: string, data: unknown, token?: string) =>
                request<T>('PUT', endpoint, data, token),
    delete: <T>(endpoint: string, token?: string) =>
                request<T>('DELETE', endpoint, undefined, token),
};

