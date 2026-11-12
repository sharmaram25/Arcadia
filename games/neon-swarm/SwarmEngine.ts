import { soundManager } from '@/lib/SoundManager';

export type Point = { x: number; y: number };
export type Vector = { x: number; y: number };

export interface Segment {
  pos: Point;
  type: 'head' | 'body';
  direction: number; // 1 for right, -1 for left
  row: number; // Current grid row
  active: boolean;
}

export interface Obstacle {
  pos: Point;
  health: number;
}

export interface Bullet {
  pos: Point;
  vel: Vector;
  active: boolean;
}

export interface Particle {
  pos: Point;
  vel: Vector;
  life: number;
  color: string;
}

export class SwarmEngine {
  width: number;
  height: number;
  gridSize: number = 20;

  player: {
    pos: Point;
    vel: Vector;
    width: number;
    height: number;
    cooldown: number;
    speed: number;
  };

  segments: Segment[] = [];
  obstacles: Obstacle[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];

  score: number = 0;
  gameOver: boolean = false;
  
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    
    this.player = {
      pos: { x: width / 2, y: height - 30 },
      vel: { x: 0, y: 0 },
      width: 20,
      height: 20,
      cooldown: 0,
      speed: 5
    };
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.segments = [];
    this.obstacles = [];
    this.bullets = [];
    this.particles = [];
    
    this.player.pos = { x: this.width / 2, y: this.height - 30 };
    
    // Generate obstacles
    for (let i = 0; i < 40; i++) {
      this.spawnObstacle();
    }

    // Spawn initial swarm
    this.spawnSwarm();

