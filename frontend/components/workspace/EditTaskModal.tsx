import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ModalShell } from '../shared/ModalShell';
import { FormField } from '../forms/FormField';
import { WorkspaceTaskData } from './WorkspaceTask';

interface EditTaskModalProps {
  task: WorkspaceTaskData | null;
  onClose: () => void;
  onSave: (id: string, title: string, subject: string, priority: string, dueDate: string) => void;
}

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditSubject(task.subject);
      setEditPriority(task.priority?.toLowerCase() || 'medium');
      setEditDueDate('');
    }
  }, [task]);

  if (!task) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-black text-xl text-vintage-ink">Edit Task</h3>
        <button onClick={onClose} className="text-vintage-ink/40 hover:text-vintage-ink">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4">
        <FormField
          label="Title *"
          type="text"
          value={editTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
          className="w-full bg-vintage-paper border border-vintage-ink/10 rounded p-2 text-sm font-mono focus:border-vintage-crimson outline-none"
          autoFocus
        />
        <FormField
          label="Subject"
          type="text"
          value={editSubject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditSubject(e.target.value)}
        />
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
          onClick={onClose}
          className="px-4 py-2 text-sm font-bold font-mono text-vintage-ink/60 hover:text-vintage-ink transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(task.id, editTitle, editSubject, editPriority, editDueDate)}
          disabled={!editTitle.trim()}
          className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark disabled:opacity-50 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </ModalShell>
  );
}
