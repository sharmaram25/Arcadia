'use client';

import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { GAME_REGISTRY } from '@/lib/arcade/gameRegistry';
import type { LucideIcon } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  onPlay: () => void;
  color: string;
}

function getGameMeta(title: string) {
  return GAME_REGISTRY.find(g => g.title === title);
}

export default function GameCard({ title, description, onPlay, color }: GameCardProps) {
  const meta = getGameMeta(title);
  const Icon: LucideIcon | undefined = meta?.icon;
  const genre = meta?.genre ?? 'ARCADE';
  const controls = meta?.controls ?? 'KEYBOARD';

  return (
    <motion.div
      className="relative group w-full max-w-md h-[440px] rounded-2xl overflow-hidden bg-secondary-bg border border-white/5 cursor-pointer"
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onPlay}
    >
      {/* Animated Background Gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}22 0%, transparent 70%)` }}
      />

      {/* Top color line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500"
        style={{
          backgroundImage: `linear-gradient(${color}80 1px, transparent 1px), linear-gradient(90deg, ${color}80 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col p-7 z-10">

        {/* Top Section: Game visual area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          {/* Icon container with glow */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: color }}
            />
            <div
              className="relative w-20 h-20 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors duration-300 backdrop-blur-sm"
              style={{ background: `linear-gradient(135deg, ${color}15, transparent)` }}
            >
              {Icon && <Icon className="w-10 h-10 transition-all duration-300" style={{ color }} />}
            </div>
          </div>

          {/* Genre + controls pills (no difficulty) */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="px-2 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase border border-white/10 text-white/50">
              {genre}
            </span>
            <span className="px-2 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase border border-white/10 text-white/50">
              {controls}
            </span>
          </div>
        </div>

        {/* Bottom Section: Info + CTA */}
        <div className="space-y-4">
          {/* Divider */}
          <div className="h-px bg-white/5 group-hover:bg-white/10 transition-colors duration-300" />

          <div>
            <h3
              className="text-2xl font-display font-bold text-white mb-1.5 group-hover:translate-y-[-2px] transition-transform duration-300"
              style={{ textShadow: `0 0 20px ${color}30` }}
            >
              {title}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">{description}</p>
          </div>

          <motion.button
            className="w-full py-3.5 rounded-xl font-bold text-sm text-primary-bg flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ backgroundColor: color }}
            whileHover={{ boxShadow: `0 0 25px ${color}50` }}
          >
            <Play size={16} fill="currentColor" />
            PLAY NOW
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
