'use client';

import React, { useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { Play, Zap, Calendar as CalendarIcon, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AutomationService } from '../../services/automation.service';

export default function AutomationCenterPage() {
  const { data } = useDashboard();
  const [triggering, setTriggering] = useState<string | null>(null);

  const automations = data?.recent_automations || [];

  const handleManualTrigger = async (type: 'task' | 'notice' | 'schedule') => {
    setTriggering(type);
    try {
      if (type === 'task') await AutomationService.triggerTaskWorkflow({ test: true });
      else if (type === 'notice') await AutomationService.triggerNoticeWorkflow({ test: true });
      else await AutomationService.triggerScheduleWorkflow({ test: true });
      
      // Usually we'd refresh here or show a toast
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setTriggering(null), 1000);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonPurple to-neonBlue flex items-center justify-center glow-purple mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Automation Center</h1>
        <p className="text-slate-400">Monitor and trigger your n8n workflow integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
          <CalendarIcon className="w-8 h-8 text-neonBlue mb-3" />
          <h3 className="text-white font-medium mb-1">Calendar Sync</h3>
          <p className="text-xs text-slate-400 mb-4">Push study schedules to GCal.</p>
          <button 
            onClick={() => handleManualTrigger('schedule')}
            disabled={triggering === 'schedule'}
            className="mt-auto px-4 py-2 w-full bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {triggering === 'schedule' ? 'Triggering...' : <><Play className="w-3 h-3" /> Run Now</>}
          </button>
        </div>

        <div className="glass-panel rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
          <MessageCircle className="w-8 h-8 text-neonGreen mb-3" />
          <h3 className="text-white font-medium mb-1">WhatsApp Reminders</h3>
          <p className="text-xs text-slate-400 mb-4">Send alerts via Twilio API.</p>
          <button 
            onClick={() => handleManualTrigger('notice')}
            disabled={triggering === 'notice'}
            className="mt-auto px-4 py-2 w-full bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {triggering === 'notice' ? 'Triggering...' : <><Play className="w-3 h-3" /> Run Now</>}
          </button>
        </div>

        <div className="glass-panel rounded-xl border border-white/10 p-6 flex flex-col items-center text-center">
          <Zap className="w-8 h-8 text-neonPurple mb-3" />
          <h3 className="text-white font-medium mb-1">Task Sync</h3>
          <p className="text-xs text-slate-400 mb-4">Automate task categorization.</p>
          <button 
            onClick={() => handleManualTrigger('task')}
            disabled={triggering === 'task'}
            className="mt-auto px-4 py-2 w-full bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {triggering === 'task' ? 'Triggering...' : <><Play className="w-3 h-3" /> Run Now</>}
          </button>
        </div>
      </div>

      <div className="glass-panel border border-white/10 rounded-xl overflow-hidden flex-1">
        <div className="px-6 py-4 border-b border-white/10 bg-black/20">
          <h3 className="text-lg font-semibold text-white">Execution Logs</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-sm">
                <th className="py-3 px-6 font-medium">Log ID</th>
                <th className="py-3 px-6 font-medium">Workflow Type</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium">Triggered At</th>
              </tr>
            </thead>
            <tbody>
              {automations.length > 0 ? automations.map(auto => (
                <tr key={auto.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-400">{auto.id}</td>
                  <td className="py-4 px-6 text-white font-medium capitalize">{auto.workflow_type}</td>
                  <td className="py-4 px-6">
                    {auto.status === 'success' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-neonGreen">
                        <CheckCircle2 className="w-4 h-4" /> SUCCESS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-neonRed">
                        <AlertCircle className="w-4 h-4" /> FAILED
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-400">
                    {new Date(auto.triggered_at).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-8 text-center text-slate-500">No recent automation logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
