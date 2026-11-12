export class StatsTracker {
  score: number = 0;
  enemiesDestroyed: number = 0;
  itemsCollected: number = 0;
  shotsFired: number = 0;
  hits: number = 0;
  survivalTime: number = 0;
  finalDifficulty: number = 1;

  reset() {
    this.score = 0;
    this.enemiesDestroyed = 0;
    this.itemsCollected = 0;
    this.shotsFired = 0;
    this.hits = 0;
    this.survivalTime = 0;
    this.finalDifficulty = 1;
  }

  recordShot() {
    this.shotsFired++;
  }

  recordHit() {
    this.hits++;
  }

  recordEnemyDestroyed() {
    this.enemiesDestroyed++;
  }

  recordItemCollected() {
    this.itemsCollected++;
  }

  getAccuracy(): number {
    if (this.shotsFired === 0) return 0;
    return Math.round((this.hits / this.shotsFired) * 100);
  }
}
