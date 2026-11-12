import { Engine } from './Engine';
import { System } from './System';

export class PerformanceMonitor extends System {
  fps: number = 0;
  frameCount: number = 0;
  lastTime: number = 0;
  entityCount: number = 0;
  memory: number = 0;

  constructor(engine: Engine) {
    super(engine);
    this.lastTime = performance.now();
  }

  update(deltaTime: number) {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
      
      this.entityCount = this.engine.entities.size;
      
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        this.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
      }
    }
  }

  getStats() {
    return {
      fps: this.fps,
      entities: this.entityCount,
      systems: this.engine.systems.length,
      memory: this.memory
    };
  }
}
