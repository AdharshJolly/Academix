import React, { useState } from 'react';
import { ModalShell } from '../shared/ModalShell';
import { FormField } from '../forms/FormField';
import { WorkspaceTaskData } from './WorkspaceTask';

interface QuickCaptureModalProps {
  onClose: () => void;
  onSave: (
    data: any,
    subject: string,
    type: string
  ) => void;
  existingSubjects: string[];
}

export function QuickCaptureModal({ onClose, onSave, existingSubjects }: QuickCaptureModalProps) {
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('Assignment');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskSyncCalendar, setNewTaskSyncCalendar] = useState(true);
  const [newTaskReminderTime, setNewTaskReminderTime] = useState('24h');

  const handleSave = () => {
    if (!newTaskSubject || !newTaskTitle) return;
    
    const data = {
      title: newTaskTitle,
      description: `${newTaskSubject} - ${newTaskType}`,
      due_date: newTaskDate || new Date().toISOString(),
      priority: newTaskPriority.toLowerCase(),
      status: 'pending',
      add_to_calendar: newTaskSyncCalendar,
      reminder_time: newTaskReminderTime
    };

    onSave(data, newTaskSubject, newTaskType);
  };

  return (
    <ModalShell onClose={onClose}>
      <h3 className="font-display font-black text-xl text-vintage-ink mb-4">Quick Capture</h3>
      
      <div className="space-y-4">
        <div>
          <FormField 
            label="Subject *"
            type="text" 
            list="workspace-subjects"
            placeholder="e.g. CS 301"
            value={newTaskSubject}
            onChange={(e: any) => setNewTaskSubject(e.target.value)}
            className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
          />
          <datalist id="workspace-subjects">
            {existingSubjects.map(sub => (
              <option key={sub} value={sub} />
            ))}
          </datalist>
        </div>
        <FormField 
          label="Title *"
          type="text" 
          placeholder="Task name"
          value={newTaskTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
        />
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
          onClick={onClose}
          className="px-4 py-2 text-sm font-bold font-mono text-vintage-ink/60 hover:text-vintage-ink transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={!newTaskSubject || !newTaskTitle}
          className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark disabled:opacity-50 transition-colors"
        >
          Save Task
        </button>
      </div>
    </ModalShell>
  );
}
