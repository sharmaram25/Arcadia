import { HighScore } from './types';

const LEADERBOARD_KEY = 'arcade_leaderboard_v1';

export interface LeaderboardEntry {
  playerName: string;
  gameName: string;
  score: number;
  timestamp: number;
}

export class ScoreManager {
  private leaderboard: LeaderboardEntry[];

  constructor() {
    this.leaderboard = this.loadLeaderboard();
  }

  private loadLeaderboard(): LeaderboardEntry[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveLeaderboard() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
      } catch (e) {
        console.error('Failed to save leaderboard:', e);
      }
    }
  }

  addScore(playerName: string, gameName: string, score: number) {
    this.leaderboard.push({
      playerName,
      gameName,
      score,
      timestamp: Date.now(),
    });

    // Sort by score descending
    this.leaderboard.sort((a, b) => b.score - a.score);

    // Keep top 50
    if (this.leaderboard.length > 50) {
      this.leaderboard = this.leaderboard.slice(0, 50);
    }

    this.saveLeaderboard();
  }

  getTopScores(limit: number = 10): LeaderboardEntry[] {
    return this.leaderboard.slice(0, limit);
  }

  getGameTopScores(gameName: string, limit: number = 10): LeaderboardEntry[] {
    return this.leaderboard
      .filter(entry => entry.gameName === gameName)
      .slice(0, limit);
  }
}
