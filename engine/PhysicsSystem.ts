import { System } from './System';
import { TransformComponent } from './components/TransformComponent';
import { VelocityComponent } from './components/VelocityComponent';

export class PhysicsSystem extends System {
  update(deltaTime: number) {
    for (const entity of this.engine.entities.values()) {
      const transform = entity.getComponent(TransformComponent);
      const velocity = entity.getComponent(VelocityComponent);

      if (transform && velocity) {
        transform.x += velocity.x * deltaTime;
        transform.y += velocity.y * deltaTime;
      }
    }
  }
}
