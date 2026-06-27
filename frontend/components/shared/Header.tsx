'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Search, AlertCircle, Calendar, CheckSquare, Square, Trash2, Plus, Target, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { FocusTimerModal } from './FocusTimerModal';
import Link from 'next/link';

export function Header() {
  const { user } = useAuth();
  const { data } = useDashboard();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic tasks from Dashboard context
  const allTasks = useMemo(() => {
    const tasks = (data?.upcoming_deadlines || []).map(d => ({
      title: d.title,
      subject: 'General',
      type: d.priority === 'high' ? 'Important' : 'Task'
    }));
    
    const schedules = (data?.today_schedule || []).map(s => ({
      title: s.session_type,
      subject: s.subject || 'General',
      type: 'Study Session'
    }));
    
    return [...tasks, ...schedules];
  }, [data]);
  
  const searchResults = allTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic notifications from Dashboard context
  const notifications = useMemo(() => {
    const items: { id: string, title: string, subtitle: string, icon: any, href: string, isUrgent: boolean }[] = [];
    
    // Add urgent deadlines
    data?.upcoming_deadlines?.forEach(d => {
      if (d.priority === 'high' || d.days_remaining <= 2) {
        items.push({
          id: `deadline-${d.task_id}`,
          title: d.title,
          subtitle: `Due in ${d.days_remaining} day(s)`,
          icon: AlertCircle,
          href: '/workspace',
          isUrgent: true
        });
      }
    });

    // Add upcoming schedule block
    if (data?.today_schedule && data.today_schedule.length > 0) {
      const nextClass = data.today_schedule[0];
      items.push({
        id: `schedule-0`,
        title: `${nextClass.subject || 'General'} ${nextClass.session_type}`,
        subtitle: `Duration: ${nextClass.duration_hours}h`,
        icon: Calendar,
        href: '/calendar',
        isUrgent: false
      });
    }

    // Add recommendation if exists
    if (data?.next_recommended_action) {
      items.push({
        id: 'recommendation',
        title: data.next_recommended_action.action,
        subtitle: `Priority ${data.next_recommended_action.priority}`,
        icon: Zap,
        href: '/dashboard',
        isUrgent: data.next_recommended_action.priority >= 4
      });
    }

    return items;
  }, [data]);

  // Dynamic subjects based on schedule items
  const [subjects, setSubjects] = useState<{id: string, name: string, checked: boolean}[]>([]);
  
  useEffect(() => {
    if (data?.today_schedule) {
      const uniqueSubjects = Array.from(new Set(data.today_schedule.map(s => s.subject).filter(Boolean)));
      if (uniqueSubjects.length > 0 && subjects.length === 0) {
        const initialSubjects = uniqueSubjects.map((name, i) => ({
          id: String(i),
          name: name || 'General',
          checked: true
        }));
        setSubjects(initialSubjects);
      }
    }
  }, [data, subjects.length]);

  const [newSubject, setNewSubject] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setSubjects([...subjects, { id: Date.now().toString(), name: newSubject, checked: true }]);
    setNewSubject('');
  };

  const toggleSubject = (id: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  return (
    <header className="h-24 bg-transparent flex items-center justify-between px-10 sticky top-0 z-50">
      
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-[32rem]" ref={searchRef}>
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-vintage-crimson opacity-50 z-10" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus notices or subjects..." 
            onFocus={() => setIsSearchFocused(true)}
            className="w-full bg-white/90 border-2 border-transparent focus:border-vintage-crimson/30 rounded-full py-4 pl-14 pr-6 text-base font-mono font-bold text-vintage-ink placeholder:text-vintage-ink/40 focus:outline-none transition-all shadow-sm focus:shadow-md backdrop-blur-md relative z-10"
          />
          
          {/* Search Dropdown (Subjects or Results) */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-vintage-ink/10 rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {!searchQuery.trim() ? (
                /* Show Subjects when no search query */
                <>
                  <div className="bg-vintage-babyBlue/20 p-4 border-b border-vintage-ink/5">
                    <h4 className="font-mono font-bold text-vintage-ink uppercase tracking-wider text-sm">Subject Filters</h4>
                    <p className="text-xs font-mono text-vintage-ink/50 mt-1">Select subjects to include in search</p>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto p-2">
                    {subjects.length > 0 ? (
                      subjects.map(subject => (
                        <div key={subject.id} className="flex items-center justify-between p-3 hover:bg-vintage-crimson/5 rounded-md transition-colors group">
                          <div 
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => toggleSubject(subject.id)}
                          >
                            <div className={subject.checked ? 'text-vintage-crimson' : 'text-vintage-ink/30'}>
                              {subject.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </div>
                            <span className={`font-mono font-bold text-sm ${subject.checked ? 'text-vintage-ink' : 'text-vintage-ink/50'}`}>
                              {subject.name}
                            </span>
                          </div>
                          <button 
                            onClick={() => deleteSubject(subject.id)}
                            className="p-2 text-vintage-ink/20 hover:text-vintage-crimson hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-sm font-mono text-vintage-ink/50 border border-dashed border-vintage-ink/20 p-4 rounded-lg bg-vintage-ink/5">No subjects added yet.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-vintage-ink/10 bg-white/50">
                    <form onSubmit={handleAddSubject} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Add new subject..."
                        className="flex-1 bg-white border border-vintage-ink/20 rounded-md px-3 py-2 text-sm font-mono focus:border-vintage-crimson focus:outline-none"
                      />
                      <button type="submit" className="bg-vintage-crimson text-white p-2 rounded-md hover:bg-[#5a0008] transition-colors" title="Add Subject">
                        <Plus className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* Show Search Results when searching */
                <>
                  <div className="bg-vintage-ink p-4 border-b border-vintage-ink/5 flex justify-between items-center">
                    <h4 className="font-mono font-bold text-white uppercase tracking-wider text-sm">Search Results</h4>
                    <span className="text-xs font-mono bg-white/20 text-white px-2 py-0.5 rounded-full">{searchResults.length} found</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 hover:bg-vintage-crimson/5 rounded-md transition-colors cursor-pointer group border-b border-vintage-ink/5 last:border-b-0">
                          <div className="w-2 h-2 rounded-full bg-vintage-crimson mt-2"></div>
                          <div>
                            <p className="font-bold text-vintage-ink text-sm group-hover:text-vintage-crimson">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono font-bold bg-vintage-babyBlue/30 text-vintage-ink px-2 py-0.5 rounded">{task.subject}</span>
                              <span className="text-xs font-mono text-vintage-ink/50">{task.type}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm font-mono text-vintage-ink/50 border border-dashed border-vintage-ink/20 p-4 rounded-lg bg-vintage-ink/5">
                          No tasks found for "{searchQuery}".
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-8 relative">
        
        <div className="flex items-center gap-2">
          <p className="font-accent text-2xl text-vintage-crimsonLight transform -rotate-3 mt-2">
            stay updated
          </p>
          
          <button 
            onClick={() => setShowFocusTimer(true)}
            className="p-3 bg-white text-vintage-ink/70 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:text-vintage-ink transition-all"
            title="Focus Mode"
          >
            <Target className="w-6 h-6" />
          </button>
          <FocusTimerModal isOpen={showFocusTimer} onClose={() => setShowFocusTimer(false)} />
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 bg-white text-vintage-crimson rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-vintage-crimson border-2 border-white rounded-full animate-pulse"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-vintage-ink/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-vintage-babyBlue/20 p-4 border-b border-vintage-ink/5 flex justify-between items-center">
                  <h4 className="font-mono font-bold text-vintage-ink uppercase tracking-wider text-sm">Action Items</h4>
                  <span className="text-xs font-mono font-bold bg-vintage-crimson text-white px-2 py-0.5 rounded-full">{notifications.length} New</span>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => {
                      const Icon = notif.icon;
                      return (
                        <Link key={notif.id} href={notif.href} className={`flex items-start gap-3 p-3 hover:bg-vintage-crimson/5 rounded-md transition-colors cursor-pointer group ${index > 0 ? 'border-t border-vintage-ink/5' : ''}`}>
                          <Icon className={`w-5 h-5 mt-0.5 ${notif.isUrgent ? 'text-vintage-crimson' : 'text-vintage-babyBlue'}`} />
                          <div>
                            <p className="font-bold text-vintage-ink text-sm group-hover:text-vintage-crimson">{notif.title}</p>
                            <p className="text-xs font-mono text-vintage-ink/50 mt-1">{notif.subtitle}</p>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm font-mono text-vintage-ink/50">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Link href="/profile" className="flex items-center gap-4 pl-8 border-l border-vintage-ink/10 cursor-pointer group">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-base font-display font-black text-vintage-crimson leading-tight group-hover:text-vintage-ink transition-colors">{user?.full_name || 'Demo User'}</span>
            <span className="text-sm font-mono text-vintage-ink/60 tracking-tight">{user?.email || 'demo@academix.edu'}</span>
          </div>
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-vintage-paper group-hover:scale-105 transition-transform flex-shrink-0">
            <img 
              src={user?.avatar_url || '/avatars/doodle_dog.png'} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
