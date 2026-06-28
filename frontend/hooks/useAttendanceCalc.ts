import { AttendanceRecord } from '../types';

export function useAttendanceCalc(record: AttendanceRecord) {
    const currentPercent = record.hours_conducted === 0
        ? 0
        : (record.hours_attended / record.hours_conducted) * 100;
        
    const target = record.target_percentage;
    const isDanger = currentPercent < target;
    
    let insight = "";
    if (isDanger) {
        const needed = Math.ceil((target * record.hours_conducted - 100 * record.hours_attended) / (100 - target));
        insight = `You need to attend the next ${needed} class${needed > 1 ? 'es' : ''} to reach your ${target}% target.`;
    } else {
        const skippable = Math.floor((100 * record.hours_attended - target * record.hours_conducted) / target);
        if (skippable > 0) {
            insight = `You can safely skip the next ${skippable} class${skippable > 1 ? 'es' : ''}.`;
        } else {
            insight = `You are exactly on track. Do not skip the next class.`;
        }
    }
    
    return { currentPercent, isDanger, insight };
}
