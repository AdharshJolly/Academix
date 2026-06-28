import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

export const FormField = ({ label, ...props }: Props) => (
    <div className="flex flex-col">
        <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-1 uppercase tracking-widest">
            {label}
        </label>
        <input 
            className="w-full bg-white border-2 border-vintage-ink/10 rounded-md p-3 font-mono focus:border-vintage-crimson focus:outline-none transition-colors"
            {...props} 
        />
    </div>
);
