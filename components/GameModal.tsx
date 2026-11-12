'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  score: number;
  onRestart: () => void;
  controls?: { key: string; action: string }[];
}

export default function GameModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  score, 
  onRestart,
  controls = []
}: GameModalProps) {
  
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 max-w-5xl">
              <div>
                <h2 className="text-4xl font-display font-bold text-white tracking-widest text-glow">
                  {title}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                  {controls.map((c, i) => (
                    <span key={i} className="bg-white/10 px-2 py-1 rounded border border-white/5">
                      <span className="text-accent-primary font-bold">{c.key}</span> {c.action}
                    </span>
                  ))}
                  <span className="bg-white/10 px-2 py-1 rounded border border-white/5">
                    <span className="text-accent-secondary font-bold">ESC</span> Exit
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-text-secondary uppercase tracking-widest">Score</p>
                  <p className="text-4xl font-mono font-bold text-accent-primary tabular-nums">
                    {score.toString().padStart(6, '0')}
                  </p>
                </div>
                
                <button 
                  onClick={onRestart}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                  title="Restart Game"
                >
                  <RotateCcw size={24} />
                </button>
                
                <button 
                  onClick={onClose}
                  className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 transition-colors border border-red-500/20"
                  title="Exit Game"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Game Canvas Container */}
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-accent-primary/10">
              {children}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
