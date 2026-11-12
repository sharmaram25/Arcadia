const DIFFICULTY_STORAGE_KEY = 'arcade_difficulty_v1';

interface DifficultyPresetConfig {
  baseDifficulty: number;
  difficultyMultiplier: number;
  maxDifficulty: number;
}

// Preset configs — must match DifficultySettingsPanel presets exactly
const PRESETS: Record<string, DifficultyPresetConfig> = {
  easy: { baseDifficulty: 0.7, difficultyMultiplier: 0.002, maxDifficulty: 6 },
  normal: { baseDifficulty: 1, difficultyMultiplier: 0.005, maxDifficulty: 10 },
  hard: { baseDifficulty: 1.8, difficultyMultiplier: 0.01, maxDifficulty: 10 },
  adaptive: { baseDifficulty: 1, difficultyMultiplier: 0.005, maxDifficulty: 10 },
};

export class DifficultyManager {
  baseDifficulty: number;
  difficultyMultiplier: number;
  maxDifficulty: number;

  constructor() {
    // Load from user-selected preset in localStorage; fall back to normal defaults
    const config = this.loadPreset();
    this.baseDifficulty = config.baseDifficulty;
    this.difficultyMultiplier = config.difficultyMultiplier;
    this.maxDifficulty = config.maxDifficulty;
  }

  private loadPreset(): DifficultyPresetConfig {
    if (typeof window === 'undefined') return PRESETS.normal;
    try {
      const stored = localStorage.getItem(DIFFICULTY_STORAGE_KEY) as string | null;
      if (stored && PRESETS[stored]) {
        return PRESETS[stored];
      }
    } catch {
      // localStorage may be unavailable
    }
    return PRESETS.normal;
  }

  getDifficulty(score: number): number {
    const difficulty = this.baseDifficulty + score * this.difficultyMultiplier;
    return Math.min(difficulty, this.maxDifficulty);
  }

  getSpawnRateMultiplier(score: number): number {
    // Higher difficulty → lower spawn interval (faster spawns)
    const difficulty = this.getDifficulty(score);
    return 1 / (1 + (difficulty - 1) * 0.5);
  }

  getSpeedMultiplier(score: number): number {
    // Higher difficulty → faster movement
    const difficulty = this.getDifficulty(score);
    return 1 + (difficulty - 1) * 0.2;
  }
}
