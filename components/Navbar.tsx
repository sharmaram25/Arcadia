'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Gamepad2, Zap } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', label: 'HOME' },
  { name: 'Arcade', path: '/arcade', label: 'ARCADE' },
  { name: 'Creator', path: '/creator', label: 'CREATOR' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full">
      {/* Scanline top border */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-80" />

      {/* Main bar */}
      <div className="relative backdrop-blur-md bg-black/70 border-b border-white/8">
        {/* Corner accent lines */}
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-accent-primary/60 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-accent-secondary/60 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-accent-primary/20 group-hover:bg-accent-primary/30 transition-colors border border-accent-primary/40" />
              <Gamepad2 className="relative w-4 h-4 text-accent-primary" />
            </div>
            <div className="flex items-center">
              <span
                className="text-xl font-display font-black tracking-[0.2em] text-white group-hover:text-accent-primary transition-colors duration-200"
                style={{ textShadow: '0 0 20px rgba(110,231,255,0.3)' }}
              >
                ARCADIA
              </span>
              <span className="ml-2 hidden sm:inline text-[9px] font-mono text-accent-primary/50 tracking-widest border border-accent-primary/20 px-1.5 py-0.5 rounded">
                v2.0
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="relative group px-4 py-2 rounded-lg overflow-hidden"
                >
                  {/* Hover bg */}
                  <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${isActive ? 'bg-accent-primary/10' : 'bg-transparent group-hover:bg-white/5'}`} />

                  {/* Active border */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-lg border border-accent-primary/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  <span className={`relative text-xs font-mono font-bold tracking-[0.15em] transition-colors duration-200 ${
                    isActive ? 'text-accent-primary' : 'text-white/45 group-hover:text-white/80'
                  }`}>
                    {isActive && <span className="mr-1 opacity-60">{'>'}</span>}
                    {item.label}
                  </span>

                  {/* Active bottom glow */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-accent-primary shadow-[0_0_8px_2px_rgba(110,231,255,0.5)]" />
                  )}
                </Link>
              );
            })}

            {/* Status indicator */}
            <div className="ml-4 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8">
              <Zap className="w-3 h-3 text-accent-primary" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">LIVE</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
