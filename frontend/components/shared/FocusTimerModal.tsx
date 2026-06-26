import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Target, Coffee } from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
}

export function FocusTimerModal({ isOpen, onClose, taskTitle }: FocusTimerModalProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      // Play a sound if we wanted to
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-vintage-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative border-2 border-vintage-ink/10 animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-vintage-ink/40 hover:text-vintage-crimson hover:bg-vintage-crimson/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-black text-vintage-ink tracking-tight mb-2">Focus Mode</h2>
          {taskTitle ? (
            <p className="text-sm font-mono text-vintage-ink/60 bg-vintage-babyBlue/20 py-1.5 px-3 rounded-full inline-block">
              Currently working on: <span className="font-bold text-vintage-crimson">{taskTitle}</span>
            </p>
          ) : (
            <p className="text-sm font-mono text-vintage-ink/60">Time to lock in.</p>
          )}
        </div>

        {/* Mode Selector */}
        <div className="flex bg-vintage-ink/5 p-1 rounded-full mb-8">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-mono font-bold text-sm transition-all ${
              mode === 'focus' 
                ? 'bg-vintage-crimson text-white shadow-md' 
                : 'text-vintage-ink/50 hover:text-vintage-ink'
            }`}
          >
            <Target className="w-4 h-4" /> Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-mono font-bold text-sm transition-all ${
              mode === 'break' 
                ? 'bg-[#10B981] text-white shadow-md' 
                : 'text-vintage-ink/50 hover:text-vintage-ink'
            }`}
          >
            <Coffee className="w-4 h-4" /> Break
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-7xl font-mono font-bold tracking-tighter text-vintage-ink mb-8 tabular-nums">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={resetTimer}
              className="p-4 rounded-full bg-vintage-ink/5 text-vintage-ink hover:bg-vintage-ink/10 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleTimer}
              className={`p-6 rounded-full text-white shadow-xl hover:-translate-y-1 transition-all ${
                isActive ? 'bg-vintage-ink' : (mode === 'focus' ? 'bg-vintage-crimson' : 'bg-[#10B981]')
              }`}
            >
              {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
