'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Calendar, Zap, Settings, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspace', label: 'Workspace', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/automation-center', label: 'Automations', icon: Zap },
];

const bottomItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-transparent h-full flex flex-col z-20">
      
      {/* Branding */}
      <div className="h-24 flex flex-col items-center justify-center border-b border-vintage-ink/10 px-6 relative overflow-hidden">
        <h1 className="text-3xl font-display font-black tracking-tight text-vintage-crimson">
          CampusFlow
        </h1>
        <p className="font-accent text-xl text-vintage-crimsonLight transform -rotate-2">
          steal these!
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-4 flex flex-col gap-2 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all font-mono font-bold text-base tracking-wider ${
                  isActive 
                    ? 'bg-vintage-crimson text-white shadow-md -translate-y-0.5' 
                    : 'text-vintage-ink/70 hover:bg-vintage-crimson/5 hover:text-vintage-crimson'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-vintage-ink/10">
        <div className="flex flex-col gap-2">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all font-mono font-bold text-sm tracking-wider ${
                    isActive 
                      ? 'bg-vintage-crimson text-white shadow-sm' 
                      : 'text-vintage-ink/70 hover:bg-vintage-crimson/5 hover:text-vintage-crimson'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
    </aside>
  );
}
