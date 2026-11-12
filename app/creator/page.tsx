'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Github, Linkedin, Instagram, Mail, ArrowUpRight,
  Cpu, Code2, Globe, Zap, Layers, Terminal,
  Shield, Swords, TrendingUp, Activity,
  Gamepad2, Trophy, ChevronRight
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const ABILITIES = [
  { icon: Terminal,  name: 'Full Stack',   desc: 'Owns the entire stack — front to back, DB to deploy.', level: 92, color: '#6EE7FF' },
  { icon: Cpu,       name: 'Game Engine',  desc: 'Custom ECS engine built from scratch in TypeScript.',   level: 88, color: '#A78BFA' },
  { icon: Code2,     name: 'TypeScript',   desc: 'Strongly typed. No implicit any. No surprises.',        level: 95, color: '#6EE7FF' },
  { icon: Globe,     name: 'Next.js',      desc: 'App Router, RSC, edge-ready deployments.',              level: 90, color: '#A78BFA' },
  { icon: Layers,    name: 'ECS / DSA',    desc: 'Data-oriented design, pooling, cache-friendly loops.',  level: 85, color: '#6EE7FF' },
  { icon: Zap,       name: 'Web Audio',    desc: 'Procedural SFX synthesized at runtime via Web Audio.',  level: 80, color: '#FACC15' },
];

const GAME_STATS = [
  { icon: Gamepad2,   label: 'Games Shipped',  value: '12',      sub: 'All from scratch'  },
  { icon: Activity,   label: 'Engine Arch',    value: 'ECS',     sub: 'Entity Component'  },
  { icon: Zap,        label: 'Render Target',  value: '60fps',   sub: 'rAF locked'        },
  { icon: Shield,     label: 'Dependencies',   value: '0',       sub: 'Game engine deps'  },
  { icon: TrendingUp, label: 'Stack Rank',     value: 'S',       sub: 'Self-assessed'     },
  { icon: Trophy,     label: 'Player Class',   value: 'ARCH',    sub: 'System Architect'  },
];

const MISSION_LOG = [
  { id: 'M-01', status: 'COMPLETE', title: 'Build a custom ECS engine',  note: 'Shipped in Arcadia v1.0' },
  { id: 'M-02', status: 'COMPLETE', title: 'Procedural audio, no files', note: 'Web Audio API synthesis'  },
  { id: 'M-03', status: 'ACTIVE',   title: 'Ship 12 original games',     note: '12/12 — wave 2 incoming'  },
  { id: 'M-04', status: 'ACTIVE',   title: 'Open source the engine',     note: 'In progress'              },
];

const COMMS = [
  { href: 'https://www.linkedin.com/in/ram-sharma-20rs02', icon: Linkedin,  label: 'LinkedIn',  sub: 'Professional channel',   color: '#0A66C2' },
  { href: 'https://github.com/sharmaram25',                icon: Github,    label: 'GitHub',    sub: 'Source control & repos', color: '#6EE7FF' },
  { href: 'https://instagram.com/ramsharma.25',            icon: Instagram, label: 'Instagram', sub: 'Behind the build',       color: '#A78BFA' },
  { href: 'mailto:sharmaram2504@gmail.com',                icon: Mail,      label: 'Email',     sub: 'Direct access',          color: '#FACC15' },
];

const XP_PERCENT = 73;

// ─── Animated terminal lines ─────────────────────────────────────────────────
const TERMINAL_LINES = [
  { prompt: '>', text: 'I build immersive web experiences that push past what browsers were meant to do.', color: 'text-white/70' },
  { prompt: '//', text: 'Arcadia is my arena — real-time graphics, physics, procedural audio.', color: 'text-accent-primary/60' },
  { prompt: '$', text: 'No plugins. No cheats. No game engine frameworks. Pure web.', color: 'text-accent-secondary/70' },
];

