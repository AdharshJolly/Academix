'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Zap, CheckCircle, Clock, Star } from 'lucide-react';

interface GoogleSyncModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  onConnect: () => void;
  onSkip: () => void;
}

export default function GoogleSyncModal({
  isOpen,
  isLoading,
  error,
  onConnect,
  onSkip,
}: GoogleSyncModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-vintage-ink/40 backdrop-blur-sm"
            onClick={onSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md relative">
              {/* Striped accent behind card */}
              <div className="absolute -inset-3 striped-bg rounded-2xl opacity-60 z-0" />

              <div className="vintage-panel bg-vintage-paper rounded-xl shadow-2xl border border-vintage-ink/10 p-8 relative z-10">
                {/* Skip button */}
                <button
                  onClick={onSkip}
                  className="absolute top-4 right-4 text-vintage-ink/40 hover:text-vintage-crimson transition-colors"
                  aria-label="Skip"
                >
                  <X size={18} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-vintage-crimson/10 flex items-center justify-center">
                      <Calendar size={32} className="text-vintage-crimson" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-vintage-crimson flex items-center justify-center">
                      <Zap size={12} className="text-white" />
                    </div>
                  </div>

                  <h4 className="font-accent text-lg text-vintage-crimsonLight transform -rotate-1 mb-1">
                    one last step!
                  </h4>
                  <h2 className="text-3xl font-display font-black text-vintage-crimson tracking-tighter leading-tight">
                    Sync Your Calendar
                  </h2>
                  <p className="font-mono text-vintage-ink/60 text-sm mt-3 leading-relaxed">
                    Connect Google Calendar so Academix can automatically schedule study sessions, track deadlines, and send smart reminders.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6 bg-white/40 rounded-lg p-4 border border-vintage-ink/5">
                  {[
                    { icon: CheckCircle, text: 'Auto-schedule study sessions' },
                    { icon: Clock, text: 'Deadline reminders on your calendar' },
                    { icon: Star, text: 'AI-optimised daily planner' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon size={15} className="text-vintage-crimson flex-shrink-0" />
                      <span className="font-mono text-xs text-vintage-ink/70">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 bg-vintage-crimson/10 border border-vintage-crimson/30 rounded-md p-3 font-mono text-xs text-vintage-crimson">
                    ⚠ {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={onConnect}
                    disabled={isLoading}
                    className="vintage-btn w-full gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Connecting…
                      </span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Connect Google Calendar
                      </>
                    )}
                  </button>

                  <button
                    onClick={onSkip}
                    className="vintage-btn-outline w-full text-vintage-ink/50 border-vintage-ink/20 hover:border-vintage-ink/40 hover:text-vintage-ink text-xs"
                  >
                    Skip for now (you can connect later in Settings)
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
