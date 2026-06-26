'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Copy, Check } from 'lucide-react';
import { ModalHeader } from './ModalHeader';

interface TelegramSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramSetupModal({ isOpen, onClose }: TelegramSetupModalProps) {
  const [copiedBot, setCopiedBot] = useState(false);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '@CampusFlowBot';
  const botLink = process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || 'https://t.me/CampusFlowBot';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBot(true);
    setTimeout(() => setCopiedBot(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-vintage-ink/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md relative">
              <div className="absolute -inset-3 striped-bg rounded-2xl opacity-60 z-0" />

              <div className="vintage-panel bg-vintage-paper rounded-xl shadow-2xl border border-vintage-ink/10 p-8 relative z-10">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-vintage-ink/40 hover:text-vintage-crimson transition-colors"
                >
                  <X size={18} />
                </button>

                <ModalHeader 
                  icon={<Send size={32} className="ml-[-2px] mt-[2px]" />}
                  title="Connect Telegram"
                  description="To receive updates and forward messages to the AI, start a chat with our bot."
                  iconBgClass="bg-blue-50"
                  iconColorClass="text-blue-500"
                />

                <div className="space-y-3 mb-6">
                  <div className="bg-white/60 rounded-lg p-4 border border-vintage-ink/5">
                    <p className="font-mono text-xs text-vintage-ink/50 mb-2 uppercase tracking-widest">Step 1 — Find the Bot</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display font-black text-2xl text-vintage-crimson tracking-tight">
                        {botUsername}
                      </span>
                      <button
                        onClick={() => copy(botUsername)}
                        className="flex items-center gap-1.5 vintage-btn-outline py-1.5 px-3 text-xs flex-shrink-0"
                      >
                        {copiedBot ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copiedBot ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4 border border-vintage-ink/5">
                    <p className="font-mono text-xs text-vintage-ink/50 mb-2 uppercase tracking-widest">Step 2 — Add your username</p>
                    <p className="font-sans text-sm text-vintage-ink/80">
                      Go to the <strong>Settings</strong> page and enter your Telegram username so we can link your account!
                    </p>
                  </div>
                </div>

                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vintage-btn w-full flex items-center justify-center gap-2 mb-3"
                  onClick={onClose}
                >
                  <Send size={18} />
                  Open in Telegram
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
