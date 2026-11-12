export class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly timeStep: number = 1000 / 60; // 60 FPS
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor(private updateFn: (deltaTime: number) => void, private renderFn: () => void) {}

  start() {
    if (this.isRunning && !this.isPaused) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.loop(performance.now());
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;
    
    if (this.isPaused) {
        // Keep loop running but don't update game state
        // This allows for potential pause animations if needed, or just keeping the loop alive
        // But for now, we can just return and let resume() restart it, or keep requesting frame
        // If we return, we stop the loop. resume() needs to restart it.
        // Let's just stop requesting frames if paused, and resume() will restart.
        // Actually, better to keep loop running but skip update to keep time consistent?
        // No, if we pause, time should stop.
        // So we can just set isPaused and stop requesting frames.
        // But wait, resume() needs to know to restart.
        // Let's make pause() stop the loop but keep isRunning true.
        return; 
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // Update fixed time steps
    // Limit accumulator to prevent spiral of death if frame rate drops significantly
    if (this.accumulator > 250) {
        this.accumulator = 250;
    }

    while (this.accumulator >= this.timeStep) {
      this.updateFn(this.timeStep / 1000); // Pass seconds
      this.accumulator -= this.timeStep;
    }

    // Render
    this.renderFn();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
