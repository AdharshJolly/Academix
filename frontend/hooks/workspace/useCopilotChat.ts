import { useState, useEffect } from 'react';
import { IntelligenceService } from '../../services/intelligence.service';

export interface ChatMessage {
  role: string;
  content: string;
}

export function useCopilotChat(token: string | null) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!token) return;
    IntelligenceService.getChatHistory(token).then(res => {
      if (res.success && res.data) {
        setChatHistory(res.data);
      }
    }).catch(console.error);
  }, [token]);

  const addComment = async () => {
    if (!newComment.trim() || !token) return false;
    
    const comment = newComment;
    setNewComment('');
    
    setChatHistory(prev => [...prev, { role: 'user', content: comment }]);
    setIsChatLoading(true);
    
    try {
      const res = await IntelligenceService.sendChatMessage(comment, token);
      if (res.success && res.data) {
        setChatHistory(prev => [...prev, res.data as ChatMessage]);
        return true;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
    return false;
  };

  return {
    chatHistory,
    isChatLoading,
    newComment,
    setNewComment,
    isLiked,
    setIsLiked,
    addComment
  };
}
