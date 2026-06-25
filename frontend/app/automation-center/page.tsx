'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { Calendar as CalendarIcon, CheckSquare, FileText, Zap, Sparkles, Server, Terminal, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AutomationCenterPage() {
  const { data } = useDashboard();
  const { token } = useAuth();
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{type: string, success: boolean} | null>(null);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load automation logs on mount
  useEffect(() => {
    if (!token) return;
    setLogsLoading(true);
    apiClient.get<any>(API_ENDPOINTS.AUTOMATIONS_LIST, token)
      .then(res => {
        if (res.success && res.data?.items) {
          setAutomationLogs(res.data.items);
        } else if (res.success && Array.isArray(res.data)) {
          setAutomationLogs(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLogsLoading(false));
  }, [token]);

  const handleManualTrigger = async (type: string) => {
    if (!token) return;
    setTriggering(type);
    setTriggerResult(null);
    try {
      const res = await apiClient.post<any>(API_ENDPOINTS.AUTOMATION_TRIGGER(type), {}, token);
      setTriggerResult({ type, success: res.success });
      // Refresh logs
      if (token) {
        const logsRes = await apiClient.get<any>(API_ENDPOINTS.AUTOMATIONS_LIST, token);
        if (logsRes.success && logsRes.data?.items) setAutomationLogs(logsRes.data.items);
      }
    } catch (e) {
      console.error(e);
      setTriggerResult({ type, success: false });
    } finally {
      setTriggering(null);
      setTimeout(() => setTriggerResult(null), 4000);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    } catch { return iso; }
  };

  const logs = automationLogs.length > 0
    ? automationLogs
    : (data?.recent_automations || []);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto py-8">
      
      <div className="flex items-end justify-between border-b border-vintage-ink/10 pb-6 mb-12 relative">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-2 relative z-10">
            command &amp; control
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Automations</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-vintage-babyBlue/20 border-2 border-vintage-ink/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-mono font-bold text-xs uppercase tracking-widest text-vintage-ink/60">Systems Online</span>
        </div>
      </div>

      {/* Trigger Result Banner */}
      {triggerResult && (
        <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 border ${
          triggerResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-vintage-crimson/10 border-vintage-crimson/30 text-vintage-crimson'
        }`}>
          {triggerResult.success
            ? <CheckCircle className="w-5 h-5 shrink-0" />
            : <XCircle className="w-5 h-5 shrink-0" />
          }
          <p className="font-mono text-sm font-bold">
            {triggerResult.success
              ? `${triggerResult.type.toUpperCase()} automation triggered successfully. Calendar & WhatsApp will process shortly.`
              : `${triggerResult.type.toUpperCase()} automation failed. Check your Google Calendar connection and Make.com webhook.`
            }
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        
        {/* Calendar Sync Card */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group border border-vintage-ink/5 relative transform -rotate-1 hover:rotate-0 transition-transform shadow-md bg-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-md shadow-sm transform rotate-3"></div>
          
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-vintage-babyBlue/10 text-vintage-ink border-2 border-dashed border-vintage-ink/20 group-hover:bg-vintage-crimson group-hover:text-white group-hover:border-transparent transition-all">
             <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest text-vintage-ink mb-4 border-b-2 border-vintage-ink/10 pb-4 w-full">Calendar Sync</h3>
          <p className="text-vintage-ink/80 text-base font-sans font-medium mb-8 flex-1">Push study schedules directly to your Google Calendar.</p>
          <button 
            onClick={() => handleManualTrigger('schedule')}
            disabled={!!triggering}
            className="vintage-btn-outline w-full disabled:opacity-50"
          >
            {triggering === 'schedule' ? 'Syncing...' : 'Trigger Sync'}
          </button>
        </div>

        {/* Task Sync Card (Active/Primary) */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group relative transform scale-105 shadow-xl bg-[#73010b] text-[#fcf3cf] border-4 border-black z-10">
          <div className="absolute top-[-15px] left-[-15px] bg-[#fcf3cf] text-black text-xs font-mono font-black px-4 py-1 rounded-sm transform -rotate-12 shadow-md border-2 border-black z-20 uppercase tracking-widest">
            Primary Node
          </div>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-black/20 border-2 border-[#fcf3cf]/20 backdrop-blur-sm">
             <CheckSquare className="w-8 h-8 text-[#fcf3cf]" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest mb-4 border-b-2 border-[#fcf3cf]/20 pb-4 w-full">Task Sync</h3>
          <p className="text-[#fcf3cf]/90 text-base font-sans font-medium mb-8 flex-1">Sync tasks to Google Calendar + send WhatsApp reminder.</p>
          <button 
            onClick={() => handleManualTrigger('task')}
            disabled={!!triggering}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-[#fcf3cf] text-black font-mono font-black uppercase tracking-wider text-sm rounded-sm shadow-md hover:shadow-lg transition-all border-2 border-black disabled:opacity-50"
          >
             {triggering === 'task' ? 'Executing Protocol...' : 'Force Sync'}
          </button>
        </div>

        {/* Notice Scan Card */}
        <div className="vintage-panel p-8 flex flex-col items-center text-center group border border-vintage-ink/5 relative transform rotate-1 hover:rotate-0 transition-transform shadow-md bg-white">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-md shadow-sm transform -rotate-3"></div>

          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-vintage-babyBlue/10 text-vintage-ink border-2 border-dashed border-vintage-ink/20 group-hover:bg-vintage-crimson group-hover:text-white group-hover:border-transparent transition-all">
             <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-mono font-black uppercase tracking-widest text-vintage-ink mb-4 border-b-2 border-vintage-ink/10 pb-4 w-full">Notice Scan</h3>
          <p className="text-vintage-ink/80 text-base font-sans font-medium mb-8 flex-1">Trigger AI to process any pending academic notices.</p>
          <button 
            onClick={() => handleManualTrigger('notice')}
            disabled={!!triggering}
            className="vintage-btn-outline w-full disabled:opacity-50"
          >
             {triggering === 'notice' ? 'Processing...' : 'Trigger Scan'}
          </button>
        </div>
      </div>

      {/* Receipt Style Log */}
      <div className="relative mx-auto w-full max-w-4xl">
        {/* Hardware Top bar */}
        <div className="h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-xl border-x-2 border-t-2 border-gray-500 shadow-inner flex items-center px-6 gap-4">
           <Server className="w-4 h-4 text-gray-600" />
           <span className="text-[10px] font-mono font-black text-gray-600 uppercase tracking-widest">Syslog Output Terminal</span>
           {logsLoading && <span className="ml-auto text-[10px] font-mono text-gray-500 animate-pulse">Loading...</span>}
        </div>
        
        {/* Receipt Paper */}
        <div className="bg-[#fdfbf7] p-8 border-x-2 border-gray-300 relative shadow-2xl min-h-[300px]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '100% 24px' }}>
          
          <h3 className="text-xl font-mono font-black text-vintage-ink mb-8 border-b-2 border-dashed border-vintage-ink/30 pb-4 uppercase tracking-widest flex items-center gap-3">
            <Terminal className="w-5 h-5" />
            Execution Log
            <span className="ml-auto text-xs font-mono font-normal text-vintage-ink/40 normal-case">{logs.length} entries</span>
          </h3>
          
          <div className="space-y-6 font-mono">
            {logs.length === 0 ? (
              <p className="text-sm font-mono text-vintage-ink/40 text-center py-8">No automation logs yet. Trigger a workflow to see activity here.</p>
            ) : (
              logs.map((log: any, idx: number) => {
                const isSuccess = log.status === 'success' || log.status === 'pending';
                const workflowLabel = (log.workflow_type || log.workflow || 'automation').toUpperCase().replace('_', ' ');
                return (
                  <div key={log.id || idx} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group">
                    <span className="text-sm font-bold text-vintage-ink/50 w-28 shrink-0 mt-1">
                      [{log.triggered_at ? formatTime(log.triggered_at) : 'JUST NOW'}]
                    </span>
                    <div className={`flex-1 border-l-2 pl-4 pb-2 ${isSuccess ? 'border-vintage-crimson' : 'border-vintage-ink/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {isSuccess
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-vintage-crimson shrink-0" />
                        }
                        <p className="font-bold text-vintage-ink text-base">{workflowLabel}_COMPLETE</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          isSuccess ? 'bg-green-100 text-green-700' : 'bg-vintage-crimson/10 text-vintage-crimson'
                        }`}>{log.status}</span>
                      </div>
                      <p className="text-sm text-vintage-ink/60 leading-relaxed">
                        {log.result?.calendar_status && `Calendar: ${log.result.calendar_status}.`}
                        {log.result?.whatsapp_status && ` WhatsApp: ${log.result.whatsapp_status}.`}
                        {!log.result?.calendar_status && !log.result?.whatsapp_status && 'Automation processed successfully.'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Fading bottom gradient for realism */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fdfbf7] to-transparent pointer-events-none"></div>
        </div>
        
        {/* Zig Zag Bottom (Torn Paper effect) */}
        <div className="h-4 w-full flex text-[#fdfbf7]">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="flex-1 border-b-[8px] border-l-[8px] border-r-[8px] border-transparent border-t-[#fdfbf7] drop-shadow-md"></div>
          ))}
        </div>
      </div>

    </div>
  );
}
