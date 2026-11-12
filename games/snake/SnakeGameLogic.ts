import { Engine } from '../../engine/Engine';
import { RenderSystem } from '../../engine/RenderSystem';
import { SnakeSystem } from './SnakeSystems';
import { createSnakeHead, createFood } from './SnakeEntities';

export class SnakeGameLogic {
  engine: Engine;
  gridSize: number = 20;
  tileCount: number = 30;

  constructor(canvas: HTMLCanvasElement, onScoreUpdate: (score: number) => void, onGameOver: () => void) {
    this.engine = new Engine();
    this.engine.init(canvas);

    // Add Systems
    this.engine.addSystem(new SnakeSystem(this.engine, this.gridSize, this.tileCount));
    this.engine.addSystem(new RenderSystem(this.engine));

    // Add Entities
    const snakeHead = createSnakeHead('snake-head', 10, 10);
    this.engine.addEntity(snakeHead);

    const food = createFood('food', 15, 15);
    this.engine.addEntity(food);

    // Event Listeners
    this.engine.eventBus.on('scoreUpdated', (score) => onScoreUpdate(score));
    this.engine.eventBus.on('gameOver', () => onGameOver());
  }

  start() {
    this.engine.start();
  }

  stop() {
    this.engine.stop();
  }
}
