'use client';

import { useEffect, useRef, useState } from 'react';
import { MazeEngine } from './MazeEngine';
import { MazeRenderer } from './MazeRenderer';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';

interface MazeGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
}

export default function MazeGame({ onScoreUpdate, onGameOver }: MazeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MazeEngine | null>(null);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const gridSize = 20; // Size of one tile in px
    // The map is 20x20, so canvas should be 400x400
    // But we want it bigger. Let's scale it.
    const scale = 1.5;
    const tileSize = 25 * scale;
    
    // Initialize Engine
    const engine = new MazeEngine(tileSize);
    
    canvas.width = engine.cols * tileSize;
    canvas.height = engine.rows * tileSize;

    engine.init();
    startTimeRef.current = Date.now();
    
    engine.onScoreChange = (score) => {
      if (onScoreUpdate) onScoreUpdate(score);
    };
    
    engine.onGameOver = () => {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      arcadeManager.recordGameEnd('maze', engine.score, duration);
      if (onGameOver) onGameOver();
    };

    engineRef.current = engine;

    // Initialize Renderer
    const renderer = new MazeRenderer(ctx, engine, canvas.width, canvas.height);

    // Game Loop (Fixed 60 FPS)
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / 60;

    const gameLoop = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      accumulator += deltaTime;
      if (accumulator > 250) accumulator = 250;

      while (accumulator >= timeStep) {
        engine.update();
        accumulator -= timeStep;
      }
      
      renderer.draw();
      
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        engine.handleInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScoreUpdate, onGameOver]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-highlight/10 rounded-lg"
      />
    </div>
  );
}
