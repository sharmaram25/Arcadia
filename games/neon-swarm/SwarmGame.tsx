'use client';

import { useEffect, useRef, useState } from 'react';
import { SwarmEngine } from './SwarmEngine';
import { SwarmRenderer } from './SwarmRenderer';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';

interface SwarmGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

export default function SwarmGame({ onScoreUpdate, onGameOver }: SwarmGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SwarmEngine | null>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    const engine = new SwarmEngine(canvas.width, canvas.height);
    engine.init();
    startTimeRef.current = Date.now();
    
    engine.onScoreChange = (score) => {
      if (onScoreUpdate) onScoreUpdate(score);
    };
    
    engine.onGameOver = () => {
      setIsGameOver(true);
      const duration = (Date.now() - startTimeRef.current) / 1000;
      arcadeManager.recordGameEnd('swarm', engine.score, duration);
      if (onGameOver) onGameOver();
    };

    engineRef.current = engine;

    const renderer = new SwarmRenderer(ctx, engine, canvas.width, canvas.height);

    // Game Loop (Fixed 60 FPS)
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / 60;
    const keys = new Set<string>();

    const gameLoop = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      accumulator += deltaTime;
      if (accumulator > 250) accumulator = 250;

      while (accumulator >= timeStep) {
        engine.handleInput(keys);
        engine.update();
        accumulator -= timeStep;
      }
      
      renderer.draw();
      
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
        e.preventDefault();
        keys.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
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
