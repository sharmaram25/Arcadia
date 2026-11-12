import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArcadeBootScreenProps {
  onComplete: () => void;
}

export default function ArcadeBootScreen({ onComplete }: ArcadeBootScreenProps) {
  const [text, setText] = useState('');
  const [showPressStart, setShowPressStart] = useState(false);
  const fullText = 'INITIALIZING ARCADE SYSTEM...';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i + 1));
      i++;
      if (i === fullText.length) {
        clearInterval(interval);
        setTimeout(() => setShowPressStart(true), 500);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center font-mono text-green-500 overflow-hidden">
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-20"
      >
        <pre className="text-xs md:text-sm leading-none mb-8 text-green-400 opacity-80 select-none">
{`
████████████████████
      ARCADIA
████████████████████
`}
        </pre>

        <div className="h-8 mb-8">
          <span className="text-lg md:text-xl tracking-widest">{text}</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-3 h-5 bg-green-500 ml-1 align-middle"
          />
        </div>

        <AnimatePresence>
          {showPressStart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xl md:text-2xl font-bold tracking-widest cursor-pointer hover:text-green-300"
                onClick={onComplete}
              >
                PRESS ENTER TO START
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
