import React from 'react';
import { Sparkles, Heart, MessageCircle, Share2, Target } from 'lucide-react';
import { WorkspaceTaskData } from './WorkspaceTask';
import { PriorityBadge } from '../shared/Badges';

interface ChatMessage {
  role: string;
  content: string;
}

interface CopilotChatProps {
  selectedItem: WorkspaceTaskData | null;
  user: any;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  newComment: string;
  isLiked: boolean;
  setNewComment: (c: string) => void;
  setIsLiked: (l: boolean) => void;
  onAddComment: () => void;
  onFocus: () => void;
}

const BookmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-vintage-ink hover:scale-110 transition-transform cursor-pointer">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);

export function CopilotChat({ 
  selectedItem, 
  user, 
  chatHistory, 
  isChatLoading, 
  newComment, 
  isLiked, 
  setNewComment, 
  setIsLiked, 
  onAddComment,
  onFocus
}: CopilotChatProps) {
  if (!selectedItem) {
    return (
      <div className="w-80 border-l border-vintage-ink/10 bg-white flex flex-col shrink-0">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
          <Sparkles className="w-8 h-8 mb-4 text-vintage-ink" />
          <p className="font-mono text-sm">Select an item to view AI context, insights, and discussion.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-vintage-ink/10 bg-white flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-vintage-ink/10 flex justify-between items-center bg-vintage-paper/50">
        <h3 className="font-bold font-mono text-sm text-vintage-ink">Context Panel</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Image/Preview (Instagram-style header for the task) */}
        <div className="w-full aspect-video bg-vintage-ink/5 border-b border-vintage-ink/10 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          <div className="absolute -inset-4 striped-bg opacity-30 z-0"></div>
          <div className="z-10 bg-white p-4 rounded-lg shadow-sm border border-vintage-ink/5 transform rotate-1">
            <h2 className="font-black font-display text-xl text-vintage-ink mb-1">{selectedItem.title}</h2>
            <p className="font-mono text-sm text-vintage-crimson">{selectedItem.date}</p>
          </div>
        </div>

        {/* Instagram Style Action Bar */}
        <div className="p-3 flex items-center justify-between border-b border-vintage-ink/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsLiked(!isLiked)} className="hover:scale-110 transition-transform">
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-vintage-crimson text-vintage-crimson' : 'text-vintage-ink'}`} />
            </button>
            <button className="hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-vintage-ink" />
            </button>
            <button className="hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6 text-vintage-ink" />
            </button>
            <button 
              onClick={onFocus}
              className="ml-2 px-3 py-1 bg-vintage-crimson text-white text-xs font-bold font-mono rounded-full hover:bg-vintage-crimsonDark flex items-center gap-1"
            >
              <Target className="w-3 h-3" /> Focus
            </button>
          </div>
          <BookmarkIcon />
        </div>

        {/* Details Section */}
        <div className="p-4 border-b border-vintage-ink/5">
          <p className="text-sm font-mono text-vintage-ink">
            <span className="font-bold">{user?.full_name || 'Demo User'}</span> Need to finish this before the weekend. Priority is set to <PriorityBadge priority={selectedItem.priority} />.
          </p>
        </div>

        {/* AI Insights & Comments */}
        <div className="p-4 flex flex-col gap-4">
          {chatHistory.map((c, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-vintage-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                 {c.role === 'assistant' ? (
                   <Sparkles className="w-3 h-3 text-neonBlue" />
                 ) : (
                   <img src={user?.avatar_url || '/avatars/doodle_dog.png'} alt="avatar" className="w-full h-full object-cover" />
                 )}
              </div>
              <p className="text-sm font-mono text-vintage-ink/80 leading-tight">
                <span className="font-bold text-vintage-ink mr-2">{c.role === 'assistant' ? 'ai_copilot' : (user?.full_name || 'You')}</span>
                {c.content}
              </p>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-vintage-ink/10 flex items-center justify-center overflow-hidden shrink-0">
                 <Sparkles className="w-3 h-3 text-neonBlue animate-pulse" />
              </div>
              <p className="text-sm font-mono text-vintage-ink/80 leading-tight animate-pulse">
                Thinking...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Comment Input (Instagram Style) */}
      <div className="p-3 border-t border-vintage-ink/10 bg-white flex items-center gap-3">
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-vintage-ink/10">
          <img src={user?.avatar_url || '/avatars/doodle_dog.png'} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <input 
          type="text" 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
          placeholder="Add a comment..." 
          className="flex-1 bg-transparent border-none text-sm font-mono focus:outline-none placeholder:text-vintage-ink/40"
        />
        <button 
          onClick={onAddComment}
          disabled={!newComment.trim() || isChatLoading}
          className={`text-sm font-bold font-mono transition-colors ${newComment.trim() && !isChatLoading ? 'text-neonBlue' : 'text-neonBlue/40'}`}
        >
          Post
        </button>
      </div>
    </div>
  );
}
