'use client';

import { useEffect, useRef, useState } from 'react';
import { AsteroidGameLogic } from './AsteroidGameLogic';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';
import PauseOverlay from '@/components/PauseOverlay';
import StatsScreen from '@/components/StatsScreen';
import PerformanceOverlay from '@/components/PerformanceOverlay';

interface AsteroidGameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
}

export default function AsteroidGame({ onScoreUpdate, onGameOver, onRestart, onExit }: AsteroidGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<AsteroidGameLogic | null>(null);
  const startTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [engineInstance, setEngineInstance] = useState<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Initialize Game Logic
    const game = new AsteroidGameLogic(
      canvas,
      (newScore) => {
        scoreRef.current = newScore;
        if (onScoreUpdate) onScoreUpdate(newScore);
      },
      () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        game.engine.stats.survivalTime = duration;
        game.engine.stats.finalDifficulty = game.engine.difficulty.getDifficulty(scoreRef.current);
        arcadeManager.recordGameEnd('asteroids', scoreRef.current, duration);
        setShowStats(true);
        if (onGameOver) onGameOver();
      }
    );
    
    gameRef.current = game;
    setEngineInstance(game.engine);
    game.start();
    startTimeRef.current = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (gameRef.current) {
          gameRef.current.engine.togglePause();
          setIsPaused(gameRef.current.engine.isPaused);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      game.stop();
    };
  }, [onScoreUpdate, onGameOver]);

  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.engine.resume();
      setIsPaused(false);
    }
  };

  const handleRestart = () => {
    setShowStats(false);
    setIsPaused(false);
    if (onRestart) onRestart();
  };

  const handleExit = () => {
    if (onExit) onExit();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain border border-white/10 shadow-2xl shadow-accent-primary/20 rounded-lg"
      />
      
      {isPaused && (
        <PauseOverlay 
          onResume={handleResume} 
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
      
      {showStats && engineInstance && (
        <StatsScreen 
          stats={engineInstance.stats} 
          onRestart={handleRestart}
          onExit={handleExit}
        />
      )}
      
      {engineInstance && <PerformanceOverlay engine={engineInstance} />}
    </div>
  );
}
