'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { ModalHeader } from './ModalHeader';

interface WhatsAppSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppSetupModal({ isOpen, onClose }: WhatsAppSetupModalProps) {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const sandboxNumber = '+14155238886';
  const joinCode = 'join effect-height';

  const copy = (text: string, type: 'message' | 'number') => {
    navigator.clipboard.writeText(text);
    if (type === 'message') {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } else {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-vintage-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md relative">
              {/* Striped accent */}
              <div className="absolute -inset-3 striped-bg rounded-2xl opacity-60 z-0" />

              <div className="vintage-panel bg-vintage-paper rounded-xl shadow-2xl border border-vintage-ink/10 p-8 relative z-10">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-vintage-ink/40 hover:text-vintage-crimson transition-colors"
                >
                  <X size={18} />
                </button>

                {/* Header */}
                <ModalHeader 
                  icon={<MessageCircle size={32} />}
                  title="Activate WhatsApp"
                  description="To receive WhatsApp notifications from CampusFlow, you need to join our sandbox first. It takes 10 seconds."
                  iconBgClass="bg-green-50"
                  iconColorClass="text-green-500"
                />

                {/* Steps */}
                <div className="space-y-3 mb-6">
                  {/* Step 1 */}
                  <div className="bg-white/60 rounded-lg p-4 border border-vintage-ink/5">
                    <p className="font-mono text-xs text-vintage-ink/50 mb-2 uppercase tracking-widest">Step 1 — Save this number</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display font-black text-2xl text-vintage-crimson tracking-tight">
                        {sandboxNumber}
                      </span>
                      <button
                        onClick={() => copy(sandboxNumber, 'number')}
                        className="flex items-center gap-1.5 vintage-btn-outline py-1.5 px-3 text-xs"
                      >
                        {copiedNumber ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copiedNumber ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white/60 rounded-lg p-4 border border-vintage-ink/5">
                    <p className="font-mono text-xs text-vintage-ink/50 mb-2 uppercase tracking-widest">Step 2 — Send this exact message</p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="font-mono font-bold text-lg text-vintage-ink bg-vintage-crimson/5 px-3 py-1.5 rounded-md">
                        {joinCode}
                      </code>
                      <button
                        onClick={() => copy(joinCode, 'message')}
                        className="flex items-center gap-1.5 vintage-btn-outline py-1.5 px-3 text-xs flex-shrink-0"
                      >
                        {copiedMessage ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copiedMessage ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp deep link */}
                <a
                  href={`https://wa.me/14155238886?text=${encodeURIComponent(joinCode)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vintage-btn w-full flex items-center justify-center gap-2 mb-3"
                  onClick={onClose}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Open in WhatsApp
                </a>

                <button
                  onClick={onClose}
                  className="w-full font-mono text-xs text-vintage-ink/40 hover:text-vintage-ink transition-colors py-2"
                >
                  I'll do this later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
