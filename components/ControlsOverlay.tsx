'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Info } from 'lucide-react';

export default function ControlsOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        setIsVisible(prev => !prev);
      }
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-xl">
                <Keyboard className="text-indigo-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white">Arcade Controls</h2>
            </div>

            <div className="space-y-4">
              <ControlRow keys={['↑', '↓', '←', '→']} action="Movement" />
              <ControlRow keys={['Space']} action="Action / Shoot" />
              <ControlRow keys={['P']} action="Pause Game" />
              <ControlRow keys={['ESC']} action="Exit Game" />
              <ControlRow keys={['F2']} action="Developer Mode" />
              <ControlRow keys={['?']} action="Show Controls" />
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
              <Info className="text-zinc-500 shrink-0 mt-1" size={16} />
              <p className="text-xs text-zinc-500 leading-relaxed">
                Controls may vary slightly between games. Check the specific game instructions for details.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ControlRow({ keys, action }: { keys: string[], action: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400 font-medium">{action}</span>
      <div className="flex gap-2">
        {keys.map(key => (
          <kbd
            key={key}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300 min-w-[24px] text-center shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
