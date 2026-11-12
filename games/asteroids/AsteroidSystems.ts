import { System } from '../../engine/System';
import { Entity } from '../../engine/Entity';
import { Engine } from '../../engine/Engine';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { VelocityComponent } from '../../engine/components/VelocityComponent';
import { BoxColliderComponent } from '../../engine/components/BoxColliderComponent';
import { AsteroidComponent } from './components/AsteroidComponent';
import { BulletComponent } from './components/BulletComponent';
import { PlayerComponent } from './components/PlayerComponent';
import { LifetimeComponent } from './components/LifetimeComponent';
import { createBullet, createAsteroid, createParticle } from './AsteroidEntities';
import { soundManager } from '../../engine/SoundManager';

export class AsteroidMovementSystem extends System {
  width: number;
  height: number;

  constructor(engine: any, width: number, height: number) {
    super(engine);
    this.width = width;
    this.height = height;
  }

  update(deltaTime: number) {
    for (const entity of this.engine.entities.values()) {
      const transform = entity.getComponent(TransformComponent);
      const velocity = entity.getComponent(VelocityComponent);

      if (transform && velocity) {
        // Apply velocity scaled by deltaTime (physics step already done by PhysicsSystem)
        // Wrap around screen edges
        if (transform.x < -20) transform.x = this.width + 20;
        if (transform.x > this.width + 20) transform.x = -20;
        if (transform.y < -20) transform.y = this.height + 20;
        if (transform.y > this.height + 20) transform.y = -20;
      }

      // Rotate asteroids
      const asteroid = entity.getComponent(AsteroidComponent);
      if (asteroid && transform) {
        transform.rotation += asteroid.rotationSpeed * deltaTime;
      }
    }
  }
}

export class AsteroidInputSystem extends System {
  get gameEngine(): Engine {
    return this.engine as Engine;
  }

  update(deltaTime: number) {
    let player: Entity | undefined;
    let playerComp: PlayerComponent | undefined;
    let transform: TransformComponent | undefined;
    let velocity: VelocityComponent | undefined;

    for (const entity of this.engine.entities.values()) {
      if (entity.hasComponent(PlayerComponent)) {
        player = entity;
        playerComp = entity.getComponent(PlayerComponent);
        transform = entity.getComponent(TransformComponent);
        velocity = entity.getComponent(VelocityComponent);
        break;
      }
    }

    if (!player || !playerComp || !transform || !velocity) return;

    // Rotation — smooth and responsive
    const rotationSpeed = 3.5; // radians per second
    if (this.engine.inputManager.isKeyPressed('ArrowLeft')) {
      transform.rotation -= rotationSpeed * deltaTime;
    }
    if (this.engine.inputManager.isKeyPressed('ArrowRight')) {
      transform.rotation += rotationSpeed * deltaTime;
    }

    // Thrust — delta-time scaled for frame-rate independence
    const thrustPower = 220;
    const maxSpeed = 400;
    playerComp.thrusting = this.engine.inputManager.isKeyPressed('ArrowUp');
    if (playerComp.thrusting) {
      velocity.x += Math.cos(transform.rotation) * thrustPower * deltaTime;
      velocity.y += Math.sin(transform.rotation) * thrustPower * deltaTime;
    }

    // Clamp speed
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed > maxSpeed) {
      const factor = maxSpeed / speed;
      velocity.x *= factor;
      velocity.y *= factor;
    }

    // Apply drag — delta-time scaled friction (feels like space drag)
    const drag = Math.pow(0.35, deltaTime); // exponential decay: 65% speed lost per second
    velocity.x *= drag;
    velocity.y *= drag;

    // Shooting
    if (playerComp.cooldown > 0) playerComp.cooldown -= deltaTime;
    if (this.engine.inputManager.isKeyPressed('Space') && playerComp.cooldown <= 0) {
      // Offset bullet spawn to ship nose
      const noseX = transform.x + Math.cos(transform.rotation) * 12;
      const noseY = transform.y + Math.sin(transform.rotation) * 12;
      const bulletId = `bullet-${Date.now()}-${Math.random()}`;
      const bullet = createBullet(bulletId, noseX, noseY, transform.rotation);
      this.engine.addEntity(bullet);
      playerComp.cooldown = 0.18; // slightly faster fire rate
      soundManager.play('laser');
      this.gameEngine.stats.recordShot();
      this.gameEngine.camera.shake(1.5);
    }
  }
}

