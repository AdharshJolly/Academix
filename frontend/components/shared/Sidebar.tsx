'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Calendar as CalendarIcon, Settings, User, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspace', href: '/workspace', icon: CheckSquare },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Automations', href: '/automation-center', icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="w-64 glass-panel border-r border-white/5 flex flex-col justify-between hidden md:flex h-screen sticky top-0">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-neonBlue to-neonPurple flex items-center justify-center glow-blue">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-wide text-white">
              CampusFlow
            </span>
          </Link>
        </div>
        
        <nav className="p-4 space-y-2 mt-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-neonBlue drop-shadow-[0_0_8px_rgba(0,242,254,0.8)]' : ''}`} />
                  <span className="font-medium relative z-10">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/5 space-y-2">
        <Link href="/profile">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/profile' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </div>
        </Link>
        <Link href="/settings">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/settings' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-400 hover:text-neonRed hover:bg-neonRed/10">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
