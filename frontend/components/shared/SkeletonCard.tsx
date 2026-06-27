import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <motion.div 
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse' }}
      className="vintage-panel p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-8 h-8 bg-black/5" />
      <div className="flex justify-between items-start mb-2">
        <div className="w-32 h-5 bg-vintage-ink/10 rounded-sm" />
        <div className="w-16 h-4 bg-vintage-ink/5 rounded-sm" />
      </div>
      <div className="w-full h-4 bg-vintage-ink/5 rounded-sm mb-2" />
      <div className="w-3/4 h-4 bg-vintage-ink/5 rounded-sm mb-4" />
      <div className="w-24 h-4 bg-vintage-ink/10 rounded-sm" />
    </motion.div>
  );
}
