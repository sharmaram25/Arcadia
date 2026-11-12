import { Engine } from '../../engine/Engine';
import { PhysicsSystem } from '../../engine/PhysicsSystem';
import { AsteroidMovementSystem, AsteroidInputSystem, LifetimeSystem, AsteroidCollisionSystem, AsteroidRenderSystem, PlayerRenderSystem } from './AsteroidSystems';
import { createPlayer, createAsteroid } from './AsteroidEntities';

export class AsteroidGameLogic {
  engine: Engine;
  width: number;
  height: number;

  constructor(canvas: HTMLCanvasElement, onScoreUpdate: (score: number) => void, onGameOver: () => void) {
    this.engine = new Engine();
    this.engine.init(canvas);
    this.width = canvas.width;
    this.height = canvas.height;

    // Pre-generate a static star field stored on the engine object
    (this.engine as any)._stars = this._generateStars(this.width, this.height, 100);

    // ── Systems (order matters) ──────────────────────────────────────
    this.engine.addSystem(new AsteroidInputSystem(this.engine));
    this.engine.addSystem(new PhysicsSystem(this.engine));               // velocity → position
    this.engine.addSystem(new AsteroidMovementSystem(this.engine, this.width, this.height)); // wrapping + rotation
    this.engine.addSystem(new LifetimeSystem(this.engine));
    this.engine.addSystem(new AsteroidCollisionSystem(this.engine));

    // ── Rendering ────────────────────────────────────────────────────
    // AsteroidRenderSystem draws everything in one pass:
    //   background → asteroids → bullets → particles
    // PlayerRenderSystem draws on top.
    // The old RenderSystem is intentionally NOT added — it would clear
    // the canvas mid-frame and erase bullets drawn by AsteroidRenderSystem.
    this.engine.addSystem(new AsteroidRenderSystem(this.engine));
    this.engine.addSystem(new PlayerRenderSystem(this.engine));

    // ── Entities ─────────────────────────────────────────────────────
    this.engine.addEntity(createPlayer('player', this.width / 2, this.height / 2));

    // Spawn clusters of asteroids at safe distance from center
    for (let i = 0; i < 5; i++) {
      let x: number, y: number;
      do {
        x = Math.random() * this.width;
        y = Math.random() * this.height;
      } while (
        Math.abs(x - this.width / 2) < 120 &&
        Math.abs(y - this.height / 2) < 120
      );
      this.engine.addEntity(createAsteroid(`asteroid-${i}`, x, y, 30 + Math.random() * 20));
    }

    // ── Events ───────────────────────────────────────────────────────
    this.engine.eventBus.on('scoreUpdated', (score) => onScoreUpdate(score));
    this.engine.eventBus.on('gameOver', () => onGameOver());
  }

  private _generateStars(w: number, h: number, count: number) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.2 ? 2 : 1,   // some slightly larger
      b: Math.random(),                   // brightness
    }));
  }

  start() {
    this.engine.start();
  }

  stop() {
    this.engine.stop();
  }
}
