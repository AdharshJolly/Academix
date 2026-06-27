'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Settings, Save, Lock, Bell, Palette, Calendar, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth.service';
import { useSearchParams, useRouter } from 'next/navigation';
import WhatsAppSetupModal from '../../components/shared/WhatsAppSetupModal';
import { toast } from 'react-hot-toast';

function SettingsContent() {
  const { user, token, updateUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{success: boolean, message: string} | null>(null);

  const [googleStatus, setGoogleStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Backend now handles the OAuth exchange and redirects here with a result flag
    const connected = searchParams.get('google_connected');
    const googleError = searchParams.get('google_error');
    if (connected === 'true') {
      setGoogleStatus('success');
      router.replace('/settings'); // clean the URL
    } else if (googleError) {
      setGoogleStatus('error');
      router.replace('/settings');
    }
  }, [searchParams, router]);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    academic_year: user?.academic_year || '',
    major: user?.major || '',
    gpa: user?.gpa?.toString() || '',
    study_hours: user?.study_hours?.toString() || '',
    primary_objective: user?.primary_objective || '',
    learning_protocols: user?.learning_protocols?.join(', ') || '',
    whatsapp_notifications_enabled: user?.whatsapp_notifications_enabled ?? true,
    telegram_notifications_enabled: user?.telegram_notifications_enabled ?? false,
    telegram_username: user?.telegram_username || ''
  });

  const testTelegramConnection = async () => {
    if (!token) return;
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const response = await AuthService.testTelegramConnection(formData.telegram_username, token);
      if (response.success) {
        setTelegramTestResult({ success: true, message: response.message || 'Test successful' });
        toast.success(response.message || 'Telegram connection tested successfully');
      } else {
        setTelegramTestResult({ success: false, message: response.message || 'Test failed' });
        toast.error(response.message || 'Telegram test failed');
      }
    } catch (err: any) {
      setTelegramTestResult({ success: false, message: err.message || 'Failed to connect to backend' });
      toast.error(err.message || 'Failed to connect to backend');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setGoogleConnecting(true);
      const t = token || localStorage.getItem('academix_token') || '';
      if (!t) { toast.error('Please log in again.'); return; }
      const res = await AuthService.connectGoogleCalendar(t);
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err: any) {
      toast.error('Failed to initiate Google connection: ' + err.message);
      setGoogleConnecting(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name,
        academic_year: formData.academic_year || null,
        major: formData.major || null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        study_hours: formData.study_hours ? parseFloat(formData.study_hours) : null,
        primary_objective: formData.primary_objective || null,
        learning_protocols: formData.learning_protocols ? formData.learning_protocols.split(',').map(s => s.trim()).filter(Boolean) : null,
        whatsapp_notifications_enabled: formData.whatsapp_notifications_enabled,
        telegram_notifications_enabled: formData.telegram_notifications_enabled,
        telegram_username: formData.telegram_username || null,
      };
      
      const res = await AuthService.updateProfile(payload, token);
      if (res.success && res.data) {
        // Assume context has an updateUser method or just reload
        if (updateUser) {
            updateUser(res.data);
            toast.success("Settings saved successfully.");
        } else {
            // Quick reload to reflect changes globally if context update is tricky
            toast.success("Settings saved successfully.");
            setTimeout(() => window.location.reload(), 1000);
        }
      }
    } catch (err) {
      toast.error("Failed to save profile updates.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                    <input type="text" value={formData.full_name} onChange={e => handleInputChange('full_name', e.target.value)} className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Email Address</label>
                    <input type="email" disabled className="vintage-input bg-gray-100 border-vintage-ink/20 opacity-70 cursor-not-allowed" defaultValue={user?.email || ""} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Academic Year</label>
                    <input type="text" value={formData.academic_year} onChange={e => handleInputChange('academic_year', e.target.value)} placeholder="e.g. Junior" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Major</label>
                    <input type="text" value={formData.major} onChange={e => handleInputChange('major', e.target.value)} placeholder="e.g. Computer Science" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">GPA</label>
                    <input type="number" step="0.1" value={formData.gpa} onChange={e => handleInputChange('gpa', e.target.value)} placeholder="e.g. 3.8" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Primary Objective</label>
                  <input type="text" value={formData.primary_objective} onChange={e => handleInputChange('primary_objective', e.target.value)} placeholder="What's your main academic goal?" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Learning Protocols (comma separated)</label>
                  <input type="text" value={formData.learning_protocols} onChange={e => handleInputChange('learning_protocols', e.target.value)} placeholder="e.g. Feynman Technique, Pomodoro" className="vintage-input bg-vintage-babyBlue/5 border-vintage-ink/20 focus:border-vintage-crimson w-full" />
                </div>

                <div className="mt-8 pt-8 border-t border-vintage-ink/10">
                  <h3 className="text-xl font-display font-black text-vintage-crimson mb-2">Integrations</h3>
                  <p className="text-sm font-sans text-vintage-ink/60 mb-4">Connect external services to Academix.</p>

                  {googleStatus === 'success' && (
                    <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 font-mono text-sm rounded-lg px-4 py-3">
                      <span>✓</span>
                      <span>Google Calendar connected successfully! Your schedule will now sync automatically.</span>
                    </div>
                  )}
                  {googleStatus === 'error' && (
                    <div className="mb-4 flex items-center gap-2 bg-vintage-crimson/10 border border-vintage-crimson/30 text-vintage-crimson font-mono text-sm rounded-lg px-4 py-3">
                      <span>⚠</span>
                      <span>Failed to connect Google Calendar. Please try again.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border border-vintage-ink/10 rounded-lg bg-white/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-50 text-red-500 rounded-full">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-vintage-ink">Google Calendar</h4>
                        <p className="text-sm text-vintage-ink/60">
                          {googleStatus === 'success' ? '✓ Connected — syncing automatically' : 'Sync your academic schedule automatically.'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleConnectGoogle}
                      disabled={googleConnecting || googleStatus === 'success'}
                      className="vintage-btn py-2 px-4 text-sm disabled:opacity-50"
                    >
                      {googleConnecting ? 'Connecting...' : googleStatus === 'success' ? 'Connected ✓' : 'Connect'}
                    </button>
                  </div>

                  {/* Telegram Integration Row */}
                  <div className="flex items-center justify-between p-4 border border-vintage-ink/10 rounded-lg bg-white/50 mt-3">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-vintage-ink">Telegram Integration</h4>
                        <p className="text-sm text-vintage-ink/60">Connect Telegram to receive deadline alerts and reminders.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="vintage-btn py-2 px-4 text-sm"
                    >
                      Setup
                    </button>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'security' && (
              <div className="py-20 text-center relative z-10">
                <p className="font-mono text-sm text-vintage-ink/40 uppercase tracking-widest">Settings module under construction.</p>
                <p className="font-accent text-xl text-vintage-crimsonLight transform rotate-2 mt-4">check back later!</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 relative z-10">
                <div>
                  <h2 className="text-2xl font-display font-black text-vintage-crimson mb-2">Notifications</h2>
                  <p className="text-sm font-sans text-vintage-ink/60">Configure how you receive updates and reminders.</p>
                </div>
                
                <div className="typewriter-divider"></div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-vintage-paper border border-vintage-ink/10 p-4 rounded-md opacity-60">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-mono font-bold text-vintage-ink">WhatsApp Notifications</h4>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">Under Maintenance</span>
                      </div>
                      <p className="text-xs text-vintage-ink/60 font-sans">Temporarily disabled while we upgrade our messaging infrastructure.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-not-allowed">
                      <input type="checkbox" className="sr-only peer" disabled checked={false} />
                      <div className="w-11 h-6 bg-vintage-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex flex-col bg-vintage-paper border border-vintage-ink/10 p-4 rounded-md space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-mono font-bold text-vintage-ink mb-1">Telegram Integration</h4>
                        <p className="text-xs text-vintage-ink/60 font-sans">Receive reminders and push tasks via Telegram.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.telegram_notifications_enabled} onChange={(e) => handleInputChange('telegram_notifications_enabled', e.target.checked)} />
                        <div className="w-11 h-6 bg-vintage-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vintage-crimson"></div>
                      </label>
                    </div>
                    
                    <div className="flex flex-col pt-2 border-t border-vintage-ink/5">
                      <label className="text-xs font-mono font-bold text-vintage-ink/60 mb-2 uppercase tracking-widest">Telegram Username</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={formData.telegram_username}
                          onChange={(e) => handleInputChange('telegram_username', e.target.value)}
                          className="vintage-input flex-1"
                          placeholder="@your_username"
                        />
                        <button 
                          onClick={testTelegramConnection}
                          disabled={testingTelegram || !formData.telegram_username}
                          className="px-4 py-2 bg-vintage-ink text-white font-mono text-xs uppercase tracking-wider rounded disabled:opacity-50 hover:bg-vintage-ink/80 transition-colors"
                        >
                          {testingTelegram ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                      <p className="text-xs text-vintage-ink/40 mt-2">Enter your Telegram username to allow Academix to message you.</p>
                      {telegramTestResult && (
                        <div className={`mt-2 text-xs font-mono p-2 rounded ${telegramTestResult.success ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} border`}>
                          {telegramTestResult.success ? '✓ ' : '⚠ '}{telegramTestResult.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'security' && (
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-mono">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