export class LifetimeSystem extends System {
  update(deltaTime: number) {
    for (const [id, entity] of this.engine.entities) {
      const lifetime = entity.getComponent(LifetimeComponent);
      if (lifetime) {
        lifetime.life -= deltaTime;
        if (lifetime.life <= 0) {
          entity.isMarkedForRemoval = true;
        }
      }
    }
  }
}

export class AsteroidCollisionSystem extends System {

  get gameEngine(): Engine {
    return this.engine as Engine;
  }

  update(deltaTime: number) {
    const bullets: Entity[] = [];
    const asteroids: Entity[] = [];
    let player: Entity | undefined;

    for (const entity of this.engine.entities.values()) {
      if (entity.hasComponent(BulletComponent) && !entity.isMarkedForRemoval) bullets.push(entity);
      if (entity.hasComponent(AsteroidComponent) && !entity.isMarkedForRemoval) asteroids.push(entity);
      if (entity.hasComponent(PlayerComponent)) player = entity;
    }

    // Bullets vs Asteroids
    for (const bullet of bullets) {
      if (bullet.isMarkedForRemoval) continue;
      const bTransform = bullet.getComponent(TransformComponent);
      if (!bTransform) continue;

      for (const asteroid of asteroids) {
        if (asteroid.isMarkedForRemoval) continue;

        const aTransform = asteroid.getComponent(TransformComponent);
        const aComp = asteroid.getComponent(AsteroidComponent);

        if (!aTransform || !aComp) continue;

        const dx = bTransform.x - aTransform.x;
        const dy = bTransform.y - aTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < aComp.size) {
          bullet.isMarkedForRemoval = true;
          asteroid.isMarkedForRemoval = true;

          // Spawn particles
          const particleCount = Math.floor(aComp.size / 8) + 4;
          for (let i = 0; i < particleCount; i++) {
            const p = createParticle(
              `p-${Date.now()}-${i}`,
              aTransform.x,
              aTransform.y,
              aComp.size > 20 ? '#ff9900' : '#ffffff'
            );
            this.engine.addEntity(p);
          }

          const points = aComp.size > 20 ? 100 : aComp.size > 10 ? 200 : 300;
          this.gameEngine.stats.score += points;
          this.gameEngine.stats.recordEnemyDestroyed();
          this.gameEngine.stats.recordHit();
          this.eventBus.emit('scoreUpdated', this.gameEngine.stats.score);
          soundManager.play('explosion');
          this.gameEngine.camera.shake(aComp.size > 20 ? 6 : 3);

          if (aComp.size > 15) {
            const newSize = aComp.size / 2;
            const speed = 60 + (50 / newSize);
            // Split at ±30°from bullet direction
            const bulletVel = bullet.getComponent(VelocityComponent);
            const baseAngle = bulletVel ? Math.atan2(bulletVel.y, bulletVel.x) : Math.random() * Math.PI * 2;

            for (let i = 0; i < 2; i++) {
              const angle = baseAngle + (i === 0 ? 0.5 : -0.5);
              const a = createAsteroid(`asteroid-${Date.now()}-${i}`, aTransform.x, aTransform.y, newSize);
              const av = a.getComponent(VelocityComponent);
              if (av) {
                av.x = Math.cos(angle) * speed;
                av.y = Math.sin(angle) * speed;
              }
              this.engine.addEntity(a);
            }
          }
          break;
        }
      }
    }

    // Player vs Asteroids
    if (player) {
      const pTransform = player.getComponent(TransformComponent);
      if (pTransform) {
        for (const asteroid of asteroids) {
          if (asteroid.isMarkedForRemoval) continue;
          const aTransform = asteroid.getComponent(TransformComponent);
          const aComp = asteroid.getComponent(AsteroidComponent);
          if (!aTransform || !aComp) continue;

          const dx = pTransform.x - aTransform.x;
          const dy = pTransform.y - aTransform.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < aComp.size + 10) {
            // Explosion particles at player
            for (let i = 0; i < 12; i++) {
              const p = createParticle(`p-${Date.now()}-${i}`, pTransform.x, pTransform.y, '#00eaff');
              this.engine.addEntity(p);
            }
            this.gameEngine.camera.shake(20);
            this.eventBus.emit('gameOver');
            soundManager.play('gameover');
            break;
          }
        }
      }
    }
  }
}

