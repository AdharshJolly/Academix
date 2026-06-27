import { apiClient } from './api';
import { APIResponse, AttendanceRecord, AttendanceRecordCreate, AttendanceRecordUpdate } from '../types';

export class AttendanceService {
    static async getRecords(token: string): Promise<APIResponse<AttendanceRecord[]>> {
        return apiClient.get<APIResponse<AttendanceRecord[]>>('/attendance', token);
    }

    static async createRecord(data: AttendanceRecordCreate, token: string): Promise<APIResponse<AttendanceRecord>> {
        return apiClient.post<APIResponse<AttendanceRecord>>('/attendance', data, token);
    }

    static async updateRecord(id: string, data: AttendanceRecordUpdate, token: string): Promise<APIResponse<AttendanceRecord>> {
        return apiClient.put<APIResponse<AttendanceRecord>>(`/attendance/${id}`, data, token);
    }

    static async deleteRecord(id: string, token: string): Promise<APIResponse<null>> {
        return apiClient.delete<APIResponse<null>>(`/attendance/${id}`, token);
    }
}
