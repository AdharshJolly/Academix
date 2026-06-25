'use client';

import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

export default function CalendarPage() {
  const { data } = useDashboard();
  
  // Generating a simple static grid for the current month for demo purposes
  const daysInMonth = 30;
  const startingDay = 3; // Wednesday
  
  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border-r border-b border-white/5 bg-white/5 opacity-50"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      // Look for an event on this day (mock)
      const hasEvent = data?.calendar_preview.some(e => new Date(e.date).getDate() === i);
      
      days.push(
        <div key={`day-${i}`} className="min-h-[120px] p-2 border-r border-b border-white/5 hover:bg-white/5 transition-colors group relative">
          <span className="text-slate-400 font-medium group-hover:text-white transition-colors">{i}</span>
          {hasEvent && (
            <div className="mt-2 p-1.5 rounded bg-neonBlue/10 border border-neonBlue/20 text-xs font-medium text-neonBlue truncate">
              Exam/Event
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Calendar</h1>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neonGreen glow-green inline-block"></span>
            Synced with Google Calendar
          </p>
        </div>
        
        <div className="flex gap-4">
          <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10">
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex bg-white/5 rounded-lg border border-white/10">
            <button className="px-3 py-2 border-r border-white/10 hover:bg-white/10 text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <div className="px-6 py-2 font-medium text-white flex items-center justify-center min-w-[140px]">June 2026</div>
            <button className="px-3 py-2 border-l border-white/10 hover:bg-white/10 text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-black/20">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-sm font-semibold text-slate-400 border-r border-white/5 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {renderDays()}
        </div>
      </div>
    </div>
  );
}
