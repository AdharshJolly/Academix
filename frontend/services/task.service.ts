/**
 * Task Service
 * CRUD operations for academic tasks.
 */
import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { TaskCreate, TaskUpdate, TaskResponse, APIResponse, PaginatedResponse } from '../types';

export const TaskService = {
    getTasks: (token: string): Promise<PaginatedResponse<TaskResponse>> =>
        apiClient.get(API_ENDPOINTS.TASKS, token),

    createTask: (data: TaskCreate, token: string): Promise<APIResponse<TaskResponse>> =>
        apiClient.post(API_ENDPOINTS.TASKS, data, token),

    updateTask: (id: string, data: TaskUpdate, token: string): Promise<APIResponse<TaskResponse>> =>
        apiClient.put(API_ENDPOINTS.TASK_BY_ID(id), data, token),

    deleteTask: (id: string, token: string): Promise<APIResponse<null>> =>
        apiClient.delete(API_ENDPOINTS.TASK_BY_ID(id), token),
};