    if (this.onScoreChange) this.onScoreChange(0);
  }

  spawnObstacle() {
    const x = Math.floor(Math.random() * (this.width / this.gridSize)) * this.gridSize;
    const y = Math.floor(Math.random() * ((this.height - 100) / this.gridSize)) * this.gridSize + 40; // Keep top clear and bottom clear
    
    // Don't spawn on existing obstacles
    if (!this.obstacles.some(o => o.pos.x === x && o.pos.y === y)) {
      this.obstacles.push({
        pos: { x, y },
        health: 3
      });
    }
  }

  spawnSwarm() {
    const length = 12;
    const startRow = 2;
    const startX = this.width / 2;
    
    for (let i = 0; i < length; i++) {
      this.segments.push({
        pos: { x: startX - (i * this.gridSize), y: startRow * this.gridSize },
        type: i === 0 ? 'head' : 'body',
        direction: 1,
        row: startRow,
        active: true
      });
    }
  }

  spawnBullet() {
    if (this.player.cooldown > 0) return;
    
    this.bullets.push({
      pos: { x: this.player.pos.x, y: this.player.pos.y - 10 },
      vel: { x: 0, y: -10 },
      active: true
    });
    
    this.player.cooldown = 15;
    soundManager.playShoot();
  }

  spawnParticles(pos: Point, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3;
      this.particles.push({
        pos: { ...pos },
        vel: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        life: Math.random() * 20 + 10,
        color,
      });
    }
  }

  handleInput(keys: Set<string>) {
    if (this.gameOver) return;

    if (keys.has('ArrowLeft')) {
      this.player.pos.x -= this.player.speed;
    }
    if (keys.has('ArrowRight')) {
      this.player.pos.x += this.player.speed;
    }
    
    // Clamp player
    this.player.pos.x = Math.max(10, Math.min(this.width - 10, this.player.pos.x));

    if (keys.has(' ') || keys.has('Space')) {
      this.spawnBullet();
    }
  }

  update() {
    if (this.gameOver) return;

    if (this.player.cooldown > 0) this.player.cooldown--;

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.y += b.vel.y;
      
      if (b.pos.y < 0) {
        this.bullets.splice(i, 1);
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

    // Update Swarm
    const speed = 3 + (this.score / 2000); // Speed increases with score
    
    this.segments.forEach(seg => {
      if (!seg.active) return;
      
      // Move
      seg.pos.x += seg.direction * speed;
      
      // Check wall collision
      let hitWall = false;
      if (seg.pos.x <= 10 || seg.pos.x >= this.width - 10) {
        hitWall = true;
      }
      
      // Check obstacle collision
      let hitObstacle = false;
      // Simple bounding box check for obstacles in the same row
      // We only check if we are moving towards an obstacle
      const lookAheadX = seg.pos.x + (seg.direction * (this.gridSize / 2));
      
      for (const obs of this.obstacles) {
        if (Math.abs(obs.pos.y - seg.pos.y) < 5 && Math.abs(obs.pos.x - lookAheadX) < this.gridSize / 2) {
          hitObstacle = true;
          break;
        }
      }

      if (hitWall || hitObstacle) {
        // Move down and reverse
        // We need to ensure we don't do this multiple times per frame or get stuck
        // A simple way is to snap to grid and change direction
        
        // Only trigger if we haven't recently turned (hacky but works for simple arcade)
        // Better: Check if we are "entering" the collision state
        
        // Let's simplify: If hitting wall/obstacle, move down one row and flip direction immediately
        // To prevent getting stuck, we force the position out of collision
        
        seg.pos.y += this.gridSize;
        seg.direction *= -1;
        seg.pos.x += seg.direction * 5; // Bump away
        
        // If reached bottom, game over
        if (seg.pos.y >= this.player.pos.y - 10) {
          this.triggerGameOver();
        }
      }
    });

    // Collisions
    this.checkCollisions();

    // Respawn swarm if empty
    if (this.segments.length === 0) {
      this.spawnSwarm();
      // Increase difficulty by adding more obstacles
      for(let i=0; i<5; i++) this.spawnObstacle();
    }
  }

  checkCollisions() {
    // Bullets vs Swarm
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      let bulletHit = false;

      for (let j = this.segments.length - 1; j >= 0; j--) {
        const seg = this.segments[j];
        if (this.dist(b.pos, seg.pos) < this.gridSize / 1.5) {
          // Hit segment
          this.segments.splice(j, 1);
          bulletHit = true;
          this.score += 100;
          if (this.onScoreChange) this.onScoreChange(this.score);
          
          this.spawnParticles(seg.pos, 10, '#00FF00');
          soundManager.playExplosion();

          // Turn destroyed segment into obstacle (sometimes)
          if (Math.random() > 0.7) {
            this.obstacles.push({
              pos: { ...seg.pos },
              health: 3
            });
          }

          // If we split the chain, the next segment becomes a head
          // The segments are not strictly linked in this simple array, 
          // but visually it looks like a chain.
          // Logic: If there is a segment immediately "behind" this one (based on direction),
          // it should become a head.
          
          // Actually, in Centipede, every independent segment acts on its own logic.
          // So we don't need to explicitly manage "heads" other than for visuals.
          
          break; 
        }
      }

      if (bulletHit) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Bullets vs Obstacles
      for (let k = this.obstacles.length - 1; k >= 0; k--) {
        const obs = this.obstacles[k];
        if (this.dist(b.pos, obs.pos) < this.gridSize / 1.5) {
          obs.health--;
          this.spawnParticles(obs.pos, 5, '#FF00FF');
          bulletHit = true;
          this.bullets.splice(i, 1);
          
          if (obs.health <= 0) {
            this.obstacles.splice(k, 1);
            this.score += 10;
            if (this.onScoreChange) this.onScoreChange(this.score);
          }
          break;
        }
      }
    }

    // Player vs Swarm
    for (const seg of this.segments) {
      if (this.dist(this.player.pos, seg.pos) < this.gridSize) {
        this.triggerGameOver();
      }
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    soundManager.playGameOver();
    if (this.onGameOver) this.onGameOver();
  }

  dist(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
}
