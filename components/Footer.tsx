"use client";

import { motion } from "motion/react";

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/5 overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Wordmark */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-display font-bold tracking-[0.3em] text-white/80 hover:text-white transition-colors cursor-default">
            ARCADIA
          </span>
        </motion.div>

        {/* Right: Copyright */}
        <motion.p
          initial={{ opacity: 0, x: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs font-mono text-text-secondary/50"
        >
          © 2025 — ALL SYSTEMS OPERATIONAL
        </motion.p>
      </div>
    </footer>
  );
}
