import { ProfileManager } from './ProfileManager';
import { AchievementSystem } from './AchievementSystem';
import { ScoreManager } from './ScoreManager';
import { Achievement, MEDAL_THRESHOLDS, MedalType } from './types';

// Score thresholds that trigger per-game achievements
const GAME_ACHIEVEMENT_MAP: Record<string, { achievementId: string; threshold: number }> = {
  snake:     { achievementId: 'snake_master',       threshold: 200 },
  asteroids: { achievementId: 'asteroid_hunter',    threshold: 5000 },
  maze:      { achievementId: 'maze_runner',         threshold: 150 },
  defender:  { achievementId: 'star_defender',       threshold: 2000 },
  tower:     { achievementId: 'tower_climber',       threshold: 200 },
  river:     { achievementId: 'river_crosser',       threshold: 200 },
  swarm:     { achievementId: 'swarm_survivor',      threshold: 5000 },
  horizon:   { achievementId: 'untouchable',         threshold: 5000 },
  prismbreak: { achievementId: 'prism_breaker',      threshold: 2500 },
  voidchomp: { achievementId: 'pac_master',          threshold: 2500 },
  stackpanic: { achievementId: 'tetris_god',         threshold: 5000 },
  bounceblitz: { achievementId: 'pong_champ',        threshold: 10 },
};

class ArcadeManager {
  private static instance: ArcadeManager;
  public profile: ProfileManager;
  public achievements: AchievementSystem;
  public scores: ScoreManager;

  private constructor() {
    this.profile = new ProfileManager();
    this.achievements = new AchievementSystem(this.profile);
    this.scores = new ScoreManager();
  }

  public static getInstance(): ArcadeManager {
    if (!ArcadeManager.instance) {
      ArcadeManager.instance = new ArcadeManager();
    }
    return ArcadeManager.instance;
  }

  recordGameStart(gameId: string) {
    // Intentionally lean — session tracking handled on end
  }

  recordGameEnd(gameId: string, score: number, duration: number) {
    this.profile.updateGameStats(gameId, score, duration);
    this.scores.addScore(this.profile.getProfile().name, gameId, score);

    // Check medals
    this.checkMedals(gameId, score);

    // Check per-game achievements
    this.checkGameAchievement(gameId, score);

    // Check global achievements
    this.checkGlobalAchievements(gameId, score);
  }

  unlockAchievement(id: string): Achievement | null {
    const result = this.achievements.unlock(id);
    if (result) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: result }));
      }
    }
    return result;
  }

  private checkGameAchievement(gameId: string, score: number) {
    const mapping = GAME_ACHIEVEMENT_MAP[gameId];
    if (!mapping) return;
    if (score >= mapping.threshold) {
      this.unlockAchievement(mapping.achievementId);
    }
  }

  private checkMedals(gameId: string, score: number) {
    const thresholds = MEDAL_THRESHOLDS[gameId];
    if (!thresholds) return;

    const profile = this.profile.getProfile();
    const medals: MedalType[] = profile.medals?.[gameId] ?? [];

    if (score >= thresholds.gold && !medals.includes('gold')) {
      medals.push('gold');
    } else if (score >= thresholds.silver && !medals.includes('silver')) {
      medals.push('silver');
    } else if (score >= thresholds.bronze && !medals.includes('bronze')) {
      medals.push('bronze');
    }

    if (medals.length > 0) {
      profile.medals = profile.medals ?? {};
      profile.medals[gameId] = medals;
      this.profile.saveProfile();
    }
  }

  private checkGlobalAchievements(gameId: string, score: number) {
    // "First Play"
    if (this.profile.getProfile().gamesPlayed === 1) {
      this.unlockAchievement('first_play');
    }

    // "Arcade Explorer" — played every game at least once
    const playedGames = Object.keys(this.profile.getProfile().highScores).length;
    if (playedGames >= 12) {
      this.unlockAchievement('arcade_explorer');
    }
  }
}

export const arcadeManager = ArcadeManager.getInstance();
