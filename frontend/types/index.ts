/**
 * Frontend Type Definitions
 * Must mirror backend Pydantic schemas exactly.
 * Source of truth: API_SPEC.md + backend/app/schemas/
 */

// ── Common Response Wrappers ──────────────────────────────────────────────

export interface APIResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    total: number;
    page: number;
    size: number;
}

export interface ErrorResponse {
    success: false;
    error_code: string;
    message: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface UserOut {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    google_calendar_connected?: boolean;
    whatsapp_number?: string;
    created_at?: string;
}

export interface AuthResponse {
    token: string;
    user: UserOut;
}

export interface UserLoginRequest {
    email: string;
    password: string;
}

export interface UserRegisterRequest {
    email: string;
    password: string;
    full_name?: string;
    whatsapp_number?: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export type TaskStatus   = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskCreate {
    title: string;
    description?: string;
    due_date?: string;       // ISO 8601: YYYY-MM-DD
    priority?: TaskPriority;
}

export interface TaskUpdate {
    title?: string;
    description?: string;
    due_date?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
}

export interface TaskResponse {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    created_at: string;
    updated_at: string;
}

// ── Intelligence ──────────────────────────────────────────────────────────

export type IntelligenceInputType = 'notice' | 'risk' | 'schedule';

export interface IntelligenceRequest {
    input_type: IntelligenceInputType;
    data: Record<string, unknown>;
}

export interface ExtractedEvent {
    title: string;
    date: string;
    type: string;        // exam | assignment | lecture | other
    subject?: string;
    location?: string;
}

export interface RiskFactor {
    factor: string;
    weight: number;
}

export interface RiskAssessment {
    risk_score: number;  // 0.0 – 1.0
    risk_level: string;  // low | medium | high | critical
    factors: RiskFactor[];
}

export interface Recommendation {
    action: string;
    priority: number;
    rationale?: string;
}

export interface ScheduleBlock {
    date: string;
    subject: string;
    duration_hours: number;
    session_type: string;  // study | revision | practice
}

export interface IntelligenceResponse {
    report_id: string;
    input_type: IntelligenceInputType;
    extracted_events: ExtractedEvent[];
    risk_assessment: RiskAssessment;
    recommendations: Recommendation[];
    study_schedule: ScheduleBlock[];
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface AcademicHealthCard {
    risk_level: string;
    risk_score: number;
    summary: string;
}

export interface NextRecommendedAction {
    action: string;
    priority: number;
    due_in_hours?: number;
}

export interface UpcomingDeadline {
    task_id: string;
    title: string;
    due_date: string;
    priority: TaskPriority;
    days_remaining: number;
}

export interface TodayScheduleItem {
    subject: string;
    duration_hours: number;
    session_type: string;
    start_time?: string;
}

export interface CalendarEvent {
    title: string;
    date: string;
    type: string;
}

export interface RecentAutomation {
    id: string;
    workflow_type: string;   // task | notice | schedule
    status: string;          // pending | success | failed
    triggered_at: string;
}

export interface DashboardResponse {
    academic_health: AcademicHealthCard;
    next_recommended_action?: NextRecommendedAction;
    upcoming_deadlines: UpcomingDeadline[];
    today_schedule: TodayScheduleItem[];
    calendar_preview: CalendarEvent[];
    recent_automations: RecentAutomation[];
}

// ── Automation ────────────────────────────────────────────────────────────

export interface TriggerRequest {
    type: 'task' | 'notice' | 'schedule';
    payload: Record<string, unknown>;
}

export interface TriggerResponse {
    workflow_type: string;
    status: string;
    log_id: string;
    message: string;
}

