import React, { useState } from 'react';
import { UserOut } from '../../types';
import { AuthService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, GraduationCap, ArrowRight } from 'lucide-react';
import { FormField } from '../forms/FormField';

interface Props {
  isOpen: boolean;
  token: string | null;
  onComplete: (updatedUser: UserOut) => void;
}

export default function AcademicProfileModal({ isOpen, token, onComplete }: Props) {
  const { updateUser, user } = useAuth();
  
  const [formData, setFormData] = useState({
    academic_year: '',
    major: '',
    gpa: '',
    attendance_percent: '',
    study_hours: '',
    primary_objective: '',
    learning_protocols: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        academic_year: formData.academic_year || null,
        major: formData.major || null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        attendance_percent: formData.attendance_percent ? parseFloat(formData.attendance_percent) : null,
        study_hours: formData.study_hours ? parseFloat(formData.study_hours) : null,
        primary_objective: formData.primary_objective || null,
        learning_protocols: formData.learning_protocols ? formData.learning_protocols.split(',').map(s => s.trim()).filter(Boolean) : null,
      };
      
      const res = await AuthService.updateProfile(payload, token);
      if (res.success && res.data) {
        updateUser(res.data);
        onComplete(res.data);
      } else {
        throw new Error(res.message || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-vintage-ink/60 backdrop-blur-sm" />
      
      <div className="bg-vintage-paper w-full max-w-lg relative z-10 p-8 shadow-2xl rounded-sm border border-vintage-ink/10 animate-in zoom-in-95 duration-200">
        
        {/* Tape decoration */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/60 shadow-sm transform -rotate-2" />
        
        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-vintage-crimson/10 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-vintage-crimson" />
          </div>
          <h2 className="font-display font-black text-3xl text-vintage-crimson tracking-tight">Academic Profile</h2>
          <p className="text-center font-sans text-sm text-vintage-ink/60 mt-2 leading-relaxed">
            Welcome to Academix! Before you start, let's set up your academic profile so the AI can tailor its recommendations specifically for you.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-vintage-crimson/10 border border-vintage-crimson/30 rounded-md text-sm text-vintage-crimson font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Academic Year" type="text" value={formData.academic_year} onChange={e => handleInputChange('academic_year', e.target.value)} placeholder="e.g. Freshman" required />
            <FormField label="Major" type="text" value={formData.major} onChange={e => handleInputChange('major', e.target.value)} placeholder="e.g. Comp Sci" required />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Target GPA" type="number" step="0.1" value={formData.gpa} onChange={e => handleInputChange('gpa', e.target.value)} placeholder="e.g. 3.8" />
            <FormField label="Attendance %" type="number" step="0.1" value={formData.attendance_percent} onChange={e => handleInputChange('attendance_percent', e.target.value)} placeholder="e.g. 85" />
            <FormField label="Study Hrs/Wk" type="number" value={formData.study_hours} onChange={e => handleInputChange('study_hours', e.target.value)} placeholder="e.g. 15" />
          </div>

          <FormField label="Primary Objective" type="text" value={formData.primary_objective} onChange={e => handleInputChange('primary_objective', e.target.value)} placeholder="e.g. Get an internship at Google" required />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full vintage-btn py-3 mt-6 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

      </div>
    </div>
  );
}
