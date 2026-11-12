'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Cpu, Radio, Zap, Timer, Shuffle, BarChart3 } from 'lucide-react';

const ENGINE_FEATURES = [
  {
    id: '01',
    icon: Cpu,
    title: 'Entity Component System',
    body: 'Data-oriented design that decouples state from behavior. Entities are just IDs. Components are pure data. Systems hold all the logic. Zero tight coupling.',
    color: '#6EE7FF',
    tag: 'ARCHITECTURE',
  },
  {
    id: '02',
    icon: Timer,
    title: 'Deterministic Game Loop',
    body: 'Fixed-timestep rAF loop with elapsed-time accumulation guarantees identical physics output at 60fps, 120fps, or any refresh rate. Consistent on every device.',
    color: '#A78BFA',
    tag: 'PERFORMANCE',
  },
  {
    id: '03',
    icon: Radio,
    title: 'Synthesized Audio',
    body: 'Every sound effect is computed in real time using the Web Audio API. Oscillators, filters, envelopes, reverb. Zero external audio files. Zero loading.',
    color: '#FACC15',
    tag: 'AUDIO',
  },
  {
    id: '04',
    icon: Zap,
    title: 'Event Bus Architecture',
    body: 'Decoupled pub/sub layer connecting all systems. Collisions, score deltas, state transitions — broadcast once, consumed by any subscriber. No god objects.',
    color: '#6EE7FF',
    tag: 'SYSTEMS',
  },
  {
    id: '05',
    icon: BarChart3,
    title: 'Dynamic Difficulty AI',
    body: 'A DifficultyManager samples player performance in real time and adjusts spawn rates, velocities, and hazard density. The game always pushes you.',
    color: '#A78BFA',
    tag: 'AI',
  },
  {
    id: '06',
    icon: Shuffle,
    title: 'Seeded Randomness',
    body: 'Deterministic PRNG means identical seed = identical run. Reproducible chaos. Replayable levels. Foundation for future speedrun verification.',
    color: '#22C55E',
    tag: 'LOGIC',
  },
];

export default function EngineSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f0f_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-px bg-accent-primary" />
              <div className="w-2 h-px bg-accent-primary/50" />
            </div>
            <span className="text-xs font-mono text-accent-primary tracking-[0.3em] uppercase">Under the hood</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
            Built<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">Different.</span>
          </h2>
          <p className="text-white/45 max-w-lg text-base leading-relaxed">
            No third-party game engines. No black boxes. Arcadia runs on a custom-built ECS engine assembled in TypeScript — transparent, lean, and fast.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENGINE_FEATURES.map(({ id, icon: Icon, title, body, color, tag }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group relative rounded-2xl bg-white/[0.03] border border-white/6 p-6 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden"
            >
              {/* Hover corner glow */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: color }}
              />

              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/20">{id}</span>
                  <span
                    className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                    style={{ color, background: `${color}12` }}
                  >
                    {tag}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-display font-bold text-white mb-2 group-hover:text-white transition-colors">
                {title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors">
                {body}
              </p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
