import React from 'react';
import { AlertCircle } from 'lucide-react';

export function EmptyState({ icon: Icon, title, subtitle, action }: { icon: any, title: string, subtitle: string, action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white/40 rounded-2xl border-2 border-dashed border-vintage-ink/10 h-64">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-vintage-ink/5 flex items-center justify-center mb-4 text-vintage-ink/60">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-vintage-ink font-display mb-2">{title}</h3>
            <p className="text-sm text-vintage-ink/60 font-mono mb-4 max-w-sm">
                {subtitle}
            </p>
            {action}
        </div>
    );
}

export function ErrorState({ title = "Error", message, onRetry }: { title?: string, message: string, onRetry?: () => void }) {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border-4 border-vintage-ink shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] text-center relative overflow-hidden">
                <h2 className="text-2xl font-display font-black text-vintage-crimson mb-4">{title}</h2>
                <p className="text-vintage-ink/80 mb-8 font-mono text-sm tracking-tight">{message}</p>
                {onRetry && (
                    <button 
                        onClick={onRetry}
                        className="w-full bg-vintage-ink text-vintage-cream font-bold font-mono tracking-wider py-4 rounded-xl hover:bg-vintage-ink/90 transition-all uppercase text-sm border-2 border-transparent hover:border-vintage-ink active:scale-[0.98]"
                    >
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
}
