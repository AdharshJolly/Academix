'use client';

import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { ShieldAlert, Target, Calendar, Clock, Activity, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-vintage-crimson border-t-transparent animate-spin rounded-full"></div>
          <p className="text-sm font-mono font-bold tracking-widest text-vintage-crimson uppercase">Fetching Intel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="vintage-panel p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-vintage-crimson mx-auto mb-6" />
          <h2 className="text-2xl font-display font-black text-vintage-crimson mb-4">Sync Error</h2>
          <p className="text-vintage-ink/80 mb-8 font-mono text-sm tracking-tight">{error}</p>
          <button className="vintage-btn w-full">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-10 px-8">
      
      <div className="flex items-end justify-between border-b border-vintage-ink/10 pb-6 relative">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-2 relative z-10">
            welcome back!
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Overview</h1>
        </div>
        <Link href="/workspace">
          <button className="vintage-btn group">
            <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            File Report
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Academic Health Card */}
        <div className="vintage-panel p-8 flex flex-col justify-between group bg-white border border-vintage-ink/10 relative overflow-hidden shadow-md transform rotate-1 hover:rotate-0 transition-transform">
          
          {/* Graph paper pattern background */}
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #73010b 1px, transparent 1px), linear-gradient(to bottom, #73010b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          {/* Clipboard clip at the top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-lg shadow-sm border border-gray-400 flex items-center justify-center">
             <div className="w-16 h-2 bg-gray-500 rounded-full opacity-50"></div>
          </div>
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full border-2 border-gray-500/30"></div>
          
          <div className="flex justify-between items-start mb-12 relative z-10 pt-4">
            <h2 className="font-mono font-bold text-base tracking-wider text-vintage-ink/80 border-b border-vintage-ink/20 pb-2 inline-block bg-white/80 px-2">ACADEMIC HEALTH</h2>
            <div className="px-3 py-1 bg-vintage-crimson text-white text-sm font-mono font-bold rounded-md shadow-sm transform -rotate-2">
              Risk: {data.academic_health.risk_level}
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-end gap-6 mb-6">
              <div className="bg-white px-4 py-2 border-2 border-vintage-ink rounded-lg shadow-[4px_4px_0px_#2b2b2b] flex items-baseline gap-2 transform -rotate-2">
                <span className="text-7xl font-display font-black text-vintage-ink leading-none tracking-tighter">
                  {(100 - (data.academic_health.risk_score * 100)).toFixed(0)}
                </span>
                <span className="text-xl font-mono font-bold text-vintage-ink/40">/100</span>
              </div>
              <span className="font-accent text-3xl text-vintage-crimson transform rotate-3 pb-2">Safety<br/>Score</span>
            </div>
            
            <div className="bg-white border-l-4 border-l-vintage-crimson p-4 shadow-sm relative">
              <p className="text-vintage-ink font-mono text-base font-medium leading-relaxed tracking-tight">
                {data.academic_health.summary}
              </p>
              {/* Doctor's signature scribble */}
              <p className="font-accent text-2xl text-vintage-ink/40 absolute -bottom-6 -right-2 transform -rotate-6">dr. flow</p>
            </div>
          </div>
        </div>

        {/* Next Recommended Action */}
        {data.next_recommended_action && (
          <div className="vintage-panel p-8 flex flex-col justify-between group relative overflow-hidden bg-[#73010b] text-[#fcf3cf] shadow-xl border-4 border-[#73010b] rounded-sm transform rotate-1 hover:rotate-0 transition-transform">
            
            {/* Folder Tab Fake Out */}
            <div className="absolute top-0 left-0 w-32 h-6 bg-[#5a0008] rounded-br-2xl"></div>

            {/* Top Secret Stamp */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-[#fcf3cf]/10 text-[#fcf3cf]/10 font-display font-black text-6xl uppercase tracking-tighter transform -rotate-12 pointer-events-none p-4 rounded-lg">
              Classified
            </div>

            {/* Paper clip doodle */}
            <div className="absolute top-4 right-4 transform rotate-12 opacity-80 z-20">
              <svg className="w-12 h-12 text-[#fcf3cf]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            </div>

            <div className="flex justify-between items-start mb-12 relative z-10 pt-4">
              <h2 className="font-mono font-bold text-base tracking-wider text-[#fcf3cf]/80 border-b border-[#fcf3cf]/20 pb-2 inline-block">PRIORITY DIRECTIVE</h2>
              <div className="px-3 py-1 bg-black text-[#fcf3cf] text-sm font-mono font-bold rounded-sm shadow-sm">
                T-Minus {data.next_recommended_action.due_in_hours}h
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-4xl font-display font-black text-white tracking-tight leading-tight mb-8">
                {data.next_recommended_action.action}
              </h3>
              
              <Link href="/workspace" className="inline-flex items-center justify-between px-6 py-4 bg-[#fcf3cf] text-[#73010b] font-mono font-bold tracking-wider text-base rounded-sm shadow-md hover:shadow-lg transition-all w-full border-2 border-black group-hover:-translate-y-1">
                <span className="uppercase">Execute Directive</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-vintage-ink/10 relative">
        {/* Fun doodle connecting the columns */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none hidden lg:block">
           <svg className="w-16 h-16 text-vintage-crimson" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2"><path d="M50 0 L 50 100 M 40 10 L 60 10 M 40 90 L 60 90"/></svg>
        </div>
        
        {/* Today's Schedule */}
        <div>
          <h2 className="font-display font-black text-3xl text-vintage-crimson tracking-tight mb-8 flex items-center gap-4">
            Today's Roster
          </h2>
          
          <div className="space-y-4">
            {data.today_schedule.length > 0 ? (
              data.today_schedule.map((item, idx) => (
                <div key={idx} className="vintage-panel p-5 flex gap-6 hover:bg-vintage-babyBlue/10 transition-colors border-l-4 border-l-vintage-crimson">
                  <div className="flex flex-col items-center justify-center w-24 border-r border-vintage-ink/10 pr-6">
                    <span className="text-2xl font-display font-black text-vintage-crimson">{item.start_time?.split(' ')[0] || '12:00'}</span>
                    <span className="text-sm font-mono font-bold text-vintage-ink/50 uppercase">{item.start_time?.split(' ')[1] || 'PM'}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-vintage-ink tracking-tight mb-2">{item.subject}</h4>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-vintage-babyBlue/30 text-vintage-crimson text-sm font-mono font-bold rounded">
                        {item.session_type}
                      </span>
                      <span className="text-sm font-mono font-bold text-vintage-ink/50">{item.duration_hours}h block</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="vintage-panel p-10 text-center border border-dashed border-vintage-ink/20 bg-[#f8f5f1]">
                <p className="font-mono text-base text-vintage-ink/50">No scheduled blocks today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <h2 className="font-display font-black text-3xl text-vintage-crimson tracking-tight mb-8 flex items-center gap-4">
            Impending Targets
          </h2>
          
          <div className="space-y-4">
            {data.upcoming_deadlines.length > 0 ? (
              data.upcoming_deadlines.map((deadline) => (
                <div key={deadline.task_id} className="vintage-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex flex-col relative pl-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-vintage-babyBlue"></div>
                    <h4 className="text-lg font-bold text-vintage-ink tracking-tight mb-1">{deadline.title}</h4>
                    <p className="text-sm font-mono font-bold text-vintage-ink/50">Due: {new Date(deadline.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-4 py-2 text-sm font-mono font-bold rounded-md text-center shadow-sm ${deadline.days_remaining <= 2 ? 'bg-vintage-crimson text-white transform rotate-2' : 'bg-vintage-babyBlue/20 text-vintage-ink border border-vintage-ink/10'}`}>
                    {deadline.days_remaining} Days Left
                  </div>
                </div>
              ))
            ) : (
              <div className="vintage-panel p-10 text-center border border-dashed border-vintage-ink/20 bg-[#f8f5f1]">
                <p className="font-mono text-base text-vintage-ink/50">No upcoming targets.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
