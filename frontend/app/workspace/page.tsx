'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Filter, Calendar, Clock, Inbox, 
  CheckCircle, Archive, ChevronRight, MessageCircle, Heart, Share2, Sparkles, Send, Smile, Paperclip, MoreHorizontal, ArrowRight,
  Pencil, Trash2, AlertTriangle, X, Target
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { TaskService } from '../../services/task.service';
import { IntelligenceService } from '../../services/intelligence.service';
import { IntelligenceResponse, ExtractedEvent, Recommendation, TaskResponse } from '../../types/index';
import ErrorBoundary from '../../components/shared/ErrorBoundary';
import SkeletonCard from '../../components/shared/SkeletonCard';
import { FocusTimerModal } from '../../components/shared/FocusTimerModal';

interface WorkspaceTask {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: string;
  priority: string;
  status: string;
  comments: any[];
}

// Fallback empty state
const INITIAL_TASKS: WorkspaceTask[] = [];

function WorkspaceContent() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'inbox' | 'extract' | 'completed'>('tasks');
  const [tasks, setTasks] = useState<WorkspaceTask[]>(INITIAL_TASKS);
  const [selectedItem, setSelectedItem] = useState<WorkspaceTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    TaskService.getTasks(token).then(res => {
      if (res.success && res.data) {
        const fetchedTasks = res.data.map((t: TaskResponse) => ({
          id: t.id,
          title: t.title,
          subject: t.description ? t.description.split(' - ')[0] : 'General',
          type: 'Task',
          date: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
          priority: t.priority,
          status: t.status,
          comments: []
        }));
        setTasks(fetchedTasks);
        if (fetchedTasks.length > 0) {
          setSelectedItem(fetchedTasks[0]);
        }
      }
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [token]);
  
  // Quick Capture State
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('Assignment');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskSyncCalendar, setNewTaskSyncCalendar] = useState(true);
  const [newTaskReminderTime, setNewTaskReminderTime] = useState('24h');

  // AI Inbox State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noticeText, setNoticeText] = useState('');
  const [isProcessingNotice, setIsProcessingNotice] = useState(false);
  const [noticeResult, setNoticeResult] = useState<IntelligenceResponse | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    setIsProcessingNotice(true);
    setNoticeError(null);
    setNoticeResult(null);
    setNoticeText(`File uploaded: ${file.name}\nProcessing via Vision/PDF Extractor...`);
    
    try {
      const res = await IntelligenceService.uploadNotice(file, token);
      if (res.success && res.data) {
        setNoticeResult(res.data);
        setNoticeText(`File: ${file.name}\nExtracted successfully.`);
      } else {
        setNoticeError(res.message || 'AI processing failed. Please try again.');
        setNoticeText('');
      }
    } catch (err: any) {
      console.error(err);
      setNoticeError(err?.message || 'Failed to process file. Check connection.');
      setNoticeText('');
    } finally {
      setIsProcessingNotice(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Task Edit/Delete State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);
  const [showWorkspaceFocusTimer, setShowWorkspaceFocusTimer] = useState(false);
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'tasks') return matchesSearch && task.status !== 'completed' && task.status !== 'pending_review';
    if (activeTab === 'inbox') return matchesSearch && task.status === 'pending_review';
    if (activeTab === 'completed') return matchesSearch && task.status === 'completed';
    return matchesSearch;
  });

  const inboxCount = tasks.filter(t => t.status === 'pending_review').length;
  
  // Copilot Chat History
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    IntelligenceService.getChatHistory(token).then(res => {
      if (res.success && res.data) {
        setChatHistory(res.data);
      }
    }).catch(console.error);
  }, [token]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !token) return;
    const userMsg = newComment;
    setNewComment('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsChatLoading(true);
    try {
      const res = await IntelligenceService.sendChatMessage(userMsg, token);
      if (res.success && res.data) {
        setChatHistory(prev => [...prev, res.data as {role: string, content: string}]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickCapture = async () => {
    if (!newTaskSubject || !newTaskTitle || !token) return;
    
    const data = {
      title: newTaskTitle,
      description: `${newTaskSubject} - ${newTaskType}`,
      due_date: newTaskDate || new Date().toISOString(),
      priority: newTaskPriority.toLowerCase() as any,
      status: 'pending' as any,
      add_to_calendar: newTaskSyncCalendar,
      reminder_time: newTaskReminderTime
    };

    try {
      const res = await TaskService.createTask(data, token);
      if (res.success && res.data) {
        const newTask = {
          id: res.data.id,
          title: res.data.title,
          subject: newTaskSubject,
          type: newTaskType,
          date: res.data.due_date ? new Date(res.data.due_date).toLocaleDateString() : 'No date',
          priority: res.data.priority,
          status: res.data.status,
          comments: []
        };
        setTasks([newTask, ...tasks]);
        setSelectedItem(newTask);
      }
    } catch (e) {
      console.error(e);
    }

    setShowQuickCapture(false);
    setNewTaskSubject('');
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskSyncCalendar(true);
  };

  const handleProcessNotice = async () => {
    if (!noticeText.trim() || !token) return;
    setIsProcessingNotice(true);
    setNoticeError(null);
    setNoticeResult(null);
    try {
      const res = await IntelligenceService.process({
        input_type: 'notice',
        data: { text: noticeText }
      }, token);
      if (res.success && res.data) {
        setNoticeResult(res.data);
      } else {
        setNoticeError(res.message || 'AI processing failed. Please try again.');
      }
    } catch (e: unknown) {
      console.error(e);
      setNoticeError((e as Error)?.message || 'Failed to reach the AI engine. Check your connection and try again.');
    } finally {
      setIsProcessingNotice(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    setIsDeletingTask(taskId);
    try {
      await TaskService.deleteTask(taskId, token);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedItem?.id === taskId) setSelectedItem(null);
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setIsDeletingTask(null);
    }
  };

  const handleApproveTask = async (task: WorkspaceTask) => {
    if (!token) return;
    try {
      const res = await TaskService.updateTask(task.id, { status: 'pending' }, token);
      if (res.success) {
        const updated = { ...task, status: 'pending' };
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
        if (selectedItem?.id === task.id) setSelectedItem(updated);
      }
    } catch (e) {
      console.error('Approve failed', e);
    }
  };

  const openEditModal = (task: WorkspaceTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditSubject(task.subject);
    setEditPriority(task.priority?.toLowerCase() || 'medium');
    setEditDueDate('');
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!token || !editingTask) return;
    try {
      const res = await TaskService.updateTask(editingTask.id, {
        title: editTitle,
        description: editSubject,
        priority: editPriority as any,
        ...(editDueDate ? { due_date: editDueDate } : {}),
      }, token);
      if (res.success && res.data) {
        const updated = { ...editingTask, title: editTitle, subject: editSubject, priority: editPriority };
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
        if (selectedItem?.id === editingTask.id) setSelectedItem(updated);
      }
    } catch (e) {
      console.error('Update failed', e);
    } finally {
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100%+3rem)] -mx-6 -mt-6 -mb-6 bg-vintage-paper overflow-hidden relative">
      
      {/* 1. Workspace Toolbar */}
      <div className="h-14 border-b border-vintage-ink/10 bg-white/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-ink/40" />
            <input 
              type="text" 
              placeholder="Search tasks, notices, plans..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-vintage-ink/10 rounded-md py-1.5 pl-9 pr-4 text-sm font-mono focus:outline-none focus:border-vintage-crimson transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowQuickCapture(true)}
            className="flex items-center gap-2 bg-vintage-crimson text-white px-3 py-1.5 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Quick Capture
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="text-vintage-ink/60 hover:text-vintage-ink p-1.5 rounded-md hover:bg-black/5 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-neonBlue/10 text-neonBlue rounded-full text-xs font-mono border border-neonBlue/20">
            <Sparkles className="w-3 h-3" /> AI Active
          </div>
        </div>
      </div>

      {/* 3 Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Navigation */}
        <div className="w-56 border-r border-vintage-ink/10 bg-white/30 flex flex-col p-4 gap-1">
          <p className="font-accent text-vintage-crimson transform -rotate-2 mb-4 text-lg">navigation</p>
          
          <NavItem icon={<CheckCircle />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavItem icon={<Inbox />} label="AI Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} badge={inboxCount > 0 ? inboxCount.toString() : undefined} />
          <NavItem icon={<Sparkles />} label="Scanner" active={activeTab === 'extract'} onClick={() => setActiveTab('extract')} />
          
          <div className="my-2 border-b border-vintage-ink/10"></div>
          
          <NavItem icon={<Archive />} label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
        </div>

        {/* Middle Panel: Active Work Area */}
        <div className="flex-1 bg-white/40 flex flex-col overflow-y-auto">
          <div className="p-6 max-w-3xl w-full mx-auto">
            
            <AnimatePresence mode="wait">
              {(activeTab === 'tasks' || activeTab === 'inbox' || activeTab === 'completed') && (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">
                    {activeTab === 'tasks' ? "Today's Focus" : activeTab === 'inbox' ? "Pending Review" : "Completed Tasks"}
                  </h2>
                  <div className="space-y-3">
                    {isLoading ? (
                      <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                      </>
                    ) : filteredTasks.length === 0 ? (
                      <p className="text-vintage-ink/50 font-mono text-sm">No tasks found matching your search.</p>
                    ) : (
                      filteredTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedItem(task)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all group ${
                            selectedItem?.id === task.id 
                              ? 'bg-white border-vintage-crimson shadow-sm scale-[1.01]' 
                              : 'bg-white/50 border-vintage-ink/10 hover:border-vintage-ink/30 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3 flex-1 min-w-0">
                              <div className="mt-1 w-5 h-5 rounded-md border-2 border-vintage-ink/20 flex items-center justify-center shrink-0"></div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-vintage-ink font-mono truncate">{task.title}</h3>
                                <p className="text-sm text-vintage-ink/60 font-mono mt-1">{task.subject} • {task.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                task.priority === 'high' || task.priority === 'High' ? 'bg-vintage-crimsonLight/20 text-vintage-crimson' : 
                                'bg-vintage-ink/5 text-vintage-ink/60'
                              }`}>
                                {task.priority}
                              </div>
                              {task.status === 'pending_review' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApproveTask(task); }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-green-100 text-vintage-ink/40 hover:text-green-600 transition-all"
                                  title="Approve task"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-vintage-ink/10 text-vintage-ink/40 hover:text-vintage-ink transition-all"
                                title="Edit task"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                disabled={isDeletingTask === task.id}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-vintage-crimson/10 text-vintage-ink/40 hover:text-vintage-crimson transition-all disabled:opacity-30"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'extract' && (
                <motion.div key="extract" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">AI Notice Scanner</h2>
                  <div className="bg-white rounded-xl border border-vintage-ink/10 p-4 shadow-sm">
                    <textarea 
                      placeholder="Paste your syllabus, notice, or email here..."
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      className="w-full h-40 bg-transparent border-none resize-none focus:outline-none font-mono text-sm text-vintage-ink placeholder:text-vintage-ink/30"
                    ></textarea>
                    
                    {/* Error Banner */}
                    {noticeError && (
                      <div className="mt-3 p-3 bg-vintage-crimson/10 border border-vintage-crimson/30 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-vintage-crimson shrink-0 mt-0.5" />
                        <p className="text-xs font-mono text-vintage-crimson flex-1">{noticeError}</p>
                        <button onClick={() => setNoticeError(null)} className="text-vintage-crimson/60 hover:text-vintage-crimson">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Results Panel */}
                    {noticeResult && (
                      <div className="mt-4 p-4 bg-vintage-paper rounded border border-vintage-ink/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-sm font-mono">Extracted Details</h4>
                          <button onClick={() => setNoticeResult(null)} className="text-vintage-ink/30 hover:text-vintage-ink text-xs font-mono">Clear</button>
                        </div>
                        {noticeResult.extracted_events?.length > 0 ? (
                           <ul className="text-xs font-mono text-vintage-ink/80 space-y-1 mb-3">
                             {noticeResult.extracted_events.map((ev: ExtractedEvent, idx: number) => (
                                <li key={idx} className="flex gap-2"><span className="text-vintage-crimson">◆</span> <span><strong>{ev.title}</strong> — {ev.date} ({ev.subject})</span></li>
                             ))}
                           </ul>
                        ) : (
                          <p className="text-xs font-mono text-vintage-ink/50 mb-3">No specific dates extracted.</p>
                        )}
                        {noticeResult.recommendations?.length > 0 && (
                          <>
                            <h4 className="font-bold text-xs font-mono text-vintage-ink/60 uppercase tracking-widest mb-2">Recommendations</h4>
                            <ul className="text-xs font-mono text-vintage-ink/80 space-y-1">
                              {noticeResult.recommendations.map((r: Recommendation, idx: number) => (
                                 <li key={idx} className="flex gap-2"><span className="text-vintage-crimson">→</span> {r.action}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {noticeResult.risk_assessment && (
                          <div className="mt-3 pt-3 border-t border-vintage-ink/10 flex items-center gap-2">
                            <span className="text-xs font-mono text-vintage-ink/50">Risk Level:</span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              noticeResult.risk_assessment.risk_level === 'high' ? 'bg-vintage-crimson/10 text-vintage-crimson' :
                              noticeResult.risk_assessment.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>{noticeResult.risk_assessment.risk_level?.toUpperCase()}</span>
                            <span className="text-xs font-mono text-vintage-ink/40">({Math.round((noticeResult.risk_assessment.risk_score || 0) * 100)}% risk score)</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-vintage-ink/10">
                      <div className="text-xs font-mono text-vintage-ink/40 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> {isProcessingNotice ? 'AI is processing...' : 'AI is ready to extract tasks'}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                          ref={fileInputRef}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingNotice}
                          className="bg-white text-vintage-ink border border-vintage-ink/20 px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-ink/5 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Paperclip className="w-4 h-4" /> Upload
                        </button>
                        <button 
                          onClick={handleProcessNotice}
                          disabled={isProcessingNotice || (!noticeText || noticeText.includes('File uploaded:'))}
                          className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark flex items-center gap-2 disabled:opacity-50"
                        >
                          {isProcessingNotice ? 'Processing...' : 'Process'} <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>
        </div>

        {/* Right Panel: Context Panel (AI Assistant & Instagram-style social interaction) */}
        <div className="w-80 border-l border-vintage-ink/10 bg-white flex flex-col shrink-0">
          {selectedItem ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-vintage-ink/10 flex justify-between items-center bg-vintage-paper/50">
                <h3 className="font-bold font-mono text-sm text-vintage-ink">Context Panel</h3>
                <MoreHorizontal className="w-4 h-4 text-vintage-ink/40 cursor-pointer hover:text-vintage-ink" />
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Image/Preview (Instagram-style header for the task) */}
                <div className="w-full aspect-video bg-vintage-ink/5 border-b border-vintage-ink/10 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                  <div className="absolute -inset-4 striped-bg opacity-30 z-0"></div>
                  <div className="z-10 bg-white p-4 rounded-lg shadow-sm border border-vintage-ink/5 transform rotate-1">
                    <h2 className="font-black font-display text-xl text-vintage-ink mb-1">{selectedItem.title}</h2>
                    <p className="font-mono text-sm text-vintage-crimson">{selectedItem.date}</p>
                  </div>
                </div>

                {/* Instagram Style Action Bar */}
                <div className="p-3 flex items-center justify-between border-b border-vintage-ink/5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsLiked(!isLiked)} className="hover:scale-110 transition-transform">
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-vintage-crimson text-vintage-crimson' : 'text-vintage-ink'}`} />
                    </button>
                    <button className="hover:scale-110 transition-transform">
                      <MessageCircle className="w-6 h-6 text-vintage-ink" />
                    </button>
                    <button className="hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6 text-vintage-ink" />
                    </button>
                    <button 
                      onClick={() => setShowWorkspaceFocusTimer(true)}
                      className="ml-2 px-3 py-1 bg-vintage-crimson text-white text-xs font-bold font-mono rounded-full hover:bg-vintage-crimsonDark flex items-center gap-1"
                    >
                      <Target className="w-3 h-3" /> Focus
                    </button>
                  </div>
                  <BookmarkIcon />
                </div>

                {/* Details Section */}
                <div className="p-4 border-b border-vintage-ink/5">
                  <p className="text-sm font-mono text-vintage-ink">
                    <span className="font-bold">{user?.full_name || 'Demo User'}</span> Need to finish this before the weekend. Priority is set to <span className="font-bold text-vintage-crimson">{selectedItem.priority}</span>.
                  </p>
                </div>

                {/* AI Insights & Comments */}
                <div className="p-4 flex flex-col gap-4">
                  {chatHistory.map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-vintage-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                         {c.role === 'assistant' ? (
                           <Sparkles className="w-3 h-3 text-neonBlue" />
                         ) : (
                           <img src={user?.avatar_url || '/avatars/doodle_dog.png'} alt="avatar" className="w-full h-full object-cover" />
                         )}
                      </div>
                      <p className="text-sm font-mono text-vintage-ink/80 leading-tight">
                        <span className="font-bold text-vintage-ink mr-2">{c.role === 'assistant' ? 'ai_copilot' : (user?.full_name || 'You')}</span>
                        {c.content}
                      </p>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-vintage-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                         <Sparkles className="w-3 h-3 text-neonBlue animate-pulse" />
                      </div>
                      <p className="text-sm font-mono text-vintage-ink/80 leading-tight animate-pulse">
                        Thinking...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment Input (Instagram Style) */}
              <div className="p-3 border-t border-vintage-ink/10 bg-white flex items-center gap-3">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-vintage-ink/10">
                  <img src={user?.avatar_url || '/avatars/doodle_dog.png'} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..." 
                  className="flex-1 bg-transparent border-none text-sm font-mono focus:outline-none placeholder:text-vintage-ink/40"
                />
                <button className="text-vintage-ink/40 hover:text-vintage-ink">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isChatLoading}
                  className={`text-sm font-bold font-mono transition-colors ${newComment.trim() && !isChatLoading ? 'text-neonBlue' : 'text-neonBlue/40'}`}
                >
                  Post
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Sparkles className="w-8 h-8 mb-4 text-vintage-ink" />
              <p className="font-mono text-sm">Select an item to view AI context, insights, and discussion.</p>
            </div>
          )}
        </div>
        
      </div>

      {/* Quick Capture Modal */}
      <AnimatePresence>
        {showQuickCapture && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-vintage-ink/10"
            >
              <h3 className="font-display font-black text-xl text-vintage-ink mb-4">Quick Capture</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Subject *</label>
                  <input 
                    type="text" 
                    list="workspace-subjects"
                    placeholder="e.g. CS 301"
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
                    autoFocus
                  />
                  <datalist id="workspace-subjects">
                    {Array.from(new Set(INITIAL_TASKS.map(t => t.subject))).map(sub => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Title *</label>
                  <input 
                    type="text" 
                    placeholder="Task name"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Type</label>
                    <select 
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono outline-none"
                    >
                      <option>Assignment</option>
                      <option>Exam</option>
                      <option>Reading</option>
                      <option>Project</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Priority</label>
                    <select 
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono outline-none"
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-sm font-mono text-vintage-ink">
                    <input 
                      type="checkbox" 
                      checked={newTaskSyncCalendar}
                      onChange={(e) => setNewTaskSyncCalendar(e.target.checked)}
                      className="rounded border-vintage-ink/20 text-vintage-crimson focus:ring-vintage-crimson"
                    />
                    Sync to Google Calendar
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold font-mono text-vintage-ink/60">WhatsApp Reminder</label>
                    <select 
                      value={newTaskReminderTime}
                      onChange={(e) => setNewTaskReminderTime(e.target.value)}
                      className="bg-vintage-paper border border-vintage-ink/10 rounded p-1 text-xs font-mono outline-none"
                    >
                      <option value="none">None</option>
                      <option value="1h">1 hour before</option>
                      <option value="24h">24 hours before</option>
                      <option value="48h">48 hours before</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vintage-ink/10">
                <button 
                  onClick={() => setShowQuickCapture(false)}
                  className="px-4 py-2 text-sm font-bold font-mono text-vintage-ink/60 hover:text-vintage-ink transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleQuickCapture}
                  disabled={!newTaskSubject || !newTaskTitle}
                  className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark disabled:opacity-50 transition-colors"
                >
                  Save Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {showEditModal && editingTask && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-vintage-ink/10"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-black text-xl text-vintage-ink">Edit Task</h3>
                <button onClick={() => setShowEditModal(false)} className="text-vintage-ink/40 hover:text-vintage-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono outline-none"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold font-mono text-vintage-ink/60 mb-1">New Due Date</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vintage-ink/10">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-bold font-mono text-vintage-ink/60 hover:text-vintage-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  disabled={!editTitle.trim()}
                  className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark disabled:opacity-50 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Focus Timer for Workspace Task */}
      {selectedItem && (
        <FocusTimerModal 
          isOpen={showWorkspaceFocusTimer} 
          onClose={() => setShowWorkspaceFocusTimer(false)} 
          taskTitle={selectedItem.title}
          taskId={selectedItem.id}
        />
      )}
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <ErrorBoundary>
      <WorkspaceContent />
    </ErrorBoundary>
  );
}

// Subcomponents
const NavItem = ({ icon, label, active, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-mono text-sm transition-all ${
      active ? 'bg-white font-bold text-vintage-crimson shadow-sm border border-vintage-ink/10' : 'text-vintage-ink/60 hover:bg-white/50 hover:text-vintage-ink'
    }`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
      {label}
    </div>
    {badge && <span className="bg-vintage-crimson text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{badge}</span>}
  </button>
);

const BookmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-vintage-ink hover:scale-110 transition-transform cursor-pointer">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);
