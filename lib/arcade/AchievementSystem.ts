import { Achievement, ACHIEVEMENTS } from './types';
import { ProfileManager } from './ProfileManager';

export class AchievementSystem {
  private profileManager: ProfileManager;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
  }

  unlock(id: string): Achievement | null {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return null;

    if (this.profileManager.unlockAchievement(id)) {
      return { ...achievement, unlocked: true, timestamp: Date.now() };
    }
    return null;
  }

  getAll(): Achievement[] {
    const unlockedIds = this.profileManager.getProfile().achievements;
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlockedIds.includes(a.id),
    }));
  }

  get(id: string): Achievement | undefined {
    return this.getAll().find(a => a.id === id);
  }
}
