'use client';

import { useEffect, useRef } from 'react';
import { BounceBlitzEngine } from './BounceBlitzEngine';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';

interface BounceBlitzGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

export default function BounceBlitzGame({ onScoreUpdate, onGameOver }: BounceBlitzGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BounceBlitzEngine | null>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;

    const engine = new BounceBlitzEngine(canvas.width, canvas.height);
    startTimeRef.current = Date.now();
    
    engine.onScoreChange = (score) => {
      if (onScoreUpdate) onScoreUpdate(score);
    };
    
    engine.onGameOver = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      arcadeManager.recordGameEnd('bounceblitz', engine.playerScore, duration);
      if (onGameOver) onGameOver();
    };

    engineRef.current = engine;

    let lastTime = 0;
    const keys = new Set<string>();

    const gameLoop = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      engine.handleInput(keys);
      engine.update();
      engine.draw(ctx);
      
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
        keys.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
        keys.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onScoreUpdate, onGameOver]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-accent-secondary/20 rounded-lg"
      />
    </div>
  );
}
