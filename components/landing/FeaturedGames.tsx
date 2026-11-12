'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GAME_REGISTRY } from '@/lib/arcade/gameRegistry';

// Show the first 4 games as featured
const FEATURED = GAME_REGISTRY.slice(0, 4);

export default function FeaturedGames() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent-primary/6 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />

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
                <div className="w-6 h-px bg-accent-primary" />
                <div className="w-2 h-px bg-accent-primary/50" />
              </div>
              <span className="text-xs font-mono text-accent-primary tracking-[0.3em] uppercase">The arcade</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight leading-none">
              Enter<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">The Games.</span>
            </h2>
          </div>
          <Link
            href="/arcade"
            className="group flex items-center gap-2 text-sm font-mono text-accent-primary hover:text-white transition-colors tracking-widest uppercase md:self-end"
          >
            View All Games
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Game cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED.map(({ id, title, description, genre, color, icon: Icon }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative rounded-2xl bg-white/[0.04] border border-white/6 overflow-hidden cursor-pointer hover:border-white/15 transition-all duration-500"
            >
              {/* Top color bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />

              {/* Hover radial glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: `radial-gradient(ellipse at 50% -10%, ${color}18 0%, transparent 65%)` }}
              />

              {/* Grid overlay on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                style={{
                  backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative p-6 flex flex-col gap-4 h-full">
                {/* Genre tag only (no difficulty) */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border"
                    style={{ color, borderColor: `${color}40`, background: `${color}0d` }}
                  >
                    {genre}
                  </span>
                </div>

                {/* Icon area */}
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                      style={{ background: color }}
                    />
                    <div
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300"
                      style={{ background: `${color}12`, borderColor: `${color}30` }}
                    >
                      <Icon className="w-8 h-8" style={{ color }} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <div className="h-px bg-white/5 group-hover:bg-white/10 mb-4 transition-colors duration-300" />
                  <h3 className="text-base font-display font-bold text-white mb-1.5">{title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed group-hover:text-white/55 transition-colors duration-300">{description}</p>

                  {/* Underline expander */}
                  <div
                    className="mt-3 h-0.5 w-6 group-hover:w-full rounded-full transition-all duration-500"
                    style={{ background: color }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
