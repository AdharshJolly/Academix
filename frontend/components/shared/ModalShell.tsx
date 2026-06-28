import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    children: React.ReactNode;
    onClose?: () => void;
}

export const ModalShell = ({ children, onClose }: Props) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-vintage-ink/10"
        >
            {children}
        </motion.div>
    </div>
);