// ─── Ticker tape strings ──────────────────────────────────────────────────────
const TICKERS = ['FULL STACK DEV', 'GAME ENGINEER', 'ECS ARCHITECT', 'WEB NATIVE', '60 FPS EVERYTHING', 'TYPESCRIPT', 'NEXT.JS', 'NO LIMITS'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-3 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(110,231,255,0.8)]" />
      <p className="text-[10px] font-mono text-accent-primary/60 tracking-[0.22em] uppercase">{children}</p>
    </div>
  );
}

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] border border-white/8 p-5 hover:border-white/16 hover:bg-white/[0.05] transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

function TickerTape() {
  return (
    <div className="relative overflow-hidden py-2 border-y border-white/6 bg-white/[0.02]">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        {[...TICKERS, ...TICKERS].map((t, i) => (
          <span key={i} className="text-[10px] font-mono text-white/30 tracking-[0.25em] uppercase flex items-center gap-4">
            {t}
            <span className="text-accent-primary/40 text-[8px]">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TypingTerminal() {
  const [lines, setLines] = useState<number[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLines(prev => [...prev, i]), i * 800 + 600));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-2">
      {TERMINAL_LINES.map((line, i) =>
        lines.includes(i) ? (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-xs font-mono leading-relaxed ${line.color}`}
          >
            <span className="text-accent-primary/50 mr-2">{line.prompt}</span>
            {line.text}
          </motion.p>
        ) : null
      )}
      <p className="text-[10px] font-mono text-accent-primary/35 flex items-center gap-1.5 mt-1">
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }}>█</motion.span>
        awaiting input
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CreatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-accent-primary/30 overflow-x-hidden">

      {/* ── Background layers ─────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(110,231,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,255,0.025) 1px, transparent 1px)',
          backgroundSize: '55px 55px',
        }}
      />
      <div className="fixed top-[-15%] left-[25%] w-[600px] h-[600px] bg-accent-primary/4 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[15%] w-[500px] h-[500px] bg-accent-secondary/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] left-[-10%] w-[300px] h-[300px] bg-yellow-400/3 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 pt-8 pb-10 space-y-4">

        {/* ── HERO CARD ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(110,231,255,0.04) 0%, rgba(0,0,0,0.6) 60%, rgba(167,139,250,0.04) 100%)' }}
        >
          {/* Top accent bar */}
          <div className="h-px bg-gradient-to-r from-accent-primary via-accent-secondary/60 to-transparent" />

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
            <div className="absolute top-4 right-4 w-20 h-20 border-t border-r border-accent-primary/15 rounded-tr-xl" />
            <div className="absolute top-8 right-8 w-10 h-10 border-t border-r border-accent-primary/10 rounded-tr-xl" />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl overflow-hidden border border-accent-primary/20"
                  style={{ boxShadow: '0 0 30px rgba(110,231,255,0.15), 0 0 60px rgba(110,231,255,0.05)' }}
                >
                  <Image src="/creator.jpg" alt="Ram Sharma" width={96} height={96} className="w-full h-full object-cover" priority />
                </div>
                {/* Level badge */}
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-accent-primary text-[10px] font-mono font-black text-black tracking-wider">
                  LV.25
                </div>
                {/* Online pulse */}
                <div className="absolute -top-1 -left-1 flex items-center gap-1 bg-black/80 border border-white/10 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-green-400/70">online</span>
                </div>
              </div>

              {/* Name + title */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-accent-primary/60 tracking-[0.25em] uppercase mb-2">
                  &gt; player.profile
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-display font-black text-white leading-none mb-2 tracking-tight">
                  Ram{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                    Sharma
                  </span>
                </h1>
                <p className="text-sm font-mono text-white/40 tracking-widest">
                  SYSTEM ARCHITECT · GAME ENGINEER · WEB NATIVE
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['TypeScript', 'Next.js', 'ECS Engine', 'Web Audio', 'Canvas2D'].map(tag => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/35 bg-white/[0.03]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* XP + Class */}
              <div className="flex flex-col gap-4 flex-shrink-0 w-full md:w-48">
                {/* XP bar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">XP Progress</span>
                    <span className="text-[10px] font-mono text-accent-primary font-bold">{XP_PERCENT}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/6 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${XP_PERCENT}%` }}
                      transition={{ delay: 0.7, duration: 1.4, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                      style={{ boxShadow: '0 0 10px rgba(110,231,255,0.5)' }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-white/20 mt-1">
                    Next: <span className="text-accent-secondary">MASTER</span>
                  </p>
                </div>

                {/* Class badge */}
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{ borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.05)' }}
                >
                  <Swords className="w-5 h-5 text-accent-secondary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-mono text-accent-secondary tracking-widest">ARCHITECT</p>
                    <p className="text-[9px] font-mono text-white/25">Highest class</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticker tape */}
          <TickerTape />
        </motion.div>

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4 items-start">

          {/* LEFT COL */}
          <div className="col-span-12 lg:col-span-8 space-y-4">

            {/* Combat stats */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}>
              <Card>
                <SectionLabel>Combat Stats</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {GAME_STATS.map(({ icon: Icon, label, value, sub }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                      className="group flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.025] border border-white/6 hover:border-accent-primary/25 hover:bg-white/[0.05] transition-all duration-200 cursor-default"
                    >
                      <Icon className="w-4 h-4 text-accent-primary/60 group-hover:text-accent-primary transition-colors" />
                      <span className="text-2xl font-display font-black text-white leading-none">{value}</span>
                      <div>
                        <p className="text-[11px] font-mono text-white/55">{label}</p>
                        <p className="text-[9px] font-mono text-white/22">{sub}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Ability loadout */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <Card>
                <SectionLabel>Ability Loadout</SectionLabel>
                <div className="space-y-2">
                  {ABILITIES.map(({ icon: Icon, name, desc, level, color }, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.07, duration: 0.3 }}
                      className="group flex items-center gap-4 p-3 rounded-xl bg-white/[0.025] border border-white/5 hover:border-white/12 hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                        style={{ background: `${color}12`, border: `1px solid ${color}28` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-mono text-white/75 group-hover:text-white transition-colors">{name}</p>
                          <span className="text-[11px] font-mono font-bold tabular-nums" style={{ color }}>{level}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${level}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 6px ${color}60` }}
                          />
                        </div>
                        <p className="text-[9px] font-mono text-white/22 mt-1 truncate">{desc}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT COL */}
          <div className="col-span-12 lg:col-span-4 space-y-4">

            {/* Terminal / Bio */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
              <Card>
                {/* Terminal chrome */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/6">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-white/22 ml-2">~/arcadia/player.log</span>
                </div>
                <TypingTerminal />
              </Card>
            </motion.div>

            {/* Mission log */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <Card>
                <SectionLabel>Mission Log</SectionLabel>
                <div className="space-y-2">
                  {MISSION_LOG.map(({ id, status, title, note }) => (
                    <div key={id} className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/5 hover:border-white/10 transition-all duration-200">
                      <div className="pt-0.5 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-1 ${
                          status === 'COMPLETE'
                            ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                            : 'bg-accent-primary animate-pulse shadow-[0_0_6px_rgba(110,231,255,0.6)]'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-white/22">{id}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wide ${
                            status === 'COMPLETE'
                              ? 'text-green-400/80 bg-green-400/10'
                              : 'text-accent-primary/80 bg-accent-primary/10'
                          }`}>{status}</span>
                        </div>
                        <p className="text-xs font-mono text-white/65 group-hover:text-white/85 transition-colors leading-snug">{title}</p>
                        <p className="text-[10px] font-mono text-white/22 mt-0.5">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Guild Comms */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}>
              <Card>
                <SectionLabel>Guild Comms</SectionLabel>
                <div className="space-y-1.5">
                  {COMMS.map(({ href, icon: Icon, label, sub, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                        style={{ background: `${color}15`, border: `1px solid ${color}28` }}
                      >
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-white/70 group-hover:text-white transition-colors">{label}</p>
                        <p className="text-[10px] font-mono text-white/25 truncate">{sub}</p>
                      </div>
                      <ArrowUpRight size={13} className="text-white/15 group-hover:text-accent-primary opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </Card>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
