'use client';

import React from 'react';
import { Bell, Search, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search campus notices..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-neonBlue transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neonPurple/10 border border-neonPurple/20 text-neonPurple text-xs font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-neonPurple animate-pulse"></span>
          Mock DB Fallback Active
        </div>

        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neonRed glow-red"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-white">{user?.full_name || 'Demo User'}</span>
            <span className="text-xs text-slate-400">{user?.email || 'demo@campusflow.edu'}</span>
          </div>
          <img 
            src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
            alt="Avatar" 
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 p-0.5 object-cover"
          />
        </div>
      </div>
    </header>
  );
}
