'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { TaskService } from '../../services/task.service';
import {
  ChevronLeft, ChevronRight, RefreshCw, X, CheckSquare, Square,
  Plus, Loader2, CloudOff, Cloud, CheckCircle, ExternalLink, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type EventSource = 'google' | 'task' | 'local';
interface RichEvent extends CalendarEvent {
  source: EventSource;
}

// ─── Colour mapping per source/type ───────────────────────────────────────────
function dotColor(ev: RichEvent) {
  if (ev.source === 'google') return 'bg-blue-400';
  if (ev.type?.toLowerCase() === 'exam') return 'bg-vintage-crimson';
  if (ev.type?.toLowerCase() === 'assignment') return 'bg-amber-500';
  return 'bg-vintage-babyBlue';
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { data } = useDashboard();
  const { token, user } = useAuth();
  const isCalendarConnected = user?.google_calendar_connected ?? false;

  // ── Navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear  = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDay  = new Date(currentYear, currentMonth, 1).getDay();
  const monthName    = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();

  // ── Events
  const [googleEvents, setGoogleEvents] = useState<RichEvent[]>([]);
  const [taskEvents,   setTaskEvents]   = useState<RichEvent[]>([]);
  const [localEvents,  setLocalEvents]  = useState<Record<string, RichEvent[]>>({}); // date → events
  const [isFetching, setIsFetching] = useState(false);
  const [syncError, setSyncError]   = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // ── Day modal
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Completed / important (local UI state)
  const { completedTasks, setCompletedTasks, importantTasks, setImportantTasks } = useDashboard();

  // ── Add event form (inside day modal)
  const [newTitle,    setNewTitle]    = useState('');
  const [newSubject,  setNewSubject]  = useState('');
  const [newAllDay,   setNewAllDay]   = useState(true);
  const [newTime,     setNewTime]     = useState('09:00');
  const [isAdding,    setIsAdding]    = useState(false);
  const [addError,    setAddError]    = useState<string | null>(null);
  const [addSuccess,  setAddSuccess]  = useState(false);

  // ─── Fetch Google Calendar events ─────────────────────────────────────────
  const fetchCalendarEvents = useCallback(async (year: number, month: number) => {
    if (!token) return;
    setIsFetching(true);
    setSyncError(null);
    try {
      const res = await CalendarService.getEvents(year, month + 1, token); // month+1 = 1-based
      if (res.success && Array.isArray(res.data)) {
        setGoogleEvents(res.data.map(e => ({ ...e, source: 'google' as EventSource })));
        setLastSynced(new Date());
      }
    } catch (e: any) {
      setSyncError(e.message || 'Could not sync with Google Calendar');
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  // ─── Fetch user tasks from backend ────────────────────────────────────────
  const fetchTaskEvents = useCallback(async () => {
    if (!token) return;
    try {
      const res = await TaskService.getTasks(token);
      if (res.success && res.data) {
        const mapped: RichEvent[] = res.data
          .filter((t: any) => t.due_date)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            date: t.due_date.split('T')[0],
            description: t.description || '',
            type: t.priority === 'high' ? 'Assignment' : 'Task',
            source: 'task' as EventSource,
            all_day: true,
          }));
        setTaskEvents(mapped);
      }
    } catch (e) {
      console.error('Task fetch for calendar failed', e);
    }
  }, [token]);

  // Initial load + when month changes
  useEffect(() => {
    fetchCalendarEvents(currentYear, currentMonth);
    fetchTaskEvents();
  }, [currentYear, currentMonth, fetchCalendarEvents, fetchTaskEvents]);

  // ─── Navigation handlers ──────────────────────────────────────────────────
  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  // ─── Build all events for a given day ────────────────────────────────────
  const getEventsForDay = (day: number): RichEvent[] => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const local = localEvents[dateStr] || [];

    const all = [...googleEvents, ...taskEvents, ...local].filter(e => {
      const eDate = (e.date || '').split('T')[0];
      return eDate === dateStr && e.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return all;
  };

  // ─── Add event handler ────────────────────────────────────────────────────
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || selectedDay === null) return;
    setIsAdding(true);
    setAddError(null);
    setAddSuccess(false);

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const fullTitle = newSubject.trim() ? `${newSubject.trim()}: ${newTitle.trim()}` : newTitle.trim();

    if (isCalendarConnected && token) {
      try {
        const res = await CalendarService.createEvent({
          title: fullTitle,
          date: dateStr,
          all_day: newAllDay,
          start_time: newAllDay ? undefined : newTime,
          duration_hours: 1,
        }, token);

        if (res.success) {
          setAddSuccess(true);
          // Add to local display immediately, then re-sync
          const newEv: RichEvent = {
            id: res.data?.id,
            title: fullTitle,
            date: dateStr,
            type: 'Google Calendar',
            source: 'google',
            all_day: newAllDay,
          };
          setGoogleEvents(prev => [...prev, newEv]);
          setTimeout(() => fetchCalendarEvents(currentYear, currentMonth), 1500);
        } else {
          setAddError('Failed to add event to Google Calendar');
        }
      } catch (err: any) {
        setAddError(err.message || 'Failed to create Google Calendar event');
      }
    } else {
      // Not connected → add locally only
      const localEv: RichEvent = {
        id: `local-${Date.now()}`,
        title: fullTitle,
        date: dateStr,
        type: 'Personal',
        source: 'local',
        all_day: true,
      };
      setLocalEvents(prev => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), localEv],
      }));
      setAddSuccess(true);
    }

    setIsAdding(false);
    setNewTitle('');
    setNewSubject('');
    setNewAllDay(true);
    setNewTime('09:00');
    setTimeout(() => setAddSuccess(false), 2500);
  };

  // ─── Render calendar grid ─────────────────────────────────────────────────
  const renderDays = () => {
    const days = [];
    const bookmarkColors = [
      'bg-vintage-crimson text-white',
      'bg-vintage-babyBlue text-vintage-ink',
      'bg-[#E5B5B5] text-vintage-crimson',
      'bg-vintage-ink text-white',
    ];
    const today = new Date();

    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[140px] p-2 border-r border-b border-vintage-ink/10 bg-vintage-ink/[0.02]" />
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const eventsForDay = getEventsForDay(i);
      const pendingEvents = eventsForDay.filter(e => !completedTasks[e.title]);
      const hasEvent  = pendingEvents.length > 0;
      const isSelected = selectedDay === i;
      const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      const colorClass = bookmarkColors[i % bookmarkColors.length];

      days.push(
        <div
          key={`day-${i}`}
          onClick={() => setSelectedDay(i)}
          className={`min-h-[140px] p-2 border-r border-b border-vintage-ink/10 transition-all group relative flex flex-col items-start cursor-pointer overflow-hidden
            ${isSelected ? 'bg-vintage-crimson/5 shadow-inner' : 'hover:bg-vintage-crimson/5'}
            ${isToday ? 'ring-2 ring-inset ring-vintage-crimson/30' : ''}`}
        >
          {/* Ruled lines texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px)', backgroundSize: '100% 24px', backgroundPosition: '0 24px' }} />

          <div className="relative pl-2 pt-2 z-10">
            <span className={`font-accent text-3xl transition-colors relative z-10
              ${isSelected ? 'text-vintage-crimson font-black' : isToday ? 'text-vintage-crimson/70' : 'group-hover:text-vintage-crimson'}`}>
              {i}
            </span>
            {isToday && !isSelected && (
              <div className="absolute -bottom-1 left-2 w-4 h-0.5 bg-vintage-crimson/60 rounded-full" />
            )}
            {isSelected && (
              <svg width="48" height="48" className="absolute -top-1.5 -left-1.5 w-12 h-12 text-vintage-crimson pointer-events-none z-0 opacity-70" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M50 15 C 75 10, 90 35, 80 60 C 70 90, 20 85, 15 55 C 10 30, 30 15, 60 20" />
              </svg>
            )}
          </div>

          <div className="flex-1 w-full mt-2 space-y-1 relative z-10 overflow-hidden px-1">
            {pendingEvents.slice(0, 3).map((event, idx) => (
              <div key={idx} className="text-[10px] font-mono font-bold truncate px-2 py-1 bg-white/80 border border-vintage-ink/5 rounded-sm shadow-sm flex items-center gap-1.5" title={event.title}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(event)}`} />
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {pendingEvents.length > 3 && (
              <div className="text-[10px] font-mono font-bold text-vintage-ink/50 pl-2 pt-1">
                +{pendingEvents.length - 3} more…
              </div>
            )}
          </div>

          {hasEvent && (
            <div className={`absolute top-0 right-2 w-4 h-8 shadow-sm flex items-end justify-center pb-1 rounded-b-sm ${colorClass} z-10 opacity-70`} />
          )}

          <div className={`absolute top-2 right-2 z-10 pointer-events-none transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <svg width="32" height="32" className="w-8 h-8 text-vintage-crimsonLight" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 50 Q 25 20 50 50 T 90 50" />
            </svg>
          </div>
        </div>
      );
    }

    const remaining = 35 - (startingDay + daysInMonth);
    for (let i = 0; i < remaining; i++) {
      days.push(
        <div key={`empty-end-${i}`} className="min-h-[140px] p-2 border-r border-b border-vintage-ink/10 bg-vintage-ink/[0.02]" />
      );
    }

    return days;
  };

  // ─── Selected day events ──────────────────────────────────────────────────
  const selectedDateStr = selectedDay
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : '';
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // ─── Sync status badge ────────────────────────────────────────────────────
  const SyncBadge = () => {
    if (isFetching) return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-vintage-babyBlue/20 rounded-full text-xs font-mono text-vintage-ink/60">
        <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
      </div>
    );
    if (syncError) return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-vintage-crimson/10 border border-vintage-crimson/20 rounded-full text-xs font-mono text-vintage-crimson">
        <CloudOff className="w-3 h-3" /> Sync failed
      </div>
    );
    if (!isCalendarConnected) return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-vintage-ink/5 rounded-full text-xs font-mono text-vintage-ink/40">
        <CloudOff className="w-3 h-3" /> Calendar not connected
      </div>
    );
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs font-mono text-green-700">
        <CheckCircle className="w-3 h-3" />
        {lastSynced ? `Synced ${lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Connected'}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-8 relative w-full">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between pb-6 mb-10 gap-4 relative shrink-0">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-1 relative z-10">temporal overview</h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Calendar</h1>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <SyncBadge />

          <input
            type="text"
            placeholder="Search events…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="vintage-input py-2 px-4 text-sm bg-white/50 border-vintage-ink/20 focus:border-vintage-crimson w-44 transition-all focus:w-56"
          />

          <button
            onClick={() => fetchCalendarEvents(currentYear, currentMonth)}
            disabled={isFetching}
            className="p-3 bg-white border border-vintage-ink/10 rounded-full text-vintage-ink/60 hover:text-vintage-crimson hover:shadow-sm transition-all disabled:opacity-40"
            title="Refresh from Google Calendar"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-white rounded-full border border-vintage-ink/10 shadow-sm overflow-hidden">
            <button onClick={handlePrevMonth} className="px-5 py-3 hover:bg-vintage-crimson/5 transition-colors">
              <ChevronLeft className="w-5 h-5 text-vintage-ink/60" />
            </button>
            <div className="px-8 py-3 font-mono font-bold text-sm text-vintage-ink flex items-center justify-center min-w-[160px] border-l border-r border-vintage-ink/5">
              {monthName} {currentYear}
            </div>
            <button onClick={handleNextMonth} className="px-5 py-3 hover:bg-vintage-crimson/5 transition-colors">
              <ChevronRight className="w-5 h-5 text-vintage-ink/60" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Sync Error Banner ── */}
      {syncError && (
        <div className="mb-6 p-3 bg-vintage-crimson/10 border border-vintage-crimson/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-vintage-crimson shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-mono text-vintage-crimson">{syncError}</p>
            {!isCalendarConnected && (
              <a href="/settings" className="text-xs font-mono font-bold text-vintage-crimson underline mt-1 inline-block">
                Connect Google Calendar in Settings →
              </a>
            )}
          </div>
          <button onClick={() => setSyncError(null)} className="text-vintage-crimson/50 hover:text-vintage-crimson">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs font-mono text-vintage-ink/50">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Google Calendar</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-vintage-crimson" /> Exams</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Assignments</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-vintage-babyBlue" /> Other</div>
        <div className="ml-auto text-vintage-ink/30">{googleEvents.length + taskEvents.length} events loaded</div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="flex flex-col bg-[#fdfbf7] rounded-sm shadow-xl border-2 border-vintage-ink/20 relative">
        {/* Spiral holes */}
        <div className="absolute top-0 left-0 w-full h-6 flex justify-around items-center px-8 bg-gray-200 border-b-2 border-gray-300 z-10">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-4 h-6 rounded-full bg-[#2b2b2b] shadow-inner transform -translate-y-2" />
          ))}
        </div>

        {/* CONFIDENTIAL watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform -rotate-12 pointer-events-none z-0 opacity-[0.04]">
          <div className="border-8 border-vintage-crimson px-12 py-4 rounded-lg inline-block">
            <span className="font-mono font-black text-8xl text-vintage-crimson tracking-[0.2em] uppercase">Confidential</span>
          </div>
        </div>

        {/* Masking tape corners */}
        <div className="absolute -top-2 -left-4 w-16 h-6 bg-white/60 shadow-sm transform -rotate-45 z-20" />
        <div className="absolute -top-2 -right-4 w-16 h-6 bg-[#E5B5B5]/60 shadow-sm transform rotate-45 z-20" />

        <div className="pt-10 flex flex-col relative z-10">
          {/* Notebook margin lines */}
          <div className="absolute top-0 bottom-0 left-12 w-px bg-red-400/40 pointer-events-none z-0" />
          <div className="absolute top-0 bottom-0 left-14 w-px bg-red-400/40 pointer-events-none z-0" />

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b-2 border-vintage-ink/20 relative z-10 px-2 py-4 gap-2">
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
              <div key={d} className={`py-1.5 text-center text-xs font-mono font-bold text-white uppercase tracking-widest bg-vintage-ink shadow-sm ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} rounded-sm`}>
                {d}
              </div>
            ))}
          </div>

          {/* Loading overlay */}
          {isFetching && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px] top-10">
              <div className="flex items-center gap-3 px-6 py-3 bg-white border border-vintage-ink/10 rounded-full shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-vintage-crimson" />
                <span className="text-sm font-mono text-vintage-ink/60">Syncing calendar…</span>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 relative z-10 bg-transparent px-2 pb-2">
            {renderDays()}
          </div>
        </div>
      </div>

      {/* ── Day Modal ── */}
      {selectedDay !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-vintage-ink/20 backdrop-blur-sm rounded-2xl"
            onClick={() => { setSelectedDay(null); setAddError(null); setAddSuccess(false); }}
          />

          <div className="bg-vintage-paper w-full max-w-md relative z-10 p-8 shadow-2xl rounded-sm border border-vintage-ink/10 transform rotate-1 animate-in zoom-in-95 duration-200">
            {/* Tape */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/60 shadow-sm transform rotate-2" />

            <button
              onClick={() => { setSelectedDay(null); setAddError(null); setAddSuccess(false); }}
              className="absolute top-4 right-4 p-2 text-vintage-ink/40 hover:text-vintage-crimson transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 border-b border-vintage-ink/10 pb-4">
              <h2 className="font-accent text-3xl text-vintage-crimson mb-[-5px]">{monthName} {selectedDay}, {currentYear}</h2>
              <p className="font-mono text-sm text-vintage-ink/60 tracking-widest uppercase mt-1">
                {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Event list */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 mb-6">
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event, idx) => {
                  const isDone = completedTasks[event.title];
                  const isImportant = importantTasks[event.title];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCompletedTasks(prev => ({ ...prev, [event.title]: !prev[event.title] }))}
                      className={`flex items-start justify-between gap-4 p-4 border rounded-md cursor-pointer transition-all ${
                        isDone
                          ? 'border-vintage-babyBlue/30 bg-vintage-babyBlue/10 opacity-70'
                          : isImportant
                          ? 'border-vintage-crimson bg-[#fff0f0] shadow-sm'
                          : 'border-vintage-ink/10 bg-white hover:border-vintage-crimson hover:shadow-sm'
                      }`}
                    >
                      <div className="flex gap-3 items-start flex-1 min-w-0">
                        <div className={`mt-0.5 shrink-0 ${isDone ? 'text-vintage-babyBlue' : isImportant ? 'text-vintage-crimson' : 'text-vintage-ink/40'}`}>
                          {isDone ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`font-mono font-bold text-sm truncate ${isDone ? 'text-vintage-ink/60 line-through' : isImportant ? 'text-vintage-crimson' : 'text-vintage-ink'}`}>
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(event)}`} />
                            <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded ${isImportant ? 'bg-vintage-crimson/10 text-vintage-crimson' : 'bg-vintage-ink/5 text-vintage-ink/40'}`}>
                              {event.type}
                            </span>
                            {event.source === 'google' && (
                              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Google Cal</span>
                            )}
                            {event.start_time && (
                              <span className="text-xs font-mono text-vintage-ink/40">
                                {new Date(event.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setImportantTasks(prev => ({ ...prev, [event.title]: !prev[event.title] })); }}
                        className={`p-1 rounded-full shrink-0 transition-colors ${isImportant ? 'text-vintage-crimson bg-vintage-crimson/10' : 'text-vintage-ink/20 hover:text-vintage-crimson'}`}
                        title="Mark Important"
                      >
                        <svg className="w-5 h-5" fill={isImportant ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="font-mono text-sm text-vintage-ink/50 border border-dashed border-vintage-ink/20 p-6 bg-white/50">
                    No events on this day.
                  </p>
                </div>
              )}
            </div>

            {/* ── Add Event Form ── */}
            <div className="border-t border-vintage-ink/10 pt-4">
              <p className="text-xs font-mono font-bold text-vintage-ink/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Plus className="w-3 h-3" />
                {isCalendarConnected ? 'Add to Google Calendar' : 'Add local note'}
                {isCalendarConnected && <Cloud className="w-3 h-3 text-blue-400" />}
              </p>

              {addSuccess && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs font-mono text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  {isCalendarConnected ? 'Added to Google Calendar!' : 'Added locally.'}
                </div>
              )}
              {addError && (
                <div className="mb-3 p-2 bg-vintage-crimson/10 border border-vintage-crimson/20 rounded text-xs font-mono text-vintage-crimson flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddEvent} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="Subject (e.g. CS 301)"
                    className="vintage-input w-1/3 py-2 px-3 text-sm bg-white border-vintage-ink/20 focus:border-vintage-crimson"
                  />
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Event title…"
                    className="vintage-input flex-1 py-2 px-3 text-sm bg-white border-vintage-ink/20 focus:border-vintage-crimson"
                    required
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <label className="flex items-center gap-2 text-xs font-mono text-vintage-ink/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAllDay}
                      onChange={e => setNewAllDay(e.target.checked)}
                      className="rounded border-vintage-ink/20 text-vintage-crimson focus:ring-vintage-crimson"
                    />
                    All day
                  </label>
                  {!newAllDay && (
                    <input
                      type="time"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      className="vintage-input py-1.5 px-2 text-xs bg-white border-vintage-ink/20 focus:border-vintage-crimson"
                    />
                  )}
                  <button
                    type="submit"
                    disabled={isAdding || !newTitle.trim()}
                    className="ml-auto vintage-btn py-2 px-4 text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {isAdding ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-vintage-ink/10 text-center">
              <p className="font-accent text-lg text-vintage-crimsonLight transform -rotate-3 opacity-80">stay focused!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
