'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, Clock, Crosshair, RefreshCw, Home } from 'lucide-react';
import { StatsTracker } from '@/engine/StatsTracker';

interface StatsScreenProps {
  stats: StatsTracker;
  onRestart: () => void;
  onExit: () => void;
}

export default function StatsScreen({ stats, onRestart, onExit }: StatsScreenProps) {
  const accuracy = stats.getAccuracy();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        
        <h2 className="text-4xl font-display font-bold text-white mb-2 text-center text-glow tracking-tight">
          RUN COMPLETE
        </h2>
        <p className="text-zinc-500 text-center mb-8 font-mono text-xs tracking-widest uppercase">
          Mission Debriefing
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatItem icon={Trophy} label="Score" value={stats.score} color="text-yellow-400" />
          <StatItem icon={Target} label="Enemies" value={stats.enemiesDestroyed} color="text-red-400" />
          <StatItem icon={Clock} label="Time" value={`${Math.floor(stats.survivalTime)}s`} color="text-blue-400" />
          <StatItem icon={Crosshair} label="Accuracy" value={`${accuracy}%`} color="text-green-400" />
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
          >
            <RefreshCw size={18} />
            PLAY AGAIN
          </button>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors border border-white/5"
          >
            <Home size={18} />
            RETURN TO ARCADE
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 flex flex-col items-center justify-center border border-white/5">
      <Icon className={`mb-2 ${color}`} size={24} />
      <span className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</span>
      <span className="text-2xl font-bold text-white font-mono">{value}</span>
    </div>
  );
}
