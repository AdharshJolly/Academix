'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import GoogleSyncModal from '../../components/shared/GoogleSyncModal';
import WhatsAppSetupModal from '../../components/shared/WhatsAppSetupModal';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [error, setError] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isRegisterFlow, setIsRegisterFlow] = useState(false);
  
  const { login, register, isLoading, token } = useAuth();
  const router = useRouter();
  // Store token locally after login so it's available immediately for Google connect
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      let user;
      if (isLogin) {
        user = await login({ email, password });
        setIsRegisterFlow(false);
      } else {
        user = await register({ email, password, full_name: fullName, whatsapp_number: whatsappNumber });
        setIsRegisterFlow(true);
      }
      
      // Grab the token that was just saved to localStorage
      const freshToken = localStorage.getItem('campusflow_token');
      setAuthToken(freshToken);
      
      if (!user?.google_calendar_connected) {
        setShowSyncModal(true);
        return;
      }
      
      // On register, show WhatsApp setup before going to dashboard
      if (!isLogin) {
        setShowWhatsAppModal(true);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogleConnect = async () => {
    setSyncLoading(true);
    setSyncError(null);
    try {
      const t = authToken || token || localStorage.getItem('campusflow_token') || '';
      if (!t) throw new Error('Not authenticated. Please log in again.');
      const res = await AuthService.connectGoogleCalendar(t);
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        throw new Error('No authorization URL returned from server.');
      }
    } catch (err: any) {
      setSyncError(err.message || 'Failed to start Google OAuth. Make sure Google credentials are configured.');
      setSyncLoading(false);
    }
  };

  const handleSyncSkip = () => {
    setShowSyncModal(false);
    // After skipping Google sync, show WhatsApp modal if it was a registration
    if (isRegisterFlow) {
      setShowWhatsAppModal(true);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative z-10 w-full min-h-screen pt-12 pb-12 p-6">
      
      <GoogleSyncModal
        isOpen={showSyncModal}
        isLoading={syncLoading}
        error={syncError}
        onConnect={handleGoogleConnect}
        onSkip={handleSyncSkip}
      />

      <WhatsAppSetupModal
        isOpen={showWhatsAppModal}
        onClose={() => { setShowWhatsAppModal(false); router.push('/dashboard'); }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Striped Accent Background */}
        <div className="absolute -inset-4 striped-bg rounded-2xl opacity-50 z-0"></div>

        <div className="vintage-panel p-10 bg-vintage-paper rounded-xl shadow-lg border border-vintage-ink/5 relative z-10">
          
          <div className="flex flex-col items-center justify-center mb-10 text-center relative">
            <h4 className="font-accent text-2xl text-vintage-crimsonLight transform -rotate-2 absolute -top-4 -right-2">
              sign in!
            </h4>
            <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter mb-2 w-full">
              CampusFlow
            </h1>
            <p className="font-mono text-vintage-ink/60 text-sm tracking-tight border-b border-vintage-ink/10 pb-6 w-full">
              academic_copilot_v1.0
            </p>
          </div>

          <div className="flex bg-white/50 rounded-lg p-1 mb-8 shadow-inner border border-vintage-ink/5">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-mono font-bold rounded-md transition-all z-10 ${isLogin ? 'bg-vintage-crimson text-white shadow-sm' : 'text-vintage-ink/60 hover:text-vintage-crimson'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-mono font-bold rounded-md transition-all z-10 ${!isLogin ? 'bg-vintage-crimson text-white shadow-sm' : 'text-vintage-ink/60 hover:text-vintage-crimson'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex flex-col mb-6">
                    <label className="text-xl font-accent text-vintage-crimson mb-1 transform -rotate-1">Full Name</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="vintage-input w-full"
                      placeholder="e.g. John Doe"
                      required={!isLogin}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xl font-accent text-vintage-crimson mb-1 transform rotate-1">WhatsApp Number</label>
                    <input 
                      type="tel" 
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="vintage-input w-full"
                      placeholder="e.g. +1234567890"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col">
              <label className="text-xl font-accent text-vintage-crimson mb-1 transform -rotate-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="vintage-input w-full"
                placeholder="e.g. student@campusflow.edu"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xl font-accent text-vintage-crimson mb-1 transform -rotate-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vintage-input w-full"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="text-white text-sm font-mono bg-vintage-crimsonLight p-3 rounded-md flex items-start gap-2 shadow-sm mt-4">
                <span>!</span>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-8 vintage-btn"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  {isLogin ? 'Enter Portal' : 'Apply Now'}
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <p className="font-accent text-lg text-vintage-ink/40 transform -rotate-1">save for later!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
