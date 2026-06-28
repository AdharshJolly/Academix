'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Target, Calendar, Plus, Save, Activity, Trash2, Zap, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { toastError } from '../../lib/toast';
import { AttendanceService } from '../../services/attendance.service';
import { AttendanceRecord, AttendanceRecordCreate } from '../../types';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import SkeletonCard from '../../components/shared/SkeletonCard';
import { ErrorState, EmptyState } from '../../components/shared/States';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAttendanceCalc } from '../../hooks/useAttendanceCalc';
import { CounterControl } from '../../components/shared/CounterControl';
import { FormField } from '../../components/forms/FormField';

function AttendanceContent() {
  const { user, token } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [newSubject, setNewSubject] = useState({
    semester: 'Semester 1',
    subject_code: '',
    subject_name: '',
    hours_conducted: 0,
    hours_attended: 0,
    target_percentage: 75
  });

  const fetchRecords = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await AttendanceService.getRecords(token);
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load attendance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newSubject.subject_name.trim()) return;
    try {
      const res = await AttendanceService.createRecord(newSubject, token);
      if (res.success && res.data) {
        setRecords([res.data, ...records]);
        setIsAdding(false);
        setNewSubject(prev => ({ ...prev, subject_name: '', subject_code: '', hours_conducted: 0, hours_attended: 0, target_percentage: 75 }));
      }
    } catch (err: any) {
      toastError(err, "Failed to add subject");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<AttendanceRecordCreate>) => {
    if (!token) return;
    
    // Optimistic update
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } as AttendanceRecord : r));
    
    try {
      await AttendanceService.updateRecord(id, updates, token);
    } catch (err: any) {
      toastError(err, "Failed to update record");
      fetchRecords(); // rollback on error
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this subject's attendance record?")) return;
    
    setRecords(prev => prev.filter(r => r.id !== id));
    try {
      await AttendanceService.deleteRecord(id, token);
    } catch (err: any) {
      toastError(err, "Failed to delete record");
      fetchRecords();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Error Loading Attendance" message={error} onRetry={fetchRecords} />;
  }

  const overallAttended = records.reduce((sum, r) => sum + r.hours_attended, 0);
  const overallConducted = records.reduce((sum, r) => sum + r.hours_conducted, 0);
  const overallPercentage = overallConducted === 0 ? 0 : (overallAttended / overallConducted) * 100;

  const groupedRecords = records.reduce((acc, record) => {
    const sem = record.semester || 'Current Semester';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const chartData = records.map(r => {
    const computed = r.hours_conducted === 0 ? 0 : (r.hours_attended / r.hours_conducted) * 100;
    return {
      subject: r.subject_name.length > 15 ? r.subject_name.substring(0, 15) + '...' : r.subject_name,
      percentage: Math.round(computed * 10) / 10,
      target: r.target_percentage,
      fill: computed < r.target_percentage ? '#73010b' : '#2b2b2b'
    };
  });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-10 px-8">
      
      <div className="flex items-end justify-between border-b border-vintage-ink/10 pb-6 relative">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-2 relative z-10">
            track your hours
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Attendance</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="vintage-btn group" disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Add Subject
        </button>
      </div>

      <div className="bg-white p-6 border-l-4 border-l-vintage-crimson shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-mono font-bold text-vintage-ink tracking-widest text-sm uppercase">Overall Average</h3>
          <p className="font-display font-black text-4xl text-vintage-crimson mt-2">{overallPercentage.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-vintage-ink/50 text-sm">Total Classes Conducted: <span className="font-bold text-vintage-ink">{overallConducted}</span></p>
          <p className="font-mono text-vintage-ink/50 text-sm mt-1">Total Classes Attended: <span className="font-bold text-vintage-ink">{overallAttended}</span></p>
        </div>
      </div>

      {records.length > 0 && (
        <div className="bg-white p-6 border border-vintage-ink/10 shadow-sm rounded-lg mb-8">
          <h3 className="font-mono font-bold text-vintage-ink tracking-widest text-sm uppercase mb-6">Subject Comparison</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#4a4a4a', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#4a4a4a', fontFamily: 'monospace' }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(43,43,43,0.05)' }} 
                  contentStyle={{ backgroundColor: '#FDFBF7', borderRadius: '0px', border: '2px solid #2b2b2b', fontFamily: 'monospace', fontSize: '12px', color: '#2b2b2b', boxShadow: '4px 4px 0px rgba(43,43,43,0.1)' }}
                />
                <ReferenceLine y={75} stroke="#a0aec0" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '75% Target', fill: '#a0aec0', fontSize: 10 }} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="vintage-panel p-6 bg-white/50 border border-dashed border-vintage-crimson/50 animate-in fade-in zoom-in-95">
          <h3 className="font-mono font-bold text-vintage-ink mb-4">New Subject Record</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-1 md:col-span-2">
              <FormField label="Semester" type="text" value={newSubject.semester} onChange={e => setNewSubject({...newSubject, semester: e.target.value})} required placeholder="e.g. Fall 2026" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <FormField label="Subject Code" type="text" value={newSubject.subject_code} onChange={e => setNewSubject({...newSubject, subject_code: e.target.value})} placeholder="e.g. CS101" />
            </div>
          </div>
          <FormField label="Subject Name" type="text" value={newSubject.subject_name} onChange={e => setNewSubject({...newSubject, subject_name: e.target.value})} required placeholder="e.g. Data Structures" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hours Conducted" type="number" min="0" value={newSubject.hours_conducted} onChange={e => setNewSubject({...newSubject, hours_conducted: Number(e.target.value)})} />
            <FormField label="Hours Attended" type="number" min="0" value={newSubject.hours_attended} onChange={e => setNewSubject({...newSubject, hours_attended: Number(e.target.value)})} />
            <div className="col-span-2">
              <FormField label="Target %" type="number" min="1" max="100" value={newSubject.target_percentage} onChange={e => setNewSubject({...newSubject, target_percentage: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 font-mono text-sm font-bold text-vintage-ink/50 hover:text-vintage-ink transition-colors">Cancel</button>
            <button type="submit" className="vintage-btn">Save Record</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {records.length === 0 && !isAdding && (
          <div className="col-span-1 md:col-span-2">
            <EmptyState 
              icon={Calendar} 
              title="No subjects tracked yet" 
              subtitle="Click 'Add Subject' to start tracking attendance." 
            />
          </div>
        )}
      </div>

      {Object.entries(groupedRecords).map(([semester, semRecords]) => (
        <div key={semester} className="mt-8">
          <div className="flex items-center justify-between mb-6 border-b border-vintage-ink/10 pb-2">
            <h2 className="font-mono font-bold text-xl text-vintage-ink">{semester}</h2>
            <div className="flex bg-vintage-ink/5 p-1 rounded-md border border-vintage-ink/10">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-vintage-ink' : 'text-vintage-ink/50 hover:text-vintage-ink'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('table')} 
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-vintage-ink' : 'text-vintage-ink/50 hover:text-vintage-ink'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {semRecords.map(record => {
          const { currentPercent, isDanger, insight } = useAttendanceCalc(record);

          return (
            <div key={record.id} className="vintage-panel p-6 bg-white relative overflow-hidden group">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #2b2b2b 1px, transparent 1px), linear-gradient(to bottom, #2b2b2b 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h2 className="font-display font-black text-2xl text-vintage-ink tracking-tight">{record.subject_name}</h2>
                  {record.subject_code && <span className="font-mono text-xs font-bold text-vintage-ink/60 bg-vintage-ink/5 px-2 py-0.5 rounded-md inline-block mt-1">{record.subject_code}</span>}
                </div>
                <button onClick={() => handleDelete(record.id)} className="text-vintage-ink/20 hover:text-vintage-crimson transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-6 mb-8 relative z-10">
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-vintage-ink/5">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-vintage-ink/5" />
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${currentPercent * 2.89} 289`} className={isDanger ? 'text-vintage-crimson' : 'text-vintage-babyBlue'} strokeLinecap="round" />
                  </svg>
                  <span className="font-display font-black text-xl text-vintage-ink">{currentPercent.toFixed(0)}%</span>
                </div>
                
                <div className="flex-1 space-y-4">
                  <CounterControl
                    label="Conducted"
                    value={record.hours_conducted}
                    onDecrement={() => handleUpdate(record.id, { hours_conducted: Math.max(0, record.hours_conducted - 1) })}
                    onIncrement={() => handleUpdate(record.id, { hours_conducted: record.hours_conducted + 1 })}
                  />
                  
                  <CounterControl
                    label="Attended"
                    value={record.hours_attended}
                    onDecrement={() => handleUpdate(record.id, { hours_attended: Math.max(0, record.hours_attended - 1) })}
                    onIncrement={() => handleUpdate(record.id, { hours_attended: record.hours_attended + 1, hours_conducted: record.hours_conducted + (record.hours_attended >= record.hours_conducted ? 1 : 0) })}
                  />
                </div>
              </div>

              <div className={`p-4 border-t-2 ${isDanger ? 'border-t-vintage-crimson/20 bg-vintage-crimson/5' : 'border-t-vintage-babyBlue/20 bg-vintage-babyBlue/5'} -mx-6 -mb-6 px-6 relative z-10 flex items-start gap-3`}>
                <Zap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDanger ? 'text-vintage-crimson' : 'text-vintage-babyBlue'}`} />
                <div>
                  <p className="font-mono font-bold text-vintage-ink text-sm tracking-tight">{insight}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono text-vintage-ink/50">Target:</span>
                    <input 
                      type="number" 
                      min="1" max="100" 
                      value={record.target_percentage} 
                      onChange={(e) => handleUpdate(record.id, { target_percentage: Number(e.target.value) })}
                      className="w-14 bg-white border border-vintage-ink/20 rounded px-1 py-0.5 text-xs font-mono font-bold text-center focus:outline-none focus:border-vintage-crimson" 
                    />
                    <span className="text-xs font-mono text-vintage-ink/50">%</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
            </div>
          ) : (
            <div className="overflow-x-auto vintage-panel">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-vintage-ink font-mono text-sm uppercase text-vintage-ink">
                    <th className="p-4 font-bold">Subject</th>
                    <th className="p-4 font-bold text-center">Conducted</th>
                    <th className="p-4 font-bold text-center">Attended</th>
                    <th className="p-4 font-bold text-center">Target %</th>
                    <th className="p-4 font-bold">Current %</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vintage-ink/10">
                  {semRecords.map(record => {
                    const currentPercent = record.hours_conducted === 0 ? 0 : (record.hours_attended / record.hours_conducted) * 100;
                    const target = record.target_percentage;
                    const isDanger = currentPercent < target;
                    const isSafe = currentPercent >= target + 2;
                    
                    return (
                      <tr key={record.id} className="hover:bg-vintage-ink/5 transition-colors group">
                        <td className="p-4">
                          <div className="font-display font-black text-vintage-ink">{record.subject_name}</div>
                          {record.subject_code && <div className="font-mono text-xs text-vintage-ink/60 mt-0.5">{record.subject_code}</div>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleUpdate(record.id, { hours_conducted: Math.max(0, record.hours_conducted - 1) })} className="w-5 h-5 flex items-center justify-center bg-white border border-vintage-ink/20 rounded shadow-sm text-vintage-ink hover:text-vintage-crimson font-mono text-xs">-</button>
                            <span className="font-mono font-bold w-6 text-center">{record.hours_conducted}</span>
                            <button onClick={() => handleUpdate(record.id, { hours_conducted: record.hours_conducted + 1 })} className="w-5 h-5 flex items-center justify-center bg-white border border-vintage-ink/20 rounded shadow-sm text-vintage-ink font-mono text-xs">+</button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleUpdate(record.id, { hours_attended: Math.max(0, record.hours_attended - 1) })} className="w-5 h-5 flex items-center justify-center bg-white border border-vintage-ink/20 rounded shadow-sm text-vintage-ink hover:text-vintage-crimson font-mono text-xs">-</button>
                            <span className="font-mono font-bold w-6 text-center">{record.hours_attended}</span>
                            <button onClick={() => handleUpdate(record.id, { hours_attended: record.hours_attended + 1, hours_conducted: record.hours_conducted + (record.hours_attended >= record.hours_conducted ? 1 : 0) })} className="w-5 h-5 flex items-center justify-center bg-white border border-vintage-ink/20 rounded shadow-sm text-vintage-ink font-mono text-xs">+</button>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-white border border-vintage-ink/20 px-2 py-1 rounded">
                            <input 
                              type="number" min="1" max="100" 
                              value={record.target_percentage} 
                              onChange={(e) => handleUpdate(record.id, { target_percentage: Number(e.target.value) })}
                              className="w-8 font-mono font-bold text-center text-sm focus:outline-none" 
                            />
                            <span className="font-mono text-xs text-vintage-ink/50">%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="font-display font-bold w-10 text-right">{currentPercent.toFixed(0)}%</span>
                            <div className="w-24 h-2 bg-vintage-ink/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isDanger ? 'bg-vintage-crimson' : 'bg-vintage-ink'}`} 
                                style={{ width: `${Math.min(100, currentPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-bold ${
                            isDanger ? 'bg-vintage-crimson/10 text-vintage-crimson' : 
                            isSafe ? 'bg-green-100 text-green-800 border border-green-200' : 
                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {isDanger ? 'DANGER' : isSafe ? 'SAFE' : 'WARNING'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(record.id)} className="text-vintage-ink/30 hover:text-vintage-crimson transition-colors p-1 opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      
    </div>
  );
}

export default function AttendancePage() {
  return (
    <ErrorBoundary>
      <AttendanceContent />
    </ErrorBoundary>
  );
}
