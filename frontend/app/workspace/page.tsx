'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TaskService } from '../../services/task.service';
import { IntelligenceService } from '../../services/intelligence.service';
import { TaskResponse, IntelligenceResponse } from '../../types';
import { CheckSquare, FileText, Calendar as CalendarIcon, Plus, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspacePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'notices' | 'planner'>('notices');
  
  // Tasks State
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  
  // Notices State
  const [noticeText, setNoticeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [intelligenceResult, setIntelligenceResult] = useState<IntelligenceResponse | null>(null);

  useEffect(() => {
    if (activeTab === 'tasks' && token) {
      loadTasks();
    }
  }, [activeTab, token]);

  const loadTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await TaskService.getTasks(token!);
      if (res.success && res.data) setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleProcessNotice = async () => {
    if (!noticeText.trim() || !token) return;
    setIsProcessing(true);
    setIntelligenceResult(null);
    try {
      const res = await IntelligenceService.processNotice({
        input_type: 'notice',
        data: { text: noticeText }
      }, token);
      if (res.success && res.data) {
        setIntelligenceResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Workspace Header & Tabs */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-6">Workspace</h1>
        
        <div className="flex p-1 bg-white/5 rounded-xl inline-flex border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white/10 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <CheckSquare className="w-4 h-4" /> Tasks
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'notices' ? 'bg-white/10 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText className="w-4 h-4" /> AI Notices
          </button>
          <button 
            onClick={() => setActiveTab('planner')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'planner' ? 'bg-white/10 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <CalendarIcon className="w-4 h-4" /> Planner
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          
          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-64">
                  <input type="text" placeholder="Filter tasks..." className="w-full cyber-input py-2 pl-4 pr-4 text-sm" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neonBlue text-black font-semibold rounded-lg hover:bg-neonBlue/90 transition-colors">
                  <Plus className="w-4 h-4" /> New Task
                </button>
              </div>
              
              <div className="glass-panel rounded-xl border border-white/10 flex-1 overflow-auto p-4">
                {isLoadingTasks ? (
                  <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin text-neonBlue" /></div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 text-sm">
                        <th className="py-3 px-4 font-medium">Title</th>
                        <th className="py-3 px-4 font-medium">Status</th>
                        <th className="py-3 px-4 font-medium">Priority</th>
                        <th className="py-3 px-4 font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="text-white font-medium">{task.title}</div>
                            {task.description && <div className="text-xs text-slate-500 mt-1">{task.description}</div>}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-300 capitalize">
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${task.priority === 'high' ? 'text-neonRed bg-neonRed/10' : task.priority === 'medium' ? 'text-neonOrange bg-neonOrange/10' : 'text-neonBlue bg-neonBlue/10'}`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-400">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* NOTICES TAB */}
          {activeTab === 'notices' && (
            <motion.div 
              key="notices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex gap-6 flex-col lg:flex-row"
            >
              {/* Input Area */}
              <div className="flex-1 flex flex-col">
                <div className="glass-panel rounded-xl border border-white/10 p-6 flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonBlue to-neonPurple"></div>
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-neonPurple" />
                    Input Academic Notice
                  </h2>
                  <textarea 
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="Paste your syllabus, email from professor, or canvas announcement here..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 resize-none focus:outline-none focus:border-neonPurple focus:ring-1 focus:ring-neonPurple transition-all mb-4"
                  />
                  <button 
                    onClick={handleProcessNotice}
                    disabled={isProcessing || !noticeText.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-neonPurple to-neonBlue text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isProcessing ? 'AI Processing...' : 'Extract Intelligence'}
                  </button>
                </div>
              </div>

              {/* Result Area */}
              <div className="flex-1 flex flex-col">
                {intelligenceResult ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel-heavy rounded-xl border border-neonBlue/20 p-6 flex-1 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-white text-gradient-cyan-purple">Intelligence Report</h2>
                      <div className="px-3 py-1 rounded-full bg-neonBlue/10 border border-neonBlue/20 text-neonBlue text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Processed
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Risk */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Assessed Risk</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-white">{(intelligenceResult.risk_assessment.risk_score * 100).toFixed(0)}%</span>
                          <span className="px-2 py-1 rounded bg-white/10 text-xs font-medium text-slate-300">{intelligenceResult.risk_assessment.risk_level.toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Events */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Extracted Events</h3>
                        <div className="space-y-2">
                          {intelligenceResult.extracted_events.map((ev, i) => (
                            <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium text-white text-sm">{ev.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{ev.type} • {ev.location || 'No location'}</p>
                              </div>
                              <div className="text-xs font-medium text-neonBlue bg-neonBlue/10 px-2 py-1 rounded">
                                {new Date(ev.date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Recommended Actions</h3>
                        <div className="space-y-2">
                          {intelligenceResult.recommendations.map((rec, i) => (
                            <div key={i} className="p-3 bg-white/5 border border-l-2 border-l-neonPurple rounded-lg">
                              <p className="font-medium text-slate-200 text-sm">{rec.action}</p>
                              {rec.rationale && <p className="text-xs text-slate-500 mt-1">{rec.rationale}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel rounded-xl border border-white/5 border-dashed p-6 flex-1 flex flex-col items-center justify-center text-slate-500">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-center">Submit an academic notice to see AI-extracted events, risk factors, and recommended schedules.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PLANNER TAB */}
          {activeTab === 'planner' && (
            <motion.div 
              key="planner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              <div className="glass-panel rounded-xl border border-white/10 flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Study Planner</h3>
                  <p className="text-slate-400">Process notices to automatically generate your study schedule here.</p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
