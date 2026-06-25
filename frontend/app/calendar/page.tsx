'use client';

import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { ChevronLeft, ChevronRight, RefreshCw, X, CheckSquare, Square } from 'lucide-react';
import { CalendarEvent } from '../../types';

export default function CalendarPage() {
  const { data } = useDashboard();
  
  const daysInMonth = 30;
  const startingDay = 3; 
  
  // Local state for interacting with the calendar
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [importantTasks, setImportantTasks] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for mocked new tasks
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [localTasks, setLocalTasks] = useState<Record<number, CalendarEvent[]>>({});

  const SUGGESTED_SUBJECTS = ['CS 301', 'MATH 201', 'PHYS 101', 'ENG 101', 'CHEM 101'];

  const toggleTask = (taskTitle: string) => {
    setCompletedTasks(prev => ({ ...prev, [taskTitle]: !prev[taskTitle] }));
  };

  const toggleImportant = (e: React.MouseEvent, taskTitle: string) => {
    e.stopPropagation();
    setImportantTasks(prev => ({ ...prev, [taskTitle]: !prev[taskTitle] }));
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    let events = data?.calendar_preview || [];
    
    // Add mock data if backend has no events so the calendar isn't empty
    if (events.length === 0) {
      events = [
        { title: 'CS 301: Algorithms Midterm', date: '2026-06-14', type: 'Exam' },
        { title: 'CS 301: Project Proposal Due', date: '2026-06-14', type: 'Assignment' },
        { title: 'Personal: Career Fair', date: '2026-06-18', type: 'Event' },
        { title: 'MATH 201: Study Group', date: '2026-06-05', type: 'Personal' },
        { title: 'PHYS 101: Lab Report', date: '2026-06-22', type: 'Assignment' }
      ];
    }
    
    return events.filter(e => {
      const isCorrectDay = new Date(e.date).getDate() === day;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      return isCorrectDay && matchesSearch;
    });
  };
  
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim() || !newSubjectInput.trim() || selectedDay === null) return;
    
    const newTask: CalendarEvent = {
      title: `${newSubjectInput}: ${newTaskInput}`,
      date: `2026-06-${selectedDay.toString().padStart(2, '0')}`,
      type: 'Personal'
    };
    
    setLocalTasks(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newTask]
    }));
    setNewTaskInput('');
    setNewSubjectInput('');
  };

  const renderDays = () => {
    const days = [];
    
    // Empty days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[140px] p-2 border-r border-b border-vintage-ink/10 relative overflow-hidden bg-vintage-ink/[0.02]">
        </div>
      );
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const serverEvents = getEventsForDay(i);
      const userEvents = localTasks[i] || [];
      const allEventsForDay = [...serverEvents, ...userEvents];
      const pendingEvents = allEventsForDay.filter(e => !completedTasks[e.title]);
      
      const hasEvent = allEventsForDay.length > 0;
      const isSelected = selectedDay === i;
      
      // Cycle colors for bookmarks
      const colors = [
        'bg-vintage-crimson text-white', 
        'bg-vintage-babyBlue text-vintage-ink', 
        'bg-[#E5B5B5] text-vintage-crimson', 
        'bg-vintage-ink text-white'
      ];
      const colorClass = colors[i % colors.length];

      days.push(
        <div 
          key={`day-${i}`} 
          onClick={() => setSelectedDay(i)}
          className={`min-h-[140px] p-2 border-r border-b border-vintage-ink/10 transition-all group relative flex flex-col items-start justify-start overflow-hidden cursor-pointer
            ${isSelected ? 'bg-vintage-crimson/5 shadow-inner' : 'hover:bg-vintage-crimson/5'}`}
        >
          {/* Faint ruled lines for background texture on each day */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '100% 24px', backgroundPosition: '0 24px' }}></div>

          <div className="relative pl-2 pt-2 z-10">
            <span className={`font-accent text-3xl transition-colors relative z-10 ${isSelected ? 'text-vintage-crimson font-black' : 'group-hover:text-vintage-crimson'}`}>
              {i}
            </span>
            {/* Hand-drawn red circle selection mark */}
            {isSelected && (
              <svg className="absolute -top-1.5 -left-1.5 w-12 h-12 text-vintage-crimson pointer-events-none z-0 opacity-70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M50 15 C 75 10, 90 35, 80 60 C 70 90, 20 85, 15 55 C 10 30, 30 15, 60 20" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 w-full mt-2 space-y-1 relative z-10 overflow-hidden px-1">
            {pendingEvents.slice(0, 3).map((event, idx) => (
              <div key={idx} className="text-[10px] font-mono font-bold truncate px-2 py-1 bg-white/80 border border-vintage-ink/5 rounded-sm shadow-sm flex items-center gap-1.5" title={event.title}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${importantTasks[event.title] ? 'bg-vintage-crimson' : 'bg-vintage-babyBlue'}`}></div>
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {pendingEvents.length > 3 && (
              <div className="text-[10px] font-mono font-bold text-vintage-ink/50 pl-2 pt-1">
                +{pendingEvents.length - 3} more...
              </div>
            )}
          </div>
          
          {hasEvent && (
            <div className={`absolute top-0 right-2 w-4 h-8 shadow-sm flex items-end justify-center pb-1 rounded-b-sm ${colorClass} transition-all duration-300 z-10 opacity-70`}></div>
          )}
          
          {/* Fun little scribble on hover */}
          <div className={`absolute top-2 right-2 transition-opacity z-10 pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <svg className="w-8 h-8 text-vintage-crimsonLight" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 50 Q 25 20 50 50 T 90 50"/></svg>
          </div>
        </div>
      );
    }
    
    // Empty days after the end of month (up to 35 total grid cells if startingDay=3, 30 days = 33 cells, so 2 empty days at end)
    const remainingDays = 35 - (startingDay + daysInMonth);
    for (let i = 0; i < remainingDays; i++) {
      days.push(
        <div key={`empty-end-${i}`} className="min-h-[140px] p-2 border-r border-b border-vintage-ink/10 relative overflow-hidden bg-vintage-ink/[0.02]">
        </div>
      );
    }

    return days;
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const currentDayEvents = [...selectedEvents, ...(localTasks[selectedDay || 0] || [])];

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-8 relative">
      
      <div className="flex items-end justify-between pb-6 mb-10 relative">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-1 relative z-10">
            temporal overview
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Calendar</h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            placeholder="Search calendar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vintage-input py-2 px-4 text-sm bg-white/50 border-vintage-ink/20 focus:border-vintage-crimson w-48 transition-all focus:w-64"
          />
          <button className="p-3 bg-white border border-vintage-ink/10 rounded-full text-vintage-ink/60 hover:text-vintage-crimson hover:shadow-sm transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex items-center bg-white rounded-full border border-vintage-ink/10 shadow-sm overflow-hidden">
            <button className="px-5 py-3 hover:bg-vintage-crimson/5 transition-colors"><ChevronLeft className="w-5 h-5 text-vintage-ink/60" /></button>
            <div className="px-8 py-3 font-mono font-bold text-sm text-vintage-ink flex items-center justify-center min-w-[160px] border-l border-r border-vintage-ink/5">JUNE 2026</div>
            <button className="px-5 py-3 hover:bg-vintage-crimson/5 transition-colors"><ChevronRight className="w-5 h-5 text-vintage-ink/60" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#fdfbf7] rounded-sm shadow-xl border-2 border-vintage-ink/20 overflow-hidden relative">
        {/* Fake spiral binding holes at top */}
        <div className="absolute top-0 left-0 w-full h-6 flex justify-around items-center px-8 bg-gray-200 border-b-2 border-gray-300 z-10">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-4 h-6 rounded-full bg-[#2b2b2b] shadow-inner transform -translate-y-2"></div>
          ))}
        </div>
        
        {/* Faded CONFIDENTIAL stamp in background instead of coffee ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 pointer-events-none z-0 opacity-[0.04]">
          <div className="border-8 border-vintage-crimson px-12 py-4 rounded-lg inline-block">
            <span className="font-mono font-black text-8xl text-vintage-crimson tracking-[0.2em] uppercase">Confidential</span>
          </div>
        </div>

        {/* Masking tape on corners */}
        <div className="absolute -top-2 -left-4 w-16 h-6 bg-white/60 backdrop-blur-sm shadow-sm transform -rotate-45 z-20"></div>
        <div className="absolute -top-2 -right-4 w-16 h-6 bg-[#E5B5B5]/60 backdrop-blur-sm shadow-sm transform rotate-45 z-20"></div>
        
        <div className="pt-10 h-full flex flex-col relative z-10">
          
          {/* Vertical notebook red margin lines */}
          <div className="absolute top-0 bottom-0 left-12 w-px bg-red-400/40 pointer-events-none z-0"></div>
          <div className="absolute top-0 bottom-0 left-14 w-px bg-red-400/40 pointer-events-none z-0"></div>

          {/* Days of week - Label Maker Style */}
          <div className="grid grid-cols-7 border-b-2 border-vintage-ink/20 relative z-10 px-2 py-4 gap-2 bg-transparent">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
              <div key={d} className={`py-1.5 text-center text-xs font-mono font-bold text-white uppercase tracking-widest bg-vintage-ink shadow-sm ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} rounded-sm`}>
                {d}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto relative z-10 bg-transparent px-2 pb-2">
            {renderDays()}
          </div>
        </div>
      </div>

      {/* Selected Day Overlay / Modal */}
      {selectedDay !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-vintage-ink/20 backdrop-blur-sm transition-opacity rounded-2xl"
            onClick={() => setSelectedDay(null)}
          ></div>
          
          {/* Paper Modal */}
          <div className="bg-vintage-paper w-full max-w-md relative z-10 p-8 shadow-2xl rounded-sm border border-vintage-ink/10 transform rotate-1 animate-in zoom-in-95 duration-200">
            
            {/* Modal header details */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/60 backdrop-blur-md shadow-sm transform rotate-2"></div>
            
            <button 
              onClick={() => setSelectedDay(null)}
              className="absolute top-4 right-4 p-2 text-vintage-ink/40 hover:text-vintage-crimson transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8 border-b border-vintage-ink/10 pb-4">
              <h2 className="font-accent text-3xl text-vintage-crimson mb-[-5px]">June {selectedDay}</h2>
              <p className="font-mono text-sm text-vintage-ink/60 tracking-widest uppercase">Task Roster</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
              {currentDayEvents.length > 0 ? (
                currentDayEvents.map((event, idx) => {
                  const isDone = completedTasks[event.title];
                  const isImportant = importantTasks[event.title];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleTask(event.title)}
                      className={`flex items-start justify-between gap-4 p-4 border rounded-md cursor-pointer transition-all ${
                        isDone 
                          ? 'border-vintage-babyBlue/30 bg-vintage-babyBlue/10 opacity-70' 
                          : isImportant
                            ? 'border-vintage-crimson bg-[#fff0f0] shadow-sm'
                            : 'border-vintage-ink/10 bg-white hover:border-vintage-crimson hover:shadow-sm'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        <div className={`mt-0.5 ${isDone ? 'text-vintage-babyBlue' : isImportant ? 'text-vintage-crimson' : 'text-vintage-ink/40'}`}>
                          {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className={`font-mono font-bold text-sm ${isDone ? 'text-vintage-ink/60 line-through' : isImportant ? 'text-vintage-crimson' : 'text-vintage-ink'}`}>
                            {event.title}
                          </h4>
                          <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded mt-2 inline-block ${isImportant ? 'bg-vintage-crimson/10 text-vintage-crimson' : 'bg-vintage-ink/5 text-vintage-ink/40'}`}>
                            {event.type}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => toggleImportant(e, event.title)}
                        className={`p-1 rounded-full transition-colors ${isImportant ? 'text-vintage-crimson bg-vintage-crimson/10' : 'text-vintage-ink/20 hover:text-vintage-crimson hover:bg-vintage-crimson/5'}`}
                        title="Mark Important"
                      >
                        <svg className="w-5 h-5" fill={isImportant ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="font-mono text-sm text-vintage-ink/50 border border-dashed border-vintage-ink/20 p-6 bg-white/50">
                    No tasks scheduled for this day.
                  </p>
                </div>
              )}
            </div>
            
            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input 
                type="text" 
                list="calendar-subjects"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                placeholder="Subject (e.g. CS 301)"
                className="vintage-input w-1/3 py-2 px-3 text-sm bg-white border-vintage-ink/20 focus:border-vintage-crimson"
              />
              <datalist id="calendar-subjects">
                {SUGGESTED_SUBJECTS.map(sub => <option key={sub} value={sub} />)}
              </datalist>
              <input 
                type="text" 
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="Task title..."
                className="vintage-input flex-1 py-2 px-3 text-sm bg-white border-vintage-ink/20 focus:border-vintage-crimson"
              />
              <button type="submit" className="vintage-btn py-2 px-4 whitespace-nowrap text-sm">
                Add Task
              </button>
            </form>

            {/* Bottom doodle */}
            <div className="mt-8 pt-4 border-t border-vintage-ink/10 text-center">
              <p className="font-accent text-lg text-vintage-crimsonLight transform -rotate-3 opacity-80">
                stay focused!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
