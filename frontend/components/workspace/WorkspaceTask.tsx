import React from 'react';
import { CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { PriorityBadge } from '../shared/Badges';

export interface WorkspaceTaskData {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: string;
  priority: string;
  status: string;
  comments: any[];
}

interface WorkspaceTaskProps {
  task: WorkspaceTaskData;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: (task: WorkspaceTaskData) => void;
  onApprove: (task: WorkspaceTaskData, e: React.MouseEvent) => void;
  onEdit: (task: WorkspaceTaskData, e: React.MouseEvent) => void;
  onDelete: (taskId: string, e: React.MouseEvent) => void;
}

export function WorkspaceTask({ 
  task, 
  isSelected, 
  isDeleting, 
  onSelect, 
  onApprove, 
  onEdit, 
  onDelete 
}: WorkspaceTaskProps) {
  return (
    <div 
      onClick={() => onSelect(task)}
      className={`p-4 rounded-lg border cursor-pointer transition-all group ${
        isSelected 
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
          <PriorityBadge priority={task.priority} />
          {task.status === 'pending_review' && (
            <button
              onClick={(e) => onApprove(task, e)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-green-100 text-vintage-ink/40 hover:text-green-600 transition-all"
              title="Approve task"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => onEdit(task, e)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-vintage-ink/10 text-vintage-ink/40 hover:text-vintage-ink transition-all"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(task.id, e)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-vintage-crimson/10 text-vintage-ink/40 hover:text-vintage-crimson transition-all disabled:opacity-30"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
