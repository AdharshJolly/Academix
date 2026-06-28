import React from 'react';

export function PriorityBadge({ priority }: { priority: string | undefined }) {
    const p = (priority || 'medium').toLowerCase();
    
    let colorClass = 'bg-vintage-cream text-vintage-ink/60 border border-vintage-parchment'; // low or default
    if (p === 'high') {
        colorClass = 'bg-vintage-crimsonLight/20 text-vintage-crimson';
    } else if (p === 'medium') {
        colorClass = 'bg-vintage-sage/20 text-vintage-sage';
    }

    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
            {p}
        </span>
    );
}

export function StatusBadge({ status }: { status: string | undefined }) {
    const s = (status || 'pending').toLowerCase();
    
    let colorClass = 'bg-vintage-cream text-vintage-ink/60 border border-vintage-parchment';
    let label = s;

    if (s === 'pending') {
        colorClass = 'bg-vintage-parchment text-vintage-ink/80';
        label = 'Pending';
    } else if (s === 'in_progress' || s === 'in progress') {
        colorClass = 'bg-blue-100 text-blue-700';
        label = 'In Progress';
    } else if (s === 'completed' || s === 'done') {
        colorClass = 'bg-vintage-sage/20 text-vintage-sage';
        label = 'Completed';
    } else if (s === 'overdue') {
        colorClass = 'bg-vintage-crimsonLight/20 text-vintage-crimson';
        label = 'Overdue';
    }

    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
            {label}
        </span>
    );
}
