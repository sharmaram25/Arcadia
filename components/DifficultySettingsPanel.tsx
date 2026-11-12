'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Check } from 'lucide-react';

export type DifficultyPreset = 'easy' | 'normal' | 'hard' | 'adaptive';

const STORAGE_KEY = 'arcade_difficulty_v1';

export const DIFFICULTY_PRESETS: {
  id: DifficultyPreset;
  label: string;
  description: string;
  color: string;
  tag: string;
  baseDifficulty: number;
  difficultyMultiplier: number;
  maxDifficulty: number;
}[] = [
  {
    id: 'easy',
    label: 'Cadet',
    description: 'Slower spawns, reduced speed scaling. Ideal for learning each game\'s mechanics.',
    color: '#22C55E',
    tag: 'RELAXED',
    baseDifficulty: 0.7,
    difficultyMultiplier: 0.002,
    maxDifficulty: 6,
  },
  {
    id: 'normal',
    label: 'Soldier',
    description: 'Balanced default tuning. The experience the games were designed around.',
    color: '#6EE7FF',
    tag: 'BALANCED',
    baseDifficulty: 1,
    difficultyMultiplier: 0.005,
    maxDifficulty: 10,
  },
  {
    id: 'hard',
    label: 'Commander',
    description: 'High base difficulty, rapid scaling. No mercy. High score reward territory.',
    color: '#FACC15',
    tag: 'INTENSE',
    baseDifficulty: 1.8,
    difficultyMultiplier: 0.01,
    maxDifficulty: 10,
  },
  {
    id: 'adaptive',
    label: 'Adaptive',
    description: 'Engine auto-tunes parameters in real time based on your session performance.',
    color: '#A78BFA',
    tag: 'DYNAMIC',
    baseDifficulty: 1,
    difficultyMultiplier: 0.005,
    maxDifficulty: 10,
  },
];

export function loadDifficultyPreset(): DifficultyPreset {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem(STORAGE_KEY) as DifficultyPreset) ?? 'normal';
}

export function saveDifficultyPreset(preset: DifficultyPreset) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, preset);
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DifficultySettingsPanel({ open, onClose }: Props) {
  const [selected, setSelected] = useState<DifficultyPreset>('normal');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(loadDifficultyPreset());
      setSaved(false);
    }
  }, [open]);

  const handleSelect = (preset: DifficultyPreset) => {
    setSelected(preset);
    setSaved(false);
  };

  const handleApply = () => {
    saveDifficultyPreset(selected);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const active = DIFFICULTY_PRESETS.find(p => p.id === selected)!;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="diff-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="diff-panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-[#0B0F19] border border-white/10 shadow-[0_0_60px_rgba(110,231,255,0.08)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20 flex items-center justify-center">
                  <Sliders className="w-4 h-4 text-accent-secondary" />
                </div>
                <div>
                  <h2 className="text-sm font-display font-bold text-white tracking-wide">Difficulty Settings</h2>
                  <p className="text-[10px] font-mono text-white/35">Applied on next game session</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Preset grid */}
            <div className="p-5 grid grid-cols-2 gap-3">
              {DIFFICULTY_PRESETS.map(p => {
                const isSelected = selected === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.id)}
                    className="relative group text-left p-4 rounded-xl border transition-all duration-200"
                    style={{
                      background: isSelected ? `${p.color}0f` : 'rgba(255,255,255,0.02)',
                      borderColor: isSelected ? `${p.color}50` : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    {/* Selected check */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: p.color }}
                      >
                        <Check size={10} className="text-black" strokeWidth={3} />
                      </motion.div>
                    )}

                    {/* Tag */}
                    <span
                      className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded mb-2 inline-block"
                      style={{ color: p.color, background: `${p.color}18` }}
                    >
                      {p.tag}
                    </span>

                    <p className="text-sm font-display font-bold text-white mb-1">{p.label}</p>
                    <p className="text-[10px] font-mono text-white/35 leading-snug">{p.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Engine params readout */}
            <div className="mx-5 mb-4 rounded-xl bg-white/[0.03] border border-white/6 p-3">
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2">Engine Parameters</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm font-mono font-bold" style={{ color: active.color }}>{active.baseDifficulty}x</p>
                  <p className="text-[9px] font-mono text-white/30">Base</p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold" style={{ color: active.color }}>×{active.difficultyMultiplier}</p>
                  <p className="text-[9px] font-mono text-white/30">Multiplier</p>
                </div>
                <div>
                  <p className="text-sm font-mono font-bold" style={{ color: active.color }}>{active.maxDifficulty}</p>
                  <p className="text-[9px] font-mono text-white/30">Cap</p>
                </div>
              </div>
            </div>

            {/* Apply button */}
            <div className="px-5 pb-5">
              <motion.button
                onClick={handleApply}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl font-mono font-bold text-sm tracking-widest transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: saved ? '#22C55E' : active.color,
                  color: '#000',
                }}
              >
                {saved ? (
                  <><Check size={15} /> APPLIED</>
                ) : (
                  'APPLY & CLOSE'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
