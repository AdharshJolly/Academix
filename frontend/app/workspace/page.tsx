'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Filter, Calendar, Clock, Inbox, 
  CheckCircle, Archive, ChevronRight, MessageCircle, Heart, Share2, Sparkles, Send, Smile, Paperclip, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { TaskService } from '../../services/task.service';
import { useEffect } from 'react';

// Fallback empty state
const INITIAL_TASKS: any[] = [];

export default function WorkspacePage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'inbox' | 'completed'>('tasks');
  const [tasks, setTasks] = useState<any[]>(INITIAL_TASKS);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (!token) return;
    TaskService.getTasks(token).then(res => {
      if (res.success && res.data?.items) {
        const fetchedTasks = res.data.items.map(t => ({
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
    }).catch(console.error);
  }, [token]);
  
  // Quick Capture State
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('Assignment');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDate, setNewTaskDate] = useState('');

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Instagram-style comment state
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<{user: string, text: string}[]>([
    { user: 'ai_copilot', text: 'I have automatically synced this to your calendar and set a WhatsApp reminder 24h prior.' }
  ]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { user: user?.full_name || 'You', text: newComment }]);
    setNewComment('');
  };

  const handleQuickCapture = async () => {
    if (!newTaskSubject || !newTaskTitle || !token) return;
    
    const data = {
      title: newTaskTitle,
      description: `${newTaskSubject} - ${newTaskType}`,
      due_date: newTaskDate || new Date().toISOString(),
      priority: newTaskPriority.toLowerCase() as any,
      status: 'pending' as any
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
          <NavItem icon={<Inbox />} label="AI Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} badge="2" />
          
          <div className="my-2 border-b border-vintage-ink/10"></div>
          
          <NavItem icon={<Archive />} label="Completed" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
        </div>

        {/* Middle Panel: Active Work Area */}
        <div className="flex-1 bg-white/40 flex flex-col overflow-y-auto">
          <div className="p-6 max-w-3xl w-full mx-auto">
            
            <AnimatePresence mode="wait">
              {activeTab === 'tasks' && (
                <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">Today's Focus</h2>
                  <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <p className="text-vintage-ink/50 font-mono text-sm">No tasks found matching your search.</p>
                    ) : (
                      filteredTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedItem(task)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedItem?.id === task.id 
                              ? 'bg-white border-vintage-crimson shadow-sm scale-[1.01]' 
                              : 'bg-white/50 border-vintage-ink/10 hover:border-vintage-ink/30 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="mt-1 w-5 h-5 rounded-md border-2 border-vintage-ink/20 flex items-center justify-center"></div>
                              <div>
                                <h3 className="font-bold text-vintage-ink font-mono">{task.title}</h3>
                                <p className="text-sm text-vintage-ink/60 font-mono mt-1">{task.subject} • {task.type}</p>
                              </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              task.priority === 'High' ? 'bg-vintage-crimsonLight/20 text-vintage-crimson' : 
                              'bg-vintage-ink/5 text-vintage-ink/60'
                            }`}>
                              {task.priority}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'inbox' && (
                <motion.div key="inbox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">AI Notice Processor</h2>
                  <div className="bg-white rounded-xl border border-vintage-ink/10 p-4 shadow-sm">
                    <textarea 
                      placeholder="Paste your syllabus, notice, or email here..."
                      className="w-full h-40 bg-transparent border-none resize-none focus:outline-none font-mono text-sm text-vintage-ink placeholder:text-vintage-ink/30"
                    ></textarea>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-vintage-ink/10">
                      <div className="text-xs font-mono text-vintage-ink/40 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> AI is ready to extract tasks
                      </div>
                      <button className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark flex items-center gap-2">
                        Process Notice <ArrowRight className="w-4 h-4" />
                      </button>
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
                  {comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-vintage-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                         {c.user === 'ai_copilot' ? (
                           <Sparkles className="w-3 h-3 text-neonBlue" />
                         ) : (
                           <img src={user?.avatar_url || '/avatars/doodle_dog.png'} alt="avatar" className="w-full h-full object-cover" />
                         )}
                      </div>
                      <p className="text-sm font-mono text-vintage-ink/80 leading-tight">
                        <span className="font-bold text-vintage-ink mr-2">{c.user}</span>
                        {c.text}
                      </p>
                    </div>
                  ))}
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
                  disabled={!newComment.trim()}
                  className={`text-sm font-bold font-mono transition-colors ${newComment.trim() ? 'text-neonBlue' : 'text-neonBlue/40'}`}
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
    </div>
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
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
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
