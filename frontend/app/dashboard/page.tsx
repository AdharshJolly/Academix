'use client';

import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { ShieldAlert, Target, Calendar, Clock, Activity, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-neonBlue border-t-transparent animate-spin"></div>
          <p className="text-neonBlue animate-pulse font-medium">Aggregating Academic Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="glass-panel p-6 rounded-xl border border-neonRed/20 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-neonRed mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sync Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-400 mt-1">Here is your academic overview for today.</p>
        </div>
        <Link href="/workspace">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neonBlue/10 text-neonBlue border border-neonBlue/20 hover:bg-neonBlue/20 transition-colors font-medium">
            <Zap className="w-4 h-4" />
            Process New Notice
          </button>
        </Link>
      </div>

      {/* Top Row: Health & Next Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Health Card */}
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-neonGreen relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neonGreen/10 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-neonGreen/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-neonGreen">
              <Activity className="w-5 h-5" />
              <h2 className="font-semibold uppercase tracking-wider text-sm">Academic Health</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-neonGreen/10 text-neonGreen text-xs font-bold border border-neonGreen/20">
              {data.academic_health.risk_level.toUpperCase()} RISK
            </div>
          </div>
          <div className="flex items-end gap-4 mb-2">
            <span className="text-4xl font-bold text-white">{(100 - (data.academic_health.risk_score * 100)).toFixed(0)}%</span>
            <span className="text-slate-400 mb-1">Safety Score</span>
          </div>
          <p className="text-slate-300 text-sm mt-4">{data.academic_health.summary}</p>
        </div>

        {/* Next Recommended Action */}
        {data.next_recommended_action && (
          <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-neonPurple relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neonPurple/10 rounded-full blur-[50px] -mr-10 -mt-10 group-hover:bg-neonPurple/20 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-neonPurple">
                <Target className="w-5 h-5" />
                <h2 className="font-semibold uppercase tracking-wider text-sm">Priority Action</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs font-medium">
                Due in {data.next_recommended_action.due_in_hours}h
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{data.next_recommended_action.action}</h3>
            <Link href="/workspace" className="inline-flex items-center gap-2 text-sm text-neonPurple hover:text-white mt-2 transition-colors">
              Open Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Middle Row: Schedule & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Schedule */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="w-5 h-5 text-neonBlue" />
              <h2 className="font-semibold text-lg">Today's Schedule</h2>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
            {data.today_schedule.length > 0 ? (
              data.today_schedule.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col items-center justify-center px-4 border-r border-white/10">
                    <span className="text-neonBlue font-bold">{item.start_time?.split(' ')[0] || '12:00'}</span>
                    <span className="text-xs text-slate-400">{item.start_time?.split(' ')[1] || 'PM'}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{item.subject}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                      <span className="capitalize px-2 py-0.5 rounded bg-white/5">{item.session_type}</span>
                      <span>{item.duration_hours}h block</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">No scheduled blocks today.</div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-200">
              <Calendar className="w-5 h-5 text-neonOrange" />
              <h2 className="font-semibold text-lg">Upcoming Deadlines</h2>
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            {data.upcoming_deadlines.length > 0 ? (
              data.upcoming_deadlines.map((deadline) => (
                <div key={deadline.task_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${deadline.priority === 'high' ? 'bg-neonRed glow-red' : deadline.priority === 'medium' ? 'bg-neonOrange' : 'bg-neonBlue'}`}></div>
                    <div>
                      <h4 className="text-sm font-medium text-white">{deadline.title}</h4>
                      <p className="text-xs text-slate-400">Due {new Date(deadline.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${deadline.days_remaining <= 2 ? 'bg-neonRed/10 text-neonRed border border-neonRed/20' : 'bg-white/5 text-slate-300'}`}>
                    {deadline.days_remaining}d left
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">No upcoming deadlines.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
