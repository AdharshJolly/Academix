import React from 'react';

interface Props {
    label: string;
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
}

export const CounterControl = ({ label, value, onDecrement, onIncrement }: Props) => (
    <div className="flex items-center justify-between bg-vintage-ink/5 p-2 rounded-md border border-vintage-ink/10">
        <span className="font-mono text-xs font-bold text-vintage-ink/60 uppercase">{label}</span>
        <div className="flex items-center gap-3">
            <button onClick={onDecrement} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-vintage-ink hover:text-vintage-crimson font-mono font-bold">-</button>
            <span className="font-mono font-bold text-vintage-ink w-6 text-center">{value}</span>
            <button onClick={onIncrement} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-vintage-ink hover:text-vintage-babyBlue font-mono font-bold">+</button>
        </div>
    </div>
);
