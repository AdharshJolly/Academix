import { useState, useEffect } from 'react';
import { TaskService } from '../../services/task.service';
import { WorkspaceTaskData } from '../../components/workspace/WorkspaceTask';
import { TaskResponse } from '../../types/index';

export function useTasks(token: string | null) {
  const [tasks, setTasks] = useState<WorkspaceTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);

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
      }
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [token]);

  const createTask = async (data: any, subject: string, type: string) => {
    if (!token) return null;
    try {
      const res = await TaskService.createTask(data, token);
      if (res.success && res.data) {
        const newTask: WorkspaceTaskData = {
          id: res.data.id,
          title: res.data.title,
          subject: subject,
          type: type,
          date: res.data.due_date ? new Date(res.data.due_date).toLocaleDateString() : 'No date',
          priority: res.data.priority,
          status: res.data.status,
          comments: []
        };
        setTasks(prev => [newTask, ...prev]);
        return newTask;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const updateTask = async (id: string, updates: any, displayUpdates: Partial<WorkspaceTaskData> = {}) => {
    if (!token) return null;
    try {
      const res = await TaskService.updateTask(id, updates, token);
      if (res.success) {
        let updatedTask: WorkspaceTaskData | null = null;
        setTasks(prev => prev.map(t => {
          if (t.id === id) {
            updatedTask = { ...t, ...displayUpdates };
            return updatedTask;
          }
          return t;
        }));
        return updatedTask;
      }
    } catch (e) {
      console.error('Update failed', e);
    }
    return null;
  };

  const approveTask = async (task: WorkspaceTaskData) => {
    return await updateTask(task.id, { status: 'pending' }, { status: 'pending' });
  };

  const deleteTask = async (taskId: string) => {
    if (!token) return false;
    setIsDeletingTask(taskId);
    try {
      await TaskService.deleteTask(taskId, token);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      return true;
    } catch (e) {
      console.error('Delete failed', e);
      return false;
    } finally {
      setIsDeletingTask(null);
    }
  };

  return {
    tasks,
    isLoading,
    isDeletingTask,
    createTask,
    updateTask,
    approveTask,
    deleteTask
  };
}
