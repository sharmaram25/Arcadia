'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Lock, Star } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/arcade/types';

const DIFFICULTY_COLORS: Record<string, string> = {
  snake:     '#6EE7FF',
  asteroids: '#A78BFA',
  maze:      '#FACC15',
  defender:  '#FF4444',
  tower:     '#22C55E',
  river:     '#EC4899',
  swarm:     '#00FF00',
  horizon:   '#00FFFF',
};

const GAME_LABELS: Record<string, string> = {
  snake:     'Neon Snake',
  asteroids: 'Asteroid Blaster',
  maze:      'Maze Runner',
  defender:  'Star Defender',
  tower:     'Tower Escape',
  river:     'River Dash',
  swarm:     'Neon Swarm',
  horizon:   'Horizon Defender',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AchievementsPanel({ open, onClose }: Props) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('arcade_profile_v1');
      if (raw) {
        const profile = JSON.parse(raw);
        setUnlockedIds(profile.achievements ?? []);
      }
    } catch {
      setUnlockedIds([]);
    }
  }, [open]);

  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
  }));

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;

  // Group: global first, then per-game
  const global = achievements.filter(a => !a.gameId);
  const perGame = achievements.filter(a => !!a.gameId);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ach-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="ach-panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl bg-[#0B0F19] border border-white/10 shadow-[0_0_60px_rgba(110,231,255,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold text-white tracking-wide">Achievements</h2>
                  <p className="text-[10px] font-mono text-white/35">{unlockedCount} / {total} unlocked</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>

            {/* XP bar */}
            <div className="px-6 py-3 border-b border-white/6">
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Completion</span>
                <span className="text-[10px] font-mono text-accent-primary">{Math.round((unlockedCount / total) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(unlockedCount / total) * 100}%` }}
                  transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">

              {/* Global achievements */}
              <div>
                <p className="text-[10px] font-mono text-white/25 tracking-[0.2em] uppercase mb-3">Global</p>
                <div className="space-y-2">
                  {global.map(a => (
                    <AchievementRow key={a.id} achievement={a} color="#FACC15" />
                  ))}
                </div>
              </div>

              {/* Per-game achievements */}
              <div>
                <p className="text-[10px] font-mono text-white/25 tracking-[0.2em] uppercase mb-3">Per Game</p>
                <div className="space-y-2">
                  {perGame.map(a => (
                    <AchievementRow
                      key={a.id}
                      achievement={a}
                      color={a.gameId ? (DIFFICULTY_COLORS[a.gameId] ?? '#6EE7FF') : '#6EE7FF'}
                      gameLabel={a.gameId ? GAME_LABELS[a.gameId] : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AchievementRow({
  achievement,
  color,
  gameLabel,
}: {
  achievement: { id: string; title: string; description: string; unlocked: boolean };
  color: string;
  gameLabel?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
        achievement.unlocked
          ? 'bg-white/[0.04] border-white/10 hover:border-white/20'
          : 'bg-white/[0.02] border-white/5 opacity-50'
      }`}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: achievement.unlocked ? `${color}18` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${achievement.unlocked ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        {achievement.unlocked
          ? <Star className="w-4 h-4" style={{ color }} />
          : <Lock className="w-4 h-4 text-white/20" />
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-mono font-bold text-white truncate">{achievement.title}</p>
          {achievement.unlocked && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-400/10 text-green-400 tracking-wider flex-shrink-0">
              UNLOCKED
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono text-white/35 leading-snug">{achievement.description}</p>
        {gameLabel && (
          <p className="text-[10px] font-mono mt-0.5" style={{ color, opacity: 0.6 }}>{gameLabel}</p>
        )}
      </div>
    </div>
  );
}
