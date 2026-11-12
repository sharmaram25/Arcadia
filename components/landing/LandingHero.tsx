'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Zap, Cpu, Radio } from 'lucide-react';

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  duration: Math.random() * 8 + 4,
  delay: Math.random() * 5,
  color: i % 3 === 0 ? '#6EE7FF' : i % 3 === 1 ? '#A78BFA' : '#ffffff',
  opacity: Math.random() * 0.4 + 0.1,
}));

const FEATURE_TAGS = [
  { label: 'Custom ECS Engine', icon: Cpu },
  { label: 'Procedural Audio', icon: Radio },
  { label: 'Real-time Physics', icon: Zap },
  { label: 'Zero Dependencies', icon: Gamepad2 },
];

const HERO_STATS = [
  { value: '8', label: 'Games' },
  { value: '60', label: 'FPS Target' },
  { value: 'ECS', label: 'Architecture' },
  { value: '0', label: 'External Libs' },
];

export default function LandingHero() {
  const [glitch, setGlitch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={ref} className="relative h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Starfield particles ── */}
      {mounted && PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{ opacity: [p.opacity, p.opacity * 0.2, p.opacity], scale: [1, 1.5, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Grid overlay ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f18_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f18_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_50%,transparent_100%)] pointer-events-none" />

      {/* ── Scanning beam ── */}
      {mounted && (
        <motion.div
          animate={{ y: ['-5vh', '110vh'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/25 to-transparent pointer-events-none z-0"
        />
      )}

      {/* ── Ambient glows ── */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-accent-primary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Main content ── */}
      <motion.div
        style={{ y: titleY, opacity }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        {/* System online badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[11px] font-mono tracking-[0.2em] uppercase mb-8"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-primary" />
          </span>
          SYSTEM ONLINE — v2.0.4 NEON HORIZON
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
          className="text-[clamp(5rem,18vw,14rem)] font-display font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 relative select-none"
        >
          <span className={glitch ? 'glitch-text' : ''} data-text="ARCADIA">
            ARCADIA
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-base md:text-lg text-text-secondary font-mono tracking-[0.3em] uppercase"
        >
          The Digital Playground
        </motion.p>

        {/* Feature tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-8"
        >
          {FEATURE_TAGS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-white/40 border border-white/8 rounded-full hover:border-accent-primary/30 hover:text-accent-primary/70 transition-all duration-300"
            >
              <Icon size={11} />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-10"
        >
          <Link href="/arcade">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(110, 231, 255, 0)',
                  '0 0 0 18px rgba(110, 231, 255, 0.08)',
                  '0 0 0 0 rgba(110, 231, 255, 0)',
                ],
              }}
              transition={{ boxShadow: { duration: 2.5, repeat: Infinity } }}
              className="group relative px-10 py-4 bg-white text-black font-bold font-mono text-sm tracking-widest rounded-full flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <Gamepad2 className="w-5 h-5 relative z-10" />
              <span className="relative z-10">INSERT COIN</span>
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Bottom stats strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-20 left-0 right-0 flex justify-center z-10"
      >
        <div className="flex items-center gap-px border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm bg-white/[0.02]">
          {HERO_STATS.map(({ value, label }, i) => (
            <div key={label} className={`flex flex-col items-center px-6 py-3 ${i < HERO_STATS.length - 1 ? 'border-r border-white/8' : ''}`}>
              <span className="text-xl font-display font-bold text-white">{value}</span>
              <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center pt-1.5">
          <div className="w-0.5 h-2 bg-white/30 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
