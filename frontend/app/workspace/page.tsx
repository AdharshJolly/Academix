'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Filter, Inbox, 
  CheckCircle, Archive, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import ErrorBoundary from '../../components/shared/ErrorBoundary';
import { FocusTimerModal } from '../../components/shared/FocusTimerModal';

import { useTasks } from '../../hooks/workspace/useTasks';
import { useNoticeProcessing } from '../../hooks/workspace/useNoticeProcessing';
import { useCopilotChat } from '../../hooks/workspace/useCopilotChat';

import { TaskList } from '../../components/workspace/TaskList';
import { AIInbox } from '../../components/workspace/AIInbox';
import { CopilotChat } from '../../components/workspace/CopilotChat';
import { QuickCaptureModal } from '../../components/workspace/QuickCaptureModal';
import { EditTaskModal } from '../../components/workspace/EditTaskModal';
import { WorkspaceTaskData } from '../../components/workspace/WorkspaceTask';

function WorkspaceContent() {
  const { user, token } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'tasks' | 'inbox' | 'extract' | 'completed'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hooks
  const { 
    tasks, 
    isLoading, 
    isDeletingTask, 
    createTask, 
    updateTask, 
    approveTask, 
    deleteTask 
  } = useTasks(token);
  
  const noticeProcessing = useNoticeProcessing(token);
  const copilotChat = useCopilotChat(token);

  // Selection & Modal State
  const [selectedItem, setSelectedItem] = useState<WorkspaceTaskData | null>(null);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [showWorkspaceFocusTimer, setShowWorkspaceFocusTimer] = useState(false);
  
  // Edit Task State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<WorkspaceTaskData | null>(null);

  // Derivations
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'tasks') return matchesSearch && task.status !== 'completed' && task.status !== 'pending_review';
    if (activeTab === 'inbox') return matchesSearch && task.status === 'pending_review';
    if (activeTab === 'completed') return matchesSearch && task.status === 'completed';
    return matchesSearch;
  });

  const inboxCount = tasks.filter(t => t.status === 'pending_review').length;
  const existingSubjects = Array.from(new Set(tasks.map(t => t.subject)));

  // Handlers
  const handleQuickCaptureSave = async (data: any, subject: string, type: string) => {
    const newTask = await createTask(data, subject, type);
    if (newTask) {
      setSelectedItem(newTask);
      setShowQuickCapture(false);
    }
  };

  const handleEditTaskSave = async (id: string, title: string, subject: string, priority: string, dueDate: string) => {
    const updates = { title, description: subject, priority, ...(dueDate ? { due_date: dueDate } : {}) };
    const displayUpdates = { title, subject, priority };
    const updated = await updateTask(id, updates, displayUpdates);
    if (updated) {
      if (selectedItem?.id === id) setSelectedItem(updated);
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const handleApprove = async (task: WorkspaceTaskData) => {
    const updated = await approveTask(task);
    if (updated && selectedItem?.id === task.id) {
      setSelectedItem(updated);
    }
  };

  const handleDelete = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success && selectedItem?.id === taskId) {
      setSelectedItem(null);
    }
  };

  const openEditModal = (task: WorkspaceTaskData) => {
    setEditingTask(task);
    setShowEditModal(true);
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
                <TaskList
                  activeTab={activeTab}
                  tasks={filteredTasks}
                  isLoading={isLoading}
                  selectedItem={selectedItem}
                  isDeletingTask={isDeletingTask}
                  onSelect={setSelectedItem}
                  onApprove={handleApprove}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              )}

              {activeTab === 'extract' && (
                <AIInbox
                  noticeText={noticeProcessing.noticeText}
                  setNoticeText={noticeProcessing.setNoticeText}
                  isProcessingNotice={noticeProcessing.isProcessingNotice}
                  noticeResult={noticeProcessing.noticeResult}
                  noticeError={noticeProcessing.noticeError}
                  fileInputRef={noticeProcessing.fileInputRef}
                  onFileUpload={noticeProcessing.handleFileUpload}
                  onProcessNotice={noticeProcessing.handleProcessNotice}
                  onClearResult={noticeProcessing.clearResult}
                  onClearError={noticeProcessing.clearError}
                />
              )}
            </AnimatePresence>
            
          </div>
        </div>

        {/* Right Panel: Context Panel */}
        <CopilotChat
          selectedItem={selectedItem}
          user={user}
          chatHistory={copilotChat.chatHistory}
          isChatLoading={copilotChat.isChatLoading}
          newComment={copilotChat.newComment}
          isLiked={copilotChat.isLiked}
          setNewComment={copilotChat.setNewComment}
          setIsLiked={copilotChat.setIsLiked}
          onAddComment={copilotChat.addComment}
          onFocus={() => setShowWorkspaceFocusTimer(true)}
        />
        
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showQuickCapture && (
          <QuickCaptureModal 
            onClose={() => setShowQuickCapture(false)}
            onSave={handleQuickCaptureSave}
            existingSubjects={existingSubjects}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => {
              setShowEditModal(false);
              setEditingTask(null);
            }}
            onSave={handleEditTaskSave}
          />
        )}
      </AnimatePresence>

      {/* Focus Timer */}
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
