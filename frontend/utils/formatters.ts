/**
 * UI Formatting Utilities
 */

export function formatDate(dateStr: string): string {
    // TODO: Format ISO date to human-readable
    return dateStr;
}

export function formatRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    // TODO: Map 0.0-1.0 score to risk level string
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.85) return 'high';
    return 'critical';
}

export function formatDaysRemaining(dueDateStr: string): number {
    // TODO: Calculate days between now and due date
    return 0;
}

