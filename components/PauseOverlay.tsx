'use client';

import { motion } from 'framer-motion';
import { Play, RotateCcw, X } from 'lucide-react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseOverlay({ onResume, onRestart, onExit }: PauseOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">GAME PAUSED</h2>
        <p className="text-zinc-400 mb-8 text-sm uppercase tracking-widest">Ready to continue?</p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            <Play size={18} fill="currentColor" />
            RESUME
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw size={18} />
            RESTART
          </button>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <X size={18} />
            EXIT GAME
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
