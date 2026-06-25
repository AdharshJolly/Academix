'use client';

import React, { useState } from 'react';
import { Bell, MessageCircle, Calendar as CalendarIcon, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);
  const [reminderTiming, setReminderTiming] = useState('24');

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-2xl font-bold text-white mb-8">System Settings</h1>
      
      <div className="space-y-6">
        
        {/* Notification Settings */}
        <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Bell className="w-5 h-5 text-neonBlue" />
            <h2 className="text-lg font-semibold text-white">Notifications & Alerts</h2>
          </div>
          
          <div className="p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-neonGreen" /> WhatsApp Reminders
                </h3>
                <p className="text-sm text-slate-400">Receive urgent deadlines and schedule changes via WhatsApp.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={whatsappEnabled} onChange={() => setWhatsappEnabled(!whatsappEnabled)} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonGreen"></div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div>
                <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-neonBlue" /> Google Calendar Sync
                </h3>
                <p className="text-sm text-slate-400">Automatically push AI-generated study sessions to your calendar.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={calendarSync} onChange={() => setCalendarSync(!calendarSync)} />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonBlue glow-blue"></div>
              </label>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="font-medium text-white mb-3">Default Reminder Timing</h3>
              <select 
                value={reminderTiming}
                onChange={(e) => setReminderTiming(e.target.value)}
                className="w-full cyber-input py-2.5 px-4 appearance-none"
              >
                <option value="12">12 Hours before deadline</option>
                <option value="24">24 Hours before deadline</option>
                <option value="48">48 Hours before deadline</option>
                <option value="168">1 Week before deadline</option>
              </select>
            </div>

          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel border border-neonRed/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-neonRed/20 flex items-center gap-3 bg-neonRed/5">
            <ShieldAlert className="w-5 h-5 text-neonRed" />
            <h2 className="text-lg font-semibold text-neonRed">Danger Zone</h2>
          </div>
          <div className="p-6">
            <h3 className="font-medium text-white mb-2">Delete Account</h3>
            <p className="text-sm text-slate-400 mb-4">Permanently delete your account, academic data, and AI intelligence reports. This action cannot be undone.</p>
            <button className="px-4 py-2 border border-neonRed/30 text-neonRed hover:bg-neonRed/10 rounded-lg text-sm font-medium transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
