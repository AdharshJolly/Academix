import React from 'react';
import { Sparkles, Paperclip, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { ExtractedEvent, Recommendation, IntelligenceResponse } from '../../types/index';
import { motion } from 'framer-motion';

interface AIInboxProps {
  noticeText: string;
  setNoticeText: (t: string) => void;
  isProcessingNotice: boolean;
  noticeResult: IntelligenceResponse | null;
  noticeError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessNotice: () => void;
  onClearResult: () => void;
  onClearError: () => void;
}

export function AIInbox({
  noticeText,
  setNoticeText,
  isProcessingNotice,
  noticeResult,
  noticeError,
  fileInputRef,
  onFileUpload,
  onProcessNotice,
  onClearResult,
  onClearError
}: AIInboxProps) {
  return (
    <motion.div key="extract" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <h2 className="text-2xl font-black font-display text-vintage-ink mb-6">AI Notice Scanner</h2>
      <div className="bg-white rounded-xl border border-vintage-ink/10 p-4 shadow-sm">
        <textarea 
          placeholder="Paste your syllabus, notice, or email here..."
          value={noticeText}
          onChange={(e) => setNoticeText(e.target.value)}
          className="w-full h-40 bg-transparent border-none resize-none focus:outline-none font-mono text-sm text-vintage-ink placeholder:text-vintage-ink/30"
        ></textarea>
        
        {/* Error Banner */}
        {noticeError && (
          <div className="mt-3 p-3 bg-vintage-crimson/10 border border-vintage-crimson/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-vintage-crimson shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-vintage-crimson flex-1">{noticeError}</p>
            <button onClick={onClearError} className="text-vintage-crimson/60 hover:text-vintage-crimson">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Results Panel */}
        {noticeResult && (
          <div className="mt-4 p-4 bg-vintage-paper rounded border border-vintage-ink/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm font-mono">Extracted Details</h4>
              <button onClick={onClearResult} className="text-vintage-ink/30 hover:text-vintage-ink text-xs font-mono">Clear</button>
            </div>
            {noticeResult.extracted_events?.length > 0 ? (
                <ul className="text-xs font-mono text-vintage-ink/80 space-y-1 mb-3">
                  {noticeResult.extracted_events.map((ev: ExtractedEvent, idx: number) => (
                    <li key={idx} className="flex gap-2"><span className="text-vintage-crimson">◆</span> <span><strong>{ev.title}</strong> — {ev.date} ({ev.subject})</span></li>
                  ))}
                </ul>
            ) : (
              <p className="text-xs font-mono text-vintage-ink/50 mb-3">No specific dates extracted.</p>
            )}
            {noticeResult.recommendations?.length > 0 && (
              <>
                <h4 className="font-bold text-xs font-mono text-vintage-ink/60 uppercase tracking-widest mb-2">Recommendations</h4>
                <ul className="text-xs font-mono text-vintage-ink/80 space-y-1">
                  {noticeResult.recommendations.map((r: Recommendation, idx: number) => (
                      <li key={idx} className="flex gap-2"><span className="text-vintage-crimson">→</span> {r.action}</li>
                  ))}
                </ul>
              </>
            )}
            {noticeResult.risk_assessment && (
              <div className="mt-3 pt-3 border-t border-vintage-ink/10 flex items-center gap-2">
                <span className="text-xs font-mono text-vintage-ink/50">Risk Level:</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  noticeResult.risk_assessment.risk_level === 'high' ? 'bg-vintage-crimson/10 text-vintage-crimson' :
                  noticeResult.risk_assessment.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>{noticeResult.risk_assessment.risk_level?.toUpperCase()}</span>
                <span className="text-xs font-mono text-vintage-ink/40">({Math.round((noticeResult.risk_assessment.risk_score || 0) * 100)}% risk score)</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-vintage-ink/10">
          <div className="text-xs font-mono text-vintage-ink/40 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> {isProcessingNotice ? 'AI is processing...' : 'AI is ready to extract tasks'}
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={onFileUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingNotice}
              className="bg-white text-vintage-ink border border-vintage-ink/20 px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-ink/5 flex items-center gap-2 disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" /> Upload
            </button>
            <button 
              onClick={onProcessNotice}
              disabled={isProcessingNotice || (!noticeText || noticeText.includes('File uploaded:'))}
              className="bg-vintage-crimson text-white px-4 py-2 rounded-md text-sm font-bold font-mono hover:bg-vintage-crimsonDark flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessingNotice ? 'Processing...' : 'Process'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
