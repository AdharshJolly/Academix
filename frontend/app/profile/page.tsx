'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, Save, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate save
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-2xl font-bold text-white mb-8">Profile Settings</h1>
      
      <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <img 
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full bg-white/5 border border-white/10 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.full_name || 'Demo User'}</h2>
            <p className="text-slate-400 mt-1">{user?.email || 'demo@campusflow.edu'}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-neonGreen/10 border border-neonGreen/20 text-neonGreen text-xs font-bold rounded-full">
              <Shield className="w-3 h-3" /> STUDENT ACCOUNT
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full cyber-input py-2.5 pl-10 pr-4"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Email address cannot be changed. Contact support for assistance.</p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button 
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-neonBlue text-black font-semibold rounded-xl hover:bg-neonBlue/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
