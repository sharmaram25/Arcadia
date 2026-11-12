import { Entity } from './Entity';
import { System } from './System';
import { GameLoop } from './GameLoop';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import { StatsTracker } from './StatsTracker';
import { CameraSystem } from './CameraSystem';
import { PerformanceMonitor } from './PerformanceMonitor';
import { DifficultyManager } from './DifficultyManager';
import { SeededRandom } from './SeededRandom';

export class Engine {
  entities: Map<string, Entity> = new Map();
  systems: System[] = [];
  eventBus: EventBus;
  inputManager: InputManager;
  gameLoop: GameLoop;
  stats: StatsTracker;
  camera: CameraSystem;
  performance: PerformanceMonitor;
  difficulty: DifficultyManager;
  random: SeededRandom;
  
  ctx: CanvasRenderingContext2D | null = null;
  canvas: HTMLCanvasElement | null = null;
  isPaused: boolean = false;

  constructor(seed: number = Date.now()) {
    this.eventBus = new EventBus();
    this.inputManager = new InputManager();
    this.stats = new StatsTracker();
    this.camera = new CameraSystem(this);
    this.performance = new PerformanceMonitor(this);
    this.difficulty = new DifficultyManager();
    this.random = new SeededRandom(seed);
    
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );

    // Add core systems
    this.addSystem(this.camera);
    this.addSystem(this.performance);
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  start() {
    this.gameLoop.start();
    this.isPaused = false;
  }

  stop() {
    this.gameLoop.stop();
    this.inputManager.cleanup();
    this.isPaused = false;
  }

  pause() {
    this.gameLoop.pause();
    this.isPaused = true;
  }

  resume() {
    this.gameLoop.resume();
    this.isPaused = false;
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
  }

  removeEntity(entityId: string) {
    this.entities.delete(entityId);
  }

  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  addSystem(system: System) {
    this.systems.push(system);
  }

  update(deltaTime: number) {
    this.inputManager.update();
    
    // Remove marked entities
    for (const [id, entity] of this.entities) {
      if (entity.isMarkedForRemoval) {
        this.removeEntity(id);
      }
    }

    for (const system of this.systems) {
      system.update(deltaTime);
    }
  }

  render() {
    // Systems that handle rendering will do so in their update or we can add a specific render phase
    // For now, we assume systems handle their own logic including drawing if they are RenderSystems
    // However, to separate update/render strictly, we might want to call a render method on systems if it exists
    // But sticking to standard ECS, we usually just have update. 
    // The GameLoop calls renderFn() which calls this.render().
    // We can iterate systems and call render if they have it, or just let them draw in update.
    // Better approach for this simple engine: 
    // Let's add a `draw` method to System class (optional) and call it here.
    
    // For now, we will rely on systems doing drawing in their update loop if they are render systems,
    // OR we can strictly separate them.
    // Given the GameLoop separates update and render, let's respect that.
    
    for (const system of this.systems) {
        if ('draw' in system && typeof (system as any).draw === 'function') {
            (system as any).draw();
        }
    }
  }
  
  clear() {
      this.entities.clear();
      this.systems = [];
      this.eventBus.clear();
  }
}
