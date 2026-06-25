'use client';

import React, { useState } from 'react';
import { Settings, Save, Lock, Bell, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto py-8">
      
      <div className="flex items-end justify-between border-b border-vintage-ink/10 pb-6 mb-10">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform rotate-1 relative z-10">
            control room
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Settings</h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2 relative">
          <div className="absolute top-0 -left-6 bottom-0 w-px bg-vintage-ink/10 hidden md:block"></div>
          {[
            { id: 'account', label: 'Account', icon: Settings },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-mono font-bold tracking-wider rounded-md transition-all text-left ${
                  isActive 
                    ? 'bg-vintage-crimson text-white shadow-sm' 
                    : 'text-vintage-ink/70 hover:bg-vintage-crimson/5 hover:text-vintage-crimson'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1">
          <div className="vintage-panel p-8 md:p-10 border border-vintage-ink/5 relative overflow-hidden">
            
            {/* Decorative element */}
            <div className="absolute top-[-5%] right-[-5%] w-32 h-32 border border-vintage-ink/5 rounded-full pointer-events-none"></div>

            {activeTab === 'account' && (
              <div className="space-y-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-display font-black text-vintage-crimson mb-2">Account Details</h2>
                  <p className="text-sm font-sans text-vintage-ink/60">Update your basic profile information.</p>
                </div>
                
                <div className="typewriter-divider"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Full Name</label>
                    <input type="text" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson" defaultValue={user?.full_name || "Demo User"} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Email Address</label>
                    <input type="email" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson" defaultValue={user?.email || "demo@campusflow.edu"} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">University / Institution</label>
                  <input type="text" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" defaultValue="State University" />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-display font-black text-vintage-crimson mb-2">Appearance</h2>
                  <p className="text-sm font-sans text-vintage-ink/60">Customize the look and feel of CampusFlow.</p>
                </div>
                
                <div className="typewriter-divider"></div>
                
                <div>
                  <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-4 block uppercase tracking-widest">Theme Preference</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-vintage-crimson rounded-lg p-4 cursor-pointer text-center bg-vintage-crimson/5">
                      <div className="w-full h-12 bg-vintage-paper rounded-md mb-3 border border-vintage-ink/10 shadow-sm flex items-center justify-center">
                        <span className="font-accent text-vintage-crimson">Typewriter</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-vintage-crimson">Selected</span>
                    </div>
                    
                    <div className="border-2 border-vintage-ink/10 rounded-lg p-4 cursor-pointer text-center hover:border-vintage-crimson/30 transition-colors opacity-50">
                      <div className="w-full h-12 bg-zinc-900 rounded-md mb-3 border border-zinc-700 shadow-sm"></div>
                      <span className="text-xs font-mono font-bold text-vintage-ink/60">Dark Terminal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'security' || activeTab === 'notifications') && (
              <div className="py-20 text-center relative z-10">
                <p className="font-mono text-sm text-vintage-ink/40 uppercase tracking-widest">Settings module under construction.</p>
                <p className="font-accent text-xl text-vintage-crimsonLight transform rotate-2 mt-4">check back later!</p>
              </div>
            )}

            {activeTab !== 'security' && activeTab !== 'notifications' && (
              <div className="mt-12 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="vintage-btn gap-2 disabled:opacity-50 min-w-[140px]"
                >
                  {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
