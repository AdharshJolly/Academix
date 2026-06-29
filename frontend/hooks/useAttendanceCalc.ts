import { AttendanceRecord, SubjectAnalytics } from '../types';

export function useAttendanceCalc(record: AttendanceRecord, analytics?: SubjectAnalytics) {
    const currentPercent = record.hours_conducted === 0
        ? 0
        : (record.hours_attended / record.hours_conducted) * 100;
        
    const target = record.target_percentage;
    const isDanger = currentPercent < target;
    
    let insight = "";
    if (analytics) {
        if (isDanger) {
            const needed = analytics.classes_to_attend_for_target;
            insight = `You need to attend the next ${needed} class${needed > 1 ? 'es' : ''} to reach your ${target}% target.`;
        } else {
            const skippable = analytics.classes_can_miss_for_target;
            if (skippable > 0) {
                insight = `You can safely skip the next ${skippable} class${skippable > 1 ? 'es' : ''}.`;
            } else {
                insight = `You are exactly on track. Do not skip the next class.`;
            }
        }
    } else {
        insight = isDanger ? "Loading insights..." : "Loading insights...";
    }
    
    return { currentPercent, isDanger, insight };
}
