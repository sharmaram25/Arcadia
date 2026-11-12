import { soundManager } from '@/lib/SoundManager';

export type Point = { x: number; y: number };
export type Vector = { x: number; y: number };

export interface Entity {
  pos: Point;
  vel: Vector;
  width: number;
  height: number;
  active: boolean;
  type?: string;
}

export interface Particle {
  pos: Point;
  vel: Vector;
  life: number;
  color: string;
}

export class HorizonEngine {
  width: number;
  height: number;
  
  player: Entity & { cooldown: number, speed: number };
  enemies: Entity[] = [];
  bullets: Entity[] = [];
  particles: Particle[] = [];
  stars: { pos: Point, speed: number, size: number }[] = [];

  score: number = 0;
  gameOver: boolean = false;
  scrollSpeed: number = 2;
  
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    this.player = {
      pos: { x: 50, y: height / 2 },
      vel: { x: 0, y: 0 },
      width: 40,
      height: 20,
      active: true,
      cooldown: 0,
      speed: 5
    };
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.stars = [];
    
    this.player.pos = { x: 50, y: this.height / 2 };
    this.player.active = true;

    // Generate stars
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        pos: { x: Math.random() * this.width, y: Math.random() * this.height },
        speed: Math.random() * 3 + 0.5,
        size: Math.random() * 2 + 0.5
      });
    }
    
    if (this.onScoreChange) this.onScoreChange(0);
  }

  spawnEnemy() {
    const type = Math.random() > 0.7 ? 'chaser' : 'basic';
    const y = Math.random() * (this.height - 40) + 20;
    
    this.enemies.push({
      pos: { x: this.width + 50, y },
      vel: { x: -3 - (Math.random() * 2), y: 0 },
      width: 30,
      height: 30,
      active: true,
      type
    });
  }

  spawnBullet() {
    if (this.player.cooldown > 0) return;
    
    this.bullets.push({
      pos: { x: this.player.pos.x + this.player.width, y: this.player.pos.y + this.player.height/2 },
      vel: { x: 15, y: 0 },
      width: 20,
      height: 4,
      active: true
    });
    
    this.player.cooldown = 10;
    soundManager.playShoot();
  }

  spawnParticles(pos: Point, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5;
      this.particles.push({
        pos: { ...pos },
        vel: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: Math.random() * 30 + 10,
        color,
      });
    }
  }

  handleInput(keys: Set<string>) {
    if (this.gameOver) return;

    const speed = this.player.speed;
    
    if (keys.has('ArrowUp')) this.player.pos.y -= speed;
    if (keys.has('ArrowDown')) this.player.pos.y += speed;
    if (keys.has('ArrowLeft')) this.player.pos.x -= speed;
    if (keys.has('ArrowRight')) this.player.pos.x += speed;
    
    // Clamp
    this.player.pos.x = Math.max(0, Math.min(this.width - this.player.width, this.player.pos.x));
    this.player.pos.y = Math.max(0, Math.min(this.height - this.player.height, this.player.pos.y));

    if (keys.has(' ') || keys.has('Space')) {
      this.spawnBullet();
    }
  }

  update() {
    if (this.gameOver) return;

    if (this.player.cooldown > 0) this.player.cooldown--;

    // Update Stars (Parallax)
    this.stars.forEach(star => {
      star.pos.x -= star.speed;
      if (star.pos.x < 0) star.pos.x = this.width;
    });

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x;
      if (b.pos.x > this.width) {
        this.bullets.splice(i, 1);
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      
      if (e.type === 'chaser') {
        // Move towards player Y
        if (e.pos.y < this.player.pos.y) e.vel.y = 1;
        else if (e.pos.y > this.player.pos.y) e.vel.y = -1;
      }
      
      e.pos.x += e.vel.x;
      e.pos.y += e.vel.y;
      
      if (e.pos.x < -50) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Spawn Enemies
    if (Math.random() < 0.02 + (this.score / 50000)) {
      this.spawnEnemy();
    }

    this.checkCollisions();
  }

  checkCollisions() {
    // Bullets vs Enemies
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      let hit = false;
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        
        if (this.rectIntersect(b, e)) {
          this.enemies.splice(j, 1);
          hit = true;
          this.score += 100;
          if (this.onScoreChange) this.onScoreChange(this.score);
          
          this.spawnParticles({ x: e.pos.x + e.width/2, y: e.pos.y + e.height/2 }, 15, '#FF4444');
          soundManager.playExplosion();
          break;
        }
      }
      
      if (hit) this.bullets.splice(i, 1);
    }

    // Player vs Enemies
    for (const e of this.enemies) {
      if (this.rectIntersect(this.player, e)) {
        this.triggerGameOver();
      }
    }
  }

  rectIntersect(r1: Entity, r2: Entity) {
    return !(r2.pos.x > r1.pos.x + r1.width || 
             r2.pos.x + r2.width < r1.pos.x || 
             r2.pos.y > r1.pos.y + r1.height ||
             r2.pos.y + r2.height < r1.pos.y);
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.spawnParticles(this.player.pos, 50, '#00FFFF');
    soundManager.playGameOver();
    if (this.onGameOver) this.onGameOver();
  }
}
