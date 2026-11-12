'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function InsertCoinButton() {
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
      <Link href="/arcade">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(110, 231, 255, 0)",
              "0 0 0 20px rgba(110, 231, 255, 0.1)",
              "0 0 0 40px rgba(110, 231, 255, 0)",
            ],
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="group relative px-8 py-4 bg-white text-black font-bold font-mono text-lg rounded-full flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-accent-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <Gamepad2 className="w-6 h-6 relative z-10" />
          <span className="relative z-10 tracking-widest">INSERT COIN</span>
        </motion.button>
      </Link>
    </div>
  );
}
