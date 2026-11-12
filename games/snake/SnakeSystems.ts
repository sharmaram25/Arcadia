import { System } from '../../engine/System';
import { Entity } from '../../engine/Entity';
import { GridPositionComponent } from './components/GridPositionComponent';
import { SnakeControllerComponent } from './components/SnakeControllerComponent';
import { FoodComponent } from './components/FoodComponent';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { createSnakeSegment, CELL_SIZE } from './SnakeEntities';
import { soundManager } from '../../engine/SoundManager';
import { Engine } from '../../engine/Engine';

export class SnakeSystem extends System {
  private moveTimer: number = 0;
  private baseMoveInterval: number = 0.1;
  private direction: { x: number; y: number } = { x: 1, y: 0 };
  private nextDirection: { x: number; y: number } = { x: 1, y: 0 };
  private gridSize: number = 20;
  private tileCount: number = 30;
  private isGameOver: boolean = false;
  
  // Type cast engine
  get gameEngine(): Engine {
    return this.engine as Engine;
  }

  constructor(engine: Engine, gridSize: number, tileCount: number) {
    super(engine);
    this.gridSize = gridSize;
    this.tileCount = tileCount;
  }

  update(deltaTime: number) {
    if (this.isGameOver) return;

    // Input handling
    if (this.engine.inputManager.isKeyPressed('ArrowUp') && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: -1 };
    } else if (this.engine.inputManager.isKeyPressed('ArrowDown') && this.direction.y === 0) {
      this.nextDirection = { x: 0, y: 1 };
    } else if (this.engine.inputManager.isKeyPressed('ArrowLeft') && this.direction.x === 0) {
      this.nextDirection = { x: -1, y: 0 };
    } else if (this.engine.inputManager.isKeyPressed('ArrowRight') && this.direction.x === 0) {
      this.nextDirection = { x: 1, y: 0 };
    }

    this.moveTimer += deltaTime;
    
    // Difficulty scaling
    const speedMultiplier = this.gameEngine.difficulty.getSpeedMultiplier(this.gameEngine.stats.score);
    const currentInterval = this.baseMoveInterval / speedMultiplier;

    if (this.moveTimer >= currentInterval) {
      this.moveTimer = 0;
      this.move();
    }
  }

  private move() {
    this.direction = this.nextDirection;

    // Find controller (head)
    let controller: SnakeControllerComponent | undefined;
    let headEntity: Entity | undefined;
    
    for (const entity of this.engine.entities.values()) {
      controller = entity.getComponent(SnakeControllerComponent);
      if (controller) {
        headEntity = entity;
        break;
      }
    }

    if (!controller || !headEntity) return;

    const headPos = headEntity.getComponent(GridPositionComponent);
    if (!headPos) return;

    // Calculate new head position
    const newX = headPos.x + this.direction.x;
    const newY = headPos.y + this.direction.y;

    // Check Wall Collision
    if (newX < 0 || newX >= this.tileCount || newY < 0 || newY >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Check Self Collision
    let isSelfCollision = false;
    for (const id of controller.bodyIds) {
        const segment = this.engine.getEntity(id);
        if (segment) {
            const pos = segment.getComponent(GridPositionComponent);
            if (pos && pos.x === newX && pos.y === newY) {
                 isSelfCollision = true;
                 break;
            }
        }
    }

    if (isSelfCollision) {
        this.gameOver();
        return;
    }
    
    // Check Food
    let ateFood = false;
    let foodEntity: Entity | undefined;
    
    for (const entity of this.engine.entities.values()) {
      if (entity.hasComponent(FoodComponent)) {
        const foodPos = entity.getComponent(GridPositionComponent);
        if (foodPos && foodPos.x === newX && foodPos.y === newY) {
          ateFood = true;
          foodEntity = entity;
          break;
        }
      }
    }

    // Move Logic
    let prevX = headPos.x;
    let prevY = headPos.y;
    
    // Update head
    headPos.x = newX;
    headPos.y = newY;
    this.updateTransform(headEntity, newX, newY);
    
    // Update body
    for (let i = 1; i < controller.bodyIds.length; i++) {
        const id = controller.bodyIds[i];
        const segment = this.engine.getEntity(id);
        if (segment) {
            const pos = segment.getComponent(GridPositionComponent);
            if (pos) {
                const tempX = pos.x;
                const tempY = pos.y;
                pos.x = prevX;
                pos.y = prevY;
                this.updateTransform(segment, prevX, prevY);
                prevX = tempX;
                prevY = tempY;
            }
        }
    }
    
    if (ateFood) {
        // Grow
        const newSegmentId = `snake-body-${Date.now()}-${Math.random()}`;
        const newSegment = createSnakeSegment(newSegmentId, prevX, prevY);
        this.engine.addEntity(newSegment);
        controller.bodyIds.push(newSegmentId);
        
        // Respawn food
        if (foodEntity) {
            this.spawnFood(foodEntity, controller);
        }
        
        this.gameEngine.stats.score += 10;
        this.gameEngine.stats.recordItemCollected();
        this.eventBus.emit('scoreUpdated', this.gameEngine.stats.score);
        soundManager.play('coin');
        this.gameEngine.camera.shake(2);
    }
  }
  
  private updateTransform(entity: Entity, x: number, y: number) {
      const transform = entity.getComponent(TransformComponent);
      if (transform) {
          transform.x = x * CELL_SIZE + CELL_SIZE/2;
          transform.y = y * CELL_SIZE + CELL_SIZE/2;
      }
  }
  
  private spawnFood(foodEntity: Entity, controller: SnakeControllerComponent) {
      let valid = false;
      let x = 0;
      let y = 0;
      let attempts = 0;
      
      while (!valid && attempts < 100) {
          attempts++;
          x = this.gameEngine.random.nextInt(0, this.tileCount - 1);
          y = this.gameEngine.random.nextInt(0, this.tileCount - 1);
          
          valid = true;
          // Check collision with snake body
          for (const id of controller.bodyIds) {
              const segment = this.engine.getEntity(id);
              if (segment) {
                  const pos = segment.getComponent(GridPositionComponent);
                  if (pos && pos.x === x && pos.y === y) {
                      valid = false;
                      break;
                  }
              }
          }
      }
      
      const pos = foodEntity.getComponent(GridPositionComponent);
      if (pos) {
          pos.x = x;
          pos.y = y;
          this.updateTransform(foodEntity, x, y);
      }
  }

  private gameOver() {
      this.isGameOver = true;
      this.gameEngine.camera.shake(10);
      this.eventBus.emit('gameOver');
      soundManager.play('gameover');
  }
}
