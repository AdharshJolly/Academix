import React from 'react';
import { motion } from 'framer-motion';
import { SortDesc } from 'lucide-react';
import { EmptyState } from '../shared/States';
import SkeletonCard from '../shared/SkeletonCard';
import { WorkspaceTask, WorkspaceTaskData } from './WorkspaceTask';

interface TaskListProps {
  activeTab: 'tasks' | 'inbox' | 'completed';
  tasks: WorkspaceTaskData[];
  isLoading: boolean;
  selectedItem: WorkspaceTaskData | null;
  isDeletingTask: string | null;
  onSelect: (task: WorkspaceTaskData) => void;
  onApprove: (task: WorkspaceTaskData) => void;
  onEdit: (task: WorkspaceTaskData) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({
  activeTab,
  tasks,
  isLoading,
  selectedItem,
  isDeletingTask,
  onSelect,
  onApprove,
  onEdit,
  onDelete
}: TaskListProps) {
  const title = activeTab === 'tasks' ? "Today's Focus" : activeTab === 'inbox' ? "Pending Review" : "Completed Tasks";

  return (
    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">
        {title}
      </h2>
      <div className="space-y-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tasks.length === 0 ? (
          <EmptyState icon={SortDesc} title="No tasks found" subtitle="No tasks matching your search." />
        ) : (
          tasks.map(task => (
            <WorkspaceTask
              key={task.id}
              task={task}
              isSelected={selectedItem?.id === task.id}
              isDeleting={isDeletingTask === task.id}
              onSelect={onSelect}
              onApprove={(t, e) => { e.stopPropagation(); onApprove(t); }}
              onEdit={(t, e) => { e.stopPropagation(); onEdit(t); }}
              onDelete={(id, e) => { e.stopPropagation(); onDelete(id); }}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
