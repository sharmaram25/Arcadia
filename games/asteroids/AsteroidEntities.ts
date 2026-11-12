import { Entity } from '../../engine/Entity';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { VelocityComponent } from '../../engine/components/VelocityComponent';
import { RenderComponent } from '../../engine/components/RenderComponent';
import { BoxColliderComponent } from '../../engine/components/BoxColliderComponent';
import { AsteroidComponent } from './components/AsteroidComponent';
import { BulletComponent } from './components/BulletComponent';
import { PlayerComponent } from './components/PlayerComponent';
import { LifetimeComponent } from './components/LifetimeComponent';
import { ParticleComponent } from './components/ParticleComponent';

export function createPlayer(id: string, x: number, y: number): Entity {
  const entity = new Entity(id);
  entity.addComponent(new TransformComponent(x, y, -Math.PI / 2)); // Pointing up
  entity.addComponent(new VelocityComponent(0, 0));
  entity.addComponent(new PlayerComponent());
  entity.addComponent(new BoxColliderComponent(20, 20, 'player'));
  return entity;
}

export function createAsteroid(id: string, x: number, y: number, size: number): Entity {
  const entity = new Entity(id);
  entity.addComponent(new TransformComponent(x, y, Math.random() * Math.PI * 2));

  // Speed inversely proportional to size — small = fast, large = slow
  const baseSpeed = 30 + (60 / size) * 20;
  const angle = Math.random() * Math.PI * 2;
  entity.addComponent(new VelocityComponent(
    Math.cos(angle) * baseSpeed,
    Math.sin(angle) * baseSpeed
  ));

  // Generate irregular polygon vertices
  const vertices = [];
  const numVertices = Math.floor(Math.random() * 4) + 7; // 7–10 vertices
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    // Irregular radius — varies between 70%–120% of size
    const r = size * (0.7 + Math.random() * 0.5);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }

  const rotSpeed = (Math.random() - 0.5) * 1.5; // radians per second
  entity.addComponent(new AsteroidComponent(size, vertices, rotSpeed));
  entity.addComponent(new BoxColliderComponent(size * 2, size * 2, 'asteroid'));
  return entity;
}

export function createBullet(id: string, x: number, y: number, angle: number): Entity {
  const speed = 500; // pixels per second
  const entity = new Entity(id);
  entity.addComponent(new TransformComponent(x, y, angle));
  entity.addComponent(new VelocityComponent(Math.cos(angle) * speed, Math.sin(angle) * speed));
  entity.addComponent(new BulletComponent());
  entity.addComponent(new LifetimeComponent(1.2)); // 1.2 second lifetime
  entity.addComponent(new BoxColliderComponent(4, 4, 'bullet'));
  return entity;
}

export function createParticle(id: string, x: number, y: number, color: string): Entity {
  const angle = Math.random() * Math.PI * 2;
  const speed = 40 + Math.random() * 120;
  const entity = new Entity(id);
  entity.addComponent(new TransformComponent(x, y));
  entity.addComponent(new VelocityComponent(Math.cos(angle) * speed, Math.sin(angle) * speed));
  entity.addComponent(new ParticleComponent());
  entity.addComponent(new LifetimeComponent(0.4 + Math.random() * 0.6));
  return entity;
}