/**
 * Single unified render system for all asteroid game objects.
 * This avoids the bug where multiple systems each try to clear+draw,
 * causing earlier draws (e.g., bullets from RenderSystem) to be wiped.
 */
export class AsteroidRenderSystem extends System {
  draw() {
    const ctx = this.engine.ctx;
    if (!ctx || !this.engine.canvas) return;

    const canvas = this.engine.canvas;

    // ── Background ───────────────────────────────────────────────────
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle star field (seeded draw — same every frame for performance)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    const stars = (this.engine as any)._stars;
    if (stars) {
      for (const s of stars) {
        const brightness = 0.3 + s.b * 0.7;
        ctx.globalAlpha = brightness;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    }

    for (const entity of this.engine.entities.values()) {
      const transform = entity.getComponent(TransformComponent);
      if (!transform) continue;

      // ── Asteroids ─────────────────────────────────────────────────
      const asteroid = entity.getComponent(AsteroidComponent);
      if (asteroid) {
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.rotate(transform.rotation);

        // Glow
        ctx.shadowColor = 'rgba(160, 200, 255, 0.5)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#aac8ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (asteroid.vertices.length > 0) {
          ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
          for (let i = 1; i < asteroid.vertices.length; i++) {
            ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
          }
          ctx.closePath();
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }

      // ── Bullets ───────────────────────────────────────────────────
      const bullet = entity.getComponent(BulletComponent as any);
      if (bullet) {
        ctx.save();
        ctx.translate(transform.x, transform.y);

        // Bright glowing bullet
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Bullet trail — draw a line backward along velocity
        const vel = entity.getComponent(VelocityComponent);
        if (vel) {
          const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
          if (speed > 0) {
            const trailLen = 14;
            const nx = vel.x / speed;
            const ny = vel.y / speed;
            const grad = ctx.createLinearGradient(0, 0, -nx * trailLen, -ny * trailLen);
            grad.addColorStop(0, 'rgba(0,255,255,0.9)');
            grad.addColorStop(1, 'rgba(0,255,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-nx * trailLen, -ny * trailLen);
            ctx.stroke();
          }
        }

        ctx.shadowBlur = 0;
        ctx.restore();
        continue;
      }

      // ── Particles ─────────────────────────────────────────────────
      const lifetime = entity.getComponent(LifetimeComponent);
      const hasPlayer = entity.hasComponent(PlayerComponent);
      if (!hasPlayer && lifetime) {
        // It's a particle — check it has no asteroid or bullet or player
        const isParticle = !entity.hasComponent(AsteroidComponent as any)
          && !entity.hasComponent(BulletComponent as any);
        if (isParticle) {
          const alpha = Math.max(0, lifetime.life / lifetime.maxLife);
          ctx.save();
          ctx.translate(transform.x, transform.y);
          ctx.globalAlpha = alpha;
          ctx.shadowColor = '#ff9900';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      }
    }
  }

  update(dt: number) {}
}

export class PlayerRenderSystem extends System {
  draw() {
    const ctx = this.engine.ctx;
    if (!ctx) return;

    for (const entity of this.engine.entities.values()) {
      const transform = entity.getComponent(TransformComponent);
      const player = entity.getComponent(PlayerComponent);

      if (transform && player) {
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.rotate(transform.rotation);

        // Ship glow
        ctx.shadowColor = '#00eaff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#00eaff';
        ctx.lineWidth = 2;

        // Main ship body
        ctx.beginPath();
        ctx.moveTo(12, 0);       // Nose
        ctx.lineTo(-10, 8);      // Bottom-left wing
        ctx.lineTo(-6, 0);       // Center indent
        ctx.lineTo(-10, -8);     // Top-left wing
        ctx.closePath();
        ctx.stroke();

        // Thruster flame
        if (player.thrusting) {
          const flameLen = 8 + Math.random() * 10;
          ctx.shadowColor = '#ff6600';
          ctx.shadowBlur = 15;

          // Outer flame
          ctx.strokeStyle = '#ff4400';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(-6 - flameLen * 0.7, 0);
          ctx.lineTo(-6, 4);
          ctx.stroke();

          // Inner bright core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-6, -2);
          ctx.lineTo(-6 - flameLen * 0.5, 0);
          ctx.lineTo(-6, 2);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  }

  update(dt: number) {}
}
