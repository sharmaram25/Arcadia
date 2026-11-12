import { Entity } from '../../engine/Entity';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { RenderComponent } from '../../engine/components/RenderComponent';
import { GridPositionComponent } from './components/GridPositionComponent';
import { SnakeSegmentComponent } from './components/SnakeSegmentComponent';
import { FoodComponent } from './components/FoodComponent';
import { SnakeControllerComponent } from './components/SnakeControllerComponent';

export const CELL_SIZE = 20;

export function createSnakeHead(id: string, x: number, y: number): Entity {
  const entity = new Entity(id);
  entity.addComponent(new GridPositionComponent(x, y));
  entity.addComponent(new TransformComponent(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 0, 1, 1));
  entity.addComponent(new RenderComponent('#4ade80', 'rectangle', CELL_SIZE - 2, CELL_SIZE - 2, 2));
  entity.addComponent(new SnakeSegmentComponent());
  entity.addComponent(new SnakeControllerComponent([id])); // Head is first segment
  return entity;
}

export function createSnakeSegment(id: string, x: number, y: number): Entity {
  const entity = new Entity(id);
  entity.addComponent(new GridPositionComponent(x, y));
  entity.addComponent(new TransformComponent(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 0, 1, 1));
  entity.addComponent(new RenderComponent('#22c55e', 'rectangle', CELL_SIZE - 2, CELL_SIZE - 2, 1));
  entity.addComponent(new SnakeSegmentComponent());
  return entity;
}

export function createFood(id: string, x: number, y: number): Entity {
  const entity = new Entity(id);
  entity.addComponent(new GridPositionComponent(x, y));
  entity.addComponent(new TransformComponent(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 0, 1, 1));
  entity.addComponent(new RenderComponent('#ef4444', 'circle', CELL_SIZE - 4, CELL_SIZE - 4, 0));
  entity.addComponent(new FoodComponent());
  return entity;
}
