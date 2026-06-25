/**
 * API Endpoint Constants
 * Maps to API_SPEC.md. Never hardcode endpoint strings in services.
 */
export const API_ENDPOINTS = {
    // Auth
    AUTH_REGISTER:        '/auth/register',
    AUTH_LOGIN:           '/auth/login',

    // Dashboard
    DASHBOARD:            '/dashboard',

    // Tasks
    TASKS:                '/tasks',
    TASK_BY_ID:           (id: string) => `/tasks/${id}`,

    // Intelligence
    INTELLIGENCE_PROCESS: '/intelligence/process',

    // Automations (legacy trigger names)
    AUTOMATION_TASK:         '/automations/task-trigger',
    AUTOMATION_NOTICE:       '/automations/notice-trigger',
    AUTOMATION_SCHEDULE:     '/automations/schedule-trigger',

    // Automations (correct backend endpoints)
    AUTOMATIONS_LIST:        '/automations',
    AUTOMATION_TRIGGER:      (type: string) => `/automations/trigger/${type}`,
} as const;

