'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Universal F2 stats overlay that works with ANY game — no ECS Engine required.
 * Tracks FPS + memory itself via the browser PerformanceAPI.
 * Drop this into any game component and it'll work.
 */
export default function GameStatsOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({ fps: 0, memory: 0, frameTime: 0 });
  const fpsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2') setIsVisible(v => !v);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const tick = (now: number) => {
      if (lastRef.current) {
        const dt = now - lastRef.current;
        fpsRef.current.push(1000 / dt);
        if (fpsRef.current.length > 30) fpsRef.current.shift();
      }
      lastRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const interval = setInterval(() => {
      const avgFps = fpsRef.current.length
        ? Math.round(fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length)
        : 0;
      const frameTime = fpsRef.current.length
        ? parseFloat((1000 / avgFps).toFixed(2))
        : 0;
      // @ts-expect-error — non-standard chrome API
      const mem = performance.memory?.usedJSHeapSize ?? 0;
      setStats({ fps: avgFps, memory: Math.round(mem / 1048576), frameTime });
    }, 400);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const fpsColor = stats.fps >= 55 ? '#4ade80' : stats.fps >= 40 ? '#facc15' : '#f87171';

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none select-none">
      <div className="bg-black/85 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 font-mono text-xs shadow-xl min-w-[180px]">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400/80 font-bold uppercase tracking-widest text-[10px]">Dev Stats</span>
          <span className="ml-auto text-white/20 text-[9px]">F2</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <span className="text-zinc-500">FPS</span>
          <span className="font-bold text-right tabular-nums" style={{ color: fpsColor }}>{stats.fps}</span>

          <span className="text-zinc-500">Frame</span>
          <span className="text-right tabular-nums text-yellow-300/80">{stats.frameTime} ms</span>

          <span className="text-zinc-500">Memory</span>
          <span className="text-right tabular-nums text-cyan-400/80">{stats.memory} MB</span>
        </div>

        {/* Mini FPS bar */}
        <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%`, backgroundColor: fpsColor }}
          />
        </div>
      </div>
    </div>
  );
}
