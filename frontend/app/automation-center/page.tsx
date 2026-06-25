'use client';

import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { Calendar as CalendarIcon, CheckSquare, FileText, Zap, Sparkles, Server, Terminal } from 'lucide-react';

export default function AutomationCenterPage() {
  const { data } = useDashboard();
  const [triggering, setTriggering] = useState<string | null>(null);

  const handleManualTrigger = (type: string) => {
    setTriggering(type);
    setTimeout(() => {
      setTriggering(null);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-8">
      
      <div className="flex items-end justify-between border-b border-vintage-ink/10 pb-6 mb-12 relative">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-2 relative z-10">
            command & control
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Automations</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-vintage-babyBlue/20 border-2 border-vintage-ink/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-mono font-bold text-xs uppercase tracking-widest text-vintage-ink/60">Systems Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        
        {/* Calendar Sync Card */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group border border-vintage-ink/5 relative transform -rotate-1 hover:rotate-0 transition-transform shadow-md bg-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-md shadow-sm transform rotate-3"></div>
          
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-vintage-babyBlue/10 text-vintage-ink border-2 border-dashed border-vintage-ink/20 group-hover:bg-vintage-crimson group-hover:text-white group-hover:border-transparent transition-all">
             <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest text-vintage-ink mb-4 border-b-2 border-vintage-ink/10 pb-4 w-full">Calendar Sync</h3>
          <p className="text-vintage-ink/80 text-base font-sans font-medium mb-8 flex-1">Push study schedules directly to your external calendar.</p>
          <button 
            onClick={() => handleManualTrigger('schedule')}
            disabled={triggering === 'schedule'}
            className="vintage-btn-outline w-full disabled:opacity-50"
          >
            {triggering === 'schedule' ? 'Syncing...' : 'Trigger Sync'}
          </button>
        </div>

        {/* Task Sync Card (Active/Primary) */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group relative transform scale-105 shadow-xl bg-[#73010b] text-[#fcf3cf] border-4 border-black z-10">
          <div className="absolute top-[-15px] left-[-15px] bg-[#fcf3cf] text-black text-xs font-mono font-black px-4 py-1 rounded-sm transform -rotate-12 shadow-md border-2 border-black z-20 uppercase tracking-widest">
            Primary Node
          </div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-black/20 border-2 border-[#fcf3cf]/20 backdrop-blur-sm">
             <CheckSquare className="w-8 h-8 text-[#fcf3cf]" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest mb-4 border-b-2 border-[#fcf3cf]/20 pb-4 w-full">Task Sync</h3>
          <p className="text-[#fcf3cf]/90 text-base font-sans font-medium mb-8 flex-1">Sync assignments from Canvas & Notion directly to CampusFlow.</p>
          <button 
            onClick={() => handleManualTrigger('task')}
            disabled={triggering === 'task'}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-[#fcf3cf] text-black font-mono font-black uppercase tracking-wider text-sm rounded-sm shadow-md hover:shadow-lg transition-all border-2 border-black disabled:opacity-50"
          >
             {triggering === 'task' ? 'Executing Protocol...' : 'Force Sync'}
          </button>
        </div>

        {/* Notice Scan Card */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group border border-vintage-ink/5 relative transform rotate-1 hover:rotate-0 transition-transform shadow-md bg-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-md shadow-sm transform -rotate-3"></div>

          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-vintage-babyBlue/10 text-vintage-ink border-2 border-dashed border-vintage-ink/20 group-hover:bg-vintage-crimson group-hover:text-white group-hover:border-transparent transition-all">
             <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest text-vintage-ink mb-4 border-b-2 border-vintage-ink/10 pb-4 w-full">Notice Scan</h3>
          <p className="text-vintage-ink/80 text-base font-sans font-medium mb-8 flex-1">Scan inbox for academic notices and extract intelligence.</p>
          <button 
            onClick={() => handleManualTrigger('notice')}
            disabled={triggering === 'notice'}
            className="vintage-btn-outline w-full disabled:opacity-50"
          >
             {triggering === 'notice' ? 'Processing...' : 'Trigger Scan'}
          </button>
        </div>
      </div>

      {/* Receipt Style Log */}
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Hardware Top bar */}
        <div className="h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-xl border-x-2 border-t-2 border-gray-500 shadow-inner flex items-center px-6 gap-4">
           <Server className="w-4 h-4 text-gray-600" />
           <span className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest">Syslog Output Terminal</span>
        </div>
        
        {/* Receipt Paper */}
        <div className="bg-[#fdfbf7] p-8 border-x-2 border-gray-300 relative shadow-2xl min-h-[300px]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '100% 24px' }}>
          
          <h3 className="text-xl font-mono font-black text-vintage-ink mb-8 border-b-2 border-dashed border-vintage-ink/30 pb-4 uppercase tracking-widest flex items-center gap-3">
            <Terminal className="w-5 h-5" />
            Execution Log
          </h3>
          
          <div className="space-y-6 font-mono">
            
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group">
              <span className="text-sm font-bold text-vintage-ink/50 w-24 shrink-0 mt-1">[10:42 AM]</span>
              <div className="flex-1 border-l-2 border-vintage-crimson pl-4 pb-2">
                <p className="font-bold text-vintage-ink text-base">SYNC_COMPLETE: Canvas Assignments</p>
                <p className="text-sm text-vintage-ink/70 mt-1 leading-relaxed">Extracted 3 new tasks. Detected mid-term for CS 301. Updated schedule blocks accordingly.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group">
              <span className="text-sm font-bold text-vintage-ink/50 w-24 shrink-0 mt-1">[08:15 AM]</span>
              <div className="flex-1 border-l-2 border-vintage-babyBlue pl-4 pb-2">
                <p className="font-bold text-vintage-ink text-base">SYNC_COMPLETE: Google Calendar</p>
                <p className="text-sm text-vintage-ink/70 mt-1 leading-relaxed">Pushed 4 study blocks to external calendar. No conflicts detected.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group">
              <span className="text-sm font-bold text-vintage-ink/50 w-24 shrink-0 mt-1">[YESTERDAY]</span>
              <div className="flex-1 border-l-2 border-vintage-ink/20 pl-4 pb-2">
                <p className="font-bold text-vintage-ink/60 text-base">SCAN_COMPLETE: Inbox</p>
                <p className="text-sm text-vintage-ink/50 mt-1 leading-relaxed">Processed 12 emails. 0 actionable notices found.</p>
              </div>
            </div>
            
          </div>
          
          {/* Fading bottom gradient for realism */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fdfbf7] to-transparent pointer-events-none"></div>
        </div>
        
        {/* Zig Zag Bottom (Torn Paper effect) */}
        <div className="h-4 w-full flex text-[#fdfbf7]">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="flex-1 border-b-[8px] border-l-[8px] border-r-[8px] border-transparent border-t-[#fdfbf7] drop-shadow-md"></div>
          ))}
        </div>
      </div>

    </div>
  );
}
