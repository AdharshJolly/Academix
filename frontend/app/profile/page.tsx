'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Shield, BookOpen, Clock, Star, Pencil, Check, Image as ImageIcon } from 'lucide-react';

// A diverse set of cute avatar options
const AVATAR_OPTIONS = [
  '/avatars/doodle_dog.png',
  '/avatars/doodle_cat.png',
  '/avatars/doodle_bunny.png',
  '/avatars/doodle_bear.png',
  '/avatars/doodle_fox.png',
  '/avatars/doodle_panda.png',
  '/avatars/doodle_pig.png',
  '/avatars/doodle_penguin.png',
  '/avatars/doodle_hamster.png',
  '/avatars/doodle_frog.png'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [currentAvatar, setCurrentAvatar] = useState(user?.avatar_url || AVATAR_OPTIONS[0]);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto py-8">
      
      <div className="flex items-end justify-between pb-6 mb-10 relative border-b border-vintage-ink/10">
        <div>
          <h4 className="font-accent text-3xl text-vintage-crimsonLight mb-[-10px] transform -rotate-2 relative z-10">
            personnel file
          </h4>
          <h1 className="text-6xl font-display font-black text-vintage-crimson tracking-tighter">Student Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Profile Card */}
        <div className="md:col-span-1">
          
          <div className="vintage-panel p-8 text-center relative z-10 flex flex-col items-center">
            
            <div className="relative inline-block mb-8">
              <div className="w-48 h-48 rounded-full border-4 border-white shadow-lg group bg-vintage-paper relative">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <img 
                    src={currentAvatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_OPTIONS[0] }}
                  />
                  <div className="absolute inset-0 bg-vintage-crimson/5 pointer-events-none mix-blend-multiply"></div>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute -bottom-2 -right-2 p-4 bg-white text-vintage-crimson rounded-full shadow-md hover:shadow-lg hover:-translate-y-1 transition-all border border-vintage-ink/5"
                title="Edit Avatar"
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-3xl font-display font-black text-vintage-crimson mb-2 tracking-tight break-words w-full">{user?.full_name || 'Demo User'}</h2>
            <p className="text-vintage-ink/60 font-mono font-bold text-sm uppercase tracking-widest mb-8 pb-8 border-b border-vintage-ink/10 w-full">Computer Science, B.S.</p>
            
            {isEditingAvatar && (
              <div className="mb-8 w-full text-left bg-vintage-babyBlue/10 p-5 rounded-xl border border-vintage-ink/5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-vintage-crimson mb-4">Select Cute Avatar</h4>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_OPTIONS.map((avatar, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setCurrentAvatar(avatar); setIsEditingAvatar(false); }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${currentAvatar === avatar ? 'border-vintage-crimson shadow-sm scale-105' : 'border-transparent hover:border-vintage-crimson/30 hover:scale-105'}`}
                    >
                      <img src={avatar} alt="option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="inline-flex items-center gap-3 px-5 py-3 bg-vintage-crimson/5 text-vintage-crimson font-mono font-bold text-sm rounded-full mb-8">
              <Shield className="w-5 h-5" /> Premium Access
            </div>

            <div className="w-full space-y-6 text-left pt-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-vintage-ink/50 uppercase tracking-widest">Email Designation</span>
                <span className="text-base font-mono font-bold text-vintage-ink break-all tracking-tight">{user?.email || 'demo@campusflow.edu'}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-vintage-ink/50 uppercase tracking-widest">Academic Year</span>
                <span className="text-base font-mono font-bold text-vintage-ink tracking-tight">Junior Year</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Identity */}
        <div className="md:col-span-2 space-y-12">
          
          <div className="grid grid-cols-2 gap-8">
            <div className="vintage-panel p-8 flex items-center justify-between group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-vintage-babyBlue/20 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-xs font-mono font-bold text-vintage-ink/60 uppercase tracking-widest mb-2">Current GPA</p>
                <p className="text-6xl font-display font-black text-vintage-crimson">3.84</p>
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm relative z-10 text-vintage-crimson border border-vintage-ink/5">
                <Star className="w-8 h-8" />
              </div>
            </div>
            
            <div className="vintage-panel p-8 flex items-center justify-between group overflow-hidden bg-vintage-crimson">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-xs font-mono font-bold text-white/80 uppercase tracking-widest mb-2">Study Hours</p>
                <p className="text-6xl font-display font-black text-white">42.5h</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-sm relative z-10 text-white border border-white/20 backdrop-blur-sm">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-display font-black text-vintage-crimson tracking-tight mb-8">
              Academic Identity
            </h3>
            
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-xl border border-vintage-ink/5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-vintage-crimson"></div>
                <label className="block text-xs font-mono font-bold text-vintage-ink/50 uppercase tracking-widest mb-4">
                  Primary Objective
                </label>
                <p className="text-xl font-mono font-bold text-vintage-ink leading-relaxed">
                  Maintain Dean's List while securing a Summer 2027 SWE Internship.
                </p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-accent text-2xl text-vintage-crimsonLight transform -rotate-3">you got this!</p>
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-xl border border-vintage-ink/5 shadow-sm">
                <label className="block text-xs font-mono font-bold text-vintage-ink/50 uppercase tracking-widest mb-5">
                  Learning Protocols
                </label>
                <div className="flex flex-wrap gap-4">
                  <span className="px-5 py-3 bg-vintage-babyBlue/20 text-vintage-crimson text-sm font-mono font-bold rounded-md">Visual Learner</span>
                  <span className="px-5 py-3 bg-vintage-babyBlue/20 text-vintage-crimson text-sm font-mono font-bold rounded-md">Pomodoro (50/10)</span>
                  <span className="px-5 py-3 bg-vintage-babyBlue/20 text-vintage-crimson text-sm font-mono font-bold rounded-md">Evening Peak</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-vintage-ink/5 shadow-sm">
                <label className="block text-xs font-mono font-bold text-vintage-ink/50 uppercase tracking-widest mb-5">
                  Registered Institutions
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-16 h-16 bg-vintage-crimson/5 rounded-full flex items-center justify-center text-vintage-crimson">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-vintage-ink mb-1">State University</p>
                    <p className="font-mono text-sm text-vintage-ink/50">Synced via Canvas LMS</p>
                  </div>
                  <div className="sm:ml-auto">
                    <span className="px-5 py-3 bg-vintage-crimson text-white text-xs font-mono font-bold uppercase tracking-widest rounded-md">Status: Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
