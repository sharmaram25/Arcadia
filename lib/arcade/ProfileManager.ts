import { PlayerProfile, GameStats } from './types';

const PROFILE_KEY = 'arcade_profile_v1';

export class ProfileManager {
  private profile: PlayerProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): PlayerProfile {
    if (typeof window === 'undefined') {
      return this.defaultProfile();
    }
    
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.defaultProfile();
  }

  private defaultProfile(): PlayerProfile {
    return {
      name: 'Player 1',
      gamesPlayed: 0,
      totalScore: 0,
      playTime: 0,
      favoriteGame: '',
      highScores: {},
      playCounts: {},
      achievements: [],
      medals: {},
    };
  }

  saveProfile() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      } catch (e) {
        console.error('Failed to save profile:', e);
      }
    }
  }

  getProfile(): PlayerProfile {
    return this.profile;
  }

  updateGameStats(gameId: string, score: number, duration: number) {
    this.profile.gamesPlayed++;
    this.profile.totalScore += score;
    this.profile.playTime += duration;

    // Update high score
    const currentHigh = this.profile.highScores[gameId] || 0;
    if (score > currentHigh) {
      this.profile.highScores[gameId] = score;
    }

    // Update play count
    this.profile.playCounts = this.profile.playCounts || {};
    this.profile.playCounts[gameId] = (this.profile.playCounts[gameId] || 0) + 1;

    // Update favorite game (most played)
    let maxPlays = 0;
    let fav = this.profile.favoriteGame;
    for (const [id, count] of Object.entries(this.profile.playCounts)) {
      if (count > maxPlays) {
        maxPlays = count;
        fav = id;
      }
    }
    this.profile.favoriteGame = fav;
    
    this.saveProfile();
  }

  unlockAchievement(achievementId: string) {
    if (!this.profile.achievements.includes(achievementId)) {
      this.profile.achievements.push(achievementId);
      this.saveProfile();
      return true;
    }
    return false;
  }
}
