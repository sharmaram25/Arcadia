'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import Link from 'next/link';
import { Gamepad2, ArrowRight } from 'lucide-react';

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      {/* Ambient center glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-accent-primary/8 rounded-full blur-[120px]" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f0c_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f0c_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[11px] font-mono tracking-[0.2em] mb-8">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-primary" />
            </span>
            ARCADE READY
          </div>

          <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-none">
            Your high score<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              awaits.
            </span>
          </h2>

          <p className="text-base text-white/40 mb-10 leading-relaxed">
            8 games. Zero plugins. One tab. No install required. Just pick a game and play.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/arcade">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(110, 231, 255, 0)',
                    '0 0 0 20px rgba(110, 231, 255, 0.08)',
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

            <Link href="/creator">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 font-mono text-sm text-white/50 hover:text-white tracking-widest rounded-full border border-white/10 hover:border-white/25 transition-all duration-200 flex items-center gap-2"
              >
                Meet the Creator
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
