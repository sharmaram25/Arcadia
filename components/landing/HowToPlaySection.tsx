'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Monitor, Keyboard, Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    num: '01',
    icon: Monitor,
    title: 'Select Your Game',
    body: 'Browse 8 original arcade titles — each one a different system, a different challenge. Pick your arena.',
    color: '#6EE7FF',
  },
  {
    num: '02',
    icon: Keyboard,
    title: 'Master the Controls',
    body: 'Every game is built for keyboard-first play. Arrow keys and WASD. Simple inputs, deep mechanics.',
    color: '#A78BFA',
  },
  {
    num: '03',
    icon: Trophy,
    title: 'Beat the High Score',
    body: 'Dynamic difficulty means the game adapts to you. The better you play, the harder it gets. There is no ceiling.',
    color: '#FACC15',
  },
];

export default function HowToPlaySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-px bg-accent-secondary" />
                <div className="w-2 h-px bg-accent-secondary/50" />
              </div>
              <span className="text-xs font-mono text-accent-secondary tracking-[0.3em] uppercase">Getting started</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight">
              How to<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-secondary to-accent-primary">Play.</span>
            </h2>
          </div>
          <Link
            href="/arcade"
            className="group flex items-center gap-2 text-sm font-mono text-accent-primary hover:text-white transition-colors tracking-widest uppercase md:self-end"
          >
            Enter Arcade
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.5rem] left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-accent-primary/30 via-accent-secondary/30 to-accent-primary/30 pointer-events-none" />

          {STEPS.map(({ num, icon: Icon, title, body, color }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="group relative rounded-2xl bg-white/[0.03] border border-white/6 p-7 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(ellipse at 30% 0%, ${color}10 0%, transparent 60%)` }}
              />

              {/* Step number + icon */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <span className="text-3xl font-display font-bold text-white/10">{num}</span>
                </div>
              </div>

              <h3
                className="text-xl font-display font-bold text-white mb-3 group-hover:translate-y-[-1px] transition-transform duration-200"
                style={{ textShadow: `0 0 30px ${color}20` }}
              >
                {title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{body}</p>

              {/* Color accent bottom */}
              <div
                className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />
            </motion.div>
          ))}
        </div>

        {/* Tip bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/6"
        >
          <div className="flex-shrink-0 w-1 h-8 rounded-full bg-gradient-to-b from-accent-primary to-accent-secondary" />
          <p className="text-xs font-mono text-white/35">
            <span className="text-accent-primary">PRO TIP —</span>{' '}
            Toggle <span className="text-white/60">F2</span> in-game for real-time performance telemetry: FPS counter, entity count, memory pressure.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
