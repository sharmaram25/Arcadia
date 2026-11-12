'use client';

import { useState, useEffect } from 'react';
import { Engine } from '@/engine/Engine';

export default function PerformanceOverlay({ engine }: { engine: Engine }) {
  const [stats, setStats] = useState({ fps: 0, entities: 0, systems: 0, memory: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      if (engine && engine.performance) {
        setStats(engine.performance.getStats());
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, engine]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-4 z-50 bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 font-mono text-xs text-green-400 shadow-lg pointer-events-none select-none">
      <h3 className="text-green-500 font-bold mb-2 uppercase tracking-widest border-b border-green-500/20 pb-1">
        Engine Stats
      </h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        <span className="text-zinc-500">FPS:</span>
        <span className="text-right font-bold">{stats.fps}</span>
        
        <span className="text-zinc-500">Entities:</span>
        <span className="text-right font-bold">{stats.entities}</span>
        
        <span className="text-zinc-500">Systems:</span>
        <span className="text-right font-bold">{stats.systems}</span>
        
        <span className="text-zinc-500">Memory:</span>
        <span className="text-right font-bold">{stats.memory} MB</span>
      </div>
    </div>
  );
}
