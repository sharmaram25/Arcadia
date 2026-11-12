'use client';

import { useEffect, useRef } from 'react';
import { DefenderEngine } from './DefenderEngine';
import { DefenderRenderer } from './DefenderRenderer';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';

interface DefenderGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

export default function DefenderGame({ onScoreUpdate, onGameOver }: DefenderGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DefenderEngine | null>(null);
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
    const engine = new DefenderEngine(canvas.width, canvas.height);
    engine.init();
    startTimeRef.current = Date.now();

    engine.onScoreChange = (score) => {
      if (onScoreUpdate) onScoreUpdate(score);
    };

    engine.onGameOver = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      arcadeManager.recordGameEnd('defender', engine.score, duration);
      if (onGameOver) onGameOver();
    };

    engineRef.current = engine;

    // Initialize Renderer
    const renderer = new DefenderRenderer(ctx, engine, canvas.width, canvas.height);

    // Game Loop — proper delta-time based (not fixed accumulator)
    let lastTime = 0;
    const keys = new Set<string>();

    const gameLoop = (time: number) => {
      if (!lastTime) lastTime = time;
      // Cap deltaTime to 100ms to avoid big jumps after tab switch
      const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      engine.handleInput(keys, deltaTime);
      engine.update(deltaTime);
      renderer.draw(deltaTime);

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
        keys.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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
        className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-accent-primary/20 rounded-lg"
      />
    </div>
  );
}
