'use client';

import { useEffect, useRef } from 'react';
import { TowerEngine } from './TowerEngine';
import { TowerRenderer } from './TowerRenderer';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';
import GameStatsOverlay from '@/components/GameStatsOverlay';

interface TowerGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

export default function TowerGame({ onScoreUpdate, onGameOver }: TowerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TowerEngine | null>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    // Initialize Engine
    const engine = new TowerEngine(canvas.width, canvas.height);
    engine.init();
    startTimeRef.current = Date.now();
    
    engine.onScoreChange = (score) => {
      if (onScoreUpdate) onScoreUpdate(score);
    };
    
    engine.onGameOver = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      arcadeManager.recordGameEnd('tower', engine.score, duration);
      if (onGameOver) onGameOver();
    };

    engineRef.current = engine;

    // Initialize Renderer
    const renderer = new TowerRenderer(ctx, engine, canvas.width, canvas.height);

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

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        keys.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-accent-secondary/20 rounded-lg"
      />
      <GameStatsOverlay />
    </div>
  );
}
