'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@campusflow.edu');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Demo User');
  const [error, setError] = useState('');
  
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password, full_name: fullName });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative z-10 w-full min-h-screen pt-12 pb-12">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple/20 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel-heavy rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
          
          <div className="p-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neonBlue to-neonPurple flex items-center justify-center glow-blue mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">CampusFlow</h1>
              <p className="text-slate-400 text-center text-sm">Autonomous Academic Copilot</p>
            </div>

            <div className="flex p-1 bg-white/5 rounded-lg mb-8">
              <button 
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full cyber-input py-3 pl-10 pr-4"
                        required={!isLogin}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full cyber-input py-3 pl-10 pr-4"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full cyber-input py-3 pl-10 pr-4"
                  required
                />
              </div>

              {error && (
                <div className="text-neonRed text-sm bg-neonRed/10 p-3 rounded-lg border border-neonRed/20">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-neonBlue to-neonPurple text-white font-medium hover:opacity-90 transition-opacity glow-blue flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Access Dashboard' : 'Initialize Copilot'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              By continuing, you agree to the Academic Code of Conduct and terms.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
