import { useState, useRef, useEffect } from 'react';
import { IntelligenceService } from '../../services/intelligence.service';
import { IntelligenceResponse } from '../../types/index';
import { useWebSocket } from '../useWebSocket';

export function useNoticeProcessing(token: string | null) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noticeText, setNoticeText] = useState('');
  const [isProcessingNotice, setIsProcessingNotice] = useState(false);
  const [noticeResult, setNoticeResult] = useState<IntelligenceResponse | null>(null);
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);

  const { subscribe } = useWebSocket(token);

  useEffect(() => {
    if (!pendingReportId) return;

    const unsubscribe = subscribe((msg: any) => {
      if (msg.report_id === pendingReportId) {
        if (msg.type === 'INTELLIGENCE_REPORT_COMPLETE') {
          setNoticeResult(msg.report);
          setNoticeText('Processed successfully.');
          setIsProcessingNotice(false);
          setPendingReportId(null);
        } else if (msg.type === 'INTELLIGENCE_REPORT_FAILED') {
          setNoticeError(msg.error || 'AI processing failed.');
          setIsProcessingNotice(false);
          setPendingReportId(null);
        }
      }
    });

    return unsubscribe;
  }, [subscribe, pendingReportId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    
    setIsProcessingNotice(true);
    setNoticeError(null);
    setNoticeResult(null);
    setNoticeText(`File uploaded: ${file.name}\nProcessing via Vision/PDF Extractor...`);
    
    try {
      const res = await IntelligenceService.uploadNotice(file, token);
      if (res.success && res.data?.report_id) {
        setPendingReportId(res.data.report_id);
      } else {
        setIsProcessingNotice(false);
        setNoticeError(res.message || 'AI processing failed. Please try again.');
        setNoticeText('');
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessingNotice(false);
      setNoticeError(err?.message || 'Failed to process file. Check connection.');
      setNoticeText('');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessNotice = async () => {
    if (!noticeText.trim() || !token) return;
    setIsProcessingNotice(true);
    setNoticeError(null);
    setNoticeResult(null);
    try {
      const res = await IntelligenceService.process({
        input_type: 'notice',
        data: { text: noticeText }
      }, token);
      if (res.success && res.data?.report_id) {
        setPendingReportId(res.data.report_id);
      } else {
        setIsProcessingNotice(false);
        setNoticeError(res.message || 'AI processing failed. Please try again.');
      }
    } catch (e: any) {
      console.error(e);
      setIsProcessingNotice(false);
      setNoticeError(e?.message || 'Failed to reach the AI engine. Check your connection and try again.');
    }
  };

  const clearResult = () => setNoticeResult(null);
  const clearError = () => setNoticeError(null);

  return {
    fileInputRef,
    noticeText,
    setNoticeText,
    isProcessingNotice,
    noticeResult,
    noticeError,
    handleFileUpload,
    handleProcessNotice,
    clearResult,
    clearError
  };
}
