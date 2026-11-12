'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ScoreManager } from '@/lib/arcade/ScoreManager';

export default function RetroTicker() {
  const [scores, setScores] = useState<{ playerName: string; score: number; gameName: string }[]>([]);

  useEffect(() => {
    // In a real app, fetch from API or ScoreManager
    // For now, mock data or use ScoreManager if available client-side
    const manager = new ScoreManager();
    const topScores = manager.getTopScores(10);
    
    if (topScores.length > 0) {
      setScores(topScores);
    } else {
      setScores([
        { playerName: 'PLAYER1', score: 5000, gameName: 'ASTEROIDS' },
        { playerName: 'NEON_KING', score: 4200, gameName: 'SNAKE' },
        { playerName: 'MAZE_RUNNER', score: 3800, gameName: 'MAZE' },
        { playerName: 'STAR_LORD', score: 3500, gameName: 'DEFENDER' },
        { playerName: 'CYBER_PUNK', score: 3200, gameName: 'TOWER' },
      ]);
    }
  }, []);

  return (
    <div className="w-full bg-accent-primary/10 border-y border-accent-primary/20 overflow-hidden py-3 relative z-20 backdrop-blur-sm">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear",
          }}
          className="flex gap-12 items-center"
        >
          {[...scores, ...scores, ...scores].map((score, i) => (
            <div key={i} className="flex items-center gap-4 font-mono text-sm tracking-wider">
              <span className="text-accent-primary font-bold">{score.playerName}</span>
              <span className="text-white/50 text-xs">played</span>
              <span className="text-white font-bold">{score.gameName}</span>
              <span className="text-accent-secondary font-bold tabular-nums">{score.score.toLocaleString()}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
