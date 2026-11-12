import { Entity } from './Entity';
import { EventBus } from './EventBus';
import { Engine } from './Engine';

export abstract class System {
  engine: Engine;
  eventBus: EventBus;

  constructor(engine: Engine) {
    this.engine = engine;
    this.eventBus = engine.eventBus;
  }

  abstract update(deltaTime: number): void;

  draw?(): void;
}
