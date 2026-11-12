import { soundManager } from '@/lib/SoundManager';

export type Point = { x: number; y: number };

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export class DefenderEngine {
  width: number;
  height: number;

  player: {
    x: number;
    width: number;
    height: number;
    speed: number;
    cooldown: number;
    thrusting: boolean;
  };

  // Each enemy x,y is center position
  enemies: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'BASIC' | 'DIVER';
    velX: number;   // used as formation speed (BASIC) or diver speed (DIVER)
    velY: number;   // diver downward speed px/sec
  }[];

  projectiles: {
    x: number;
    y: number;
    velY: number;   // px/sec (negative = up)
    isEnemy: boolean;
  }[];

  particles: {
    x: number;
    y: number;
    velX: number;
    velY: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }[];

  stars: Star[];

  score: number;
  gameOver: boolean;
  wave: number;
  direction: number;

  // Formation-level shoot timer — one enemy fires at a time
  private _shootTimer: number = 0;

  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.score = 0;
    this.gameOver = false;
    this.wave = 1;
    this.direction = 1;
    this._shootTimer = 1;

    this.player = {
      x: width / 2,
      width: 34,
      height: 34,
      speed: 300,   // px/sec  (original was 5px/frame ~300px/sec)
      cooldown: 0,
      thrusting: false,
    };

    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.stars = this._generateStars(100);
  }

  private _generateStars(count: number): Star[] {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      speed: 20 + Math.random() * 60,
      size: Math.random() < 0.15 ? 2 : 1,
      brightness: 0.3 + Math.random() * 0.7,
    }));
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.wave = 1;
    this.direction = 1;
    this._shootTimer = 1;
    this.player.x = this.width / 2;
    this.player.cooldown = 0;
    this.player.thrusting = false;
    this.projectiles = [];
    this.particles = [];
    this.stars = this._generateStars(100);
    this.spawnWave();
    if (this.onScoreChange) this.onScoreChange(0);
  }

  spawnWave() {
    this.enemies = [];
    this.direction = 1;
    this._shootTimer = 1;

    // Clear ALL projectiles between waves — stale enemy bullets from the
    // previous wave would otherwise immediately kill the player on spawn.
    this.projectiles = [];
    this.particles = [];

    const rows = Math.min(3 + Math.floor((this.wave - 1) / 2), 6);
    const cols = 8;
    const padding = 55;
    const spacing = (this.width - padding * 2) / (cols - 1);

    // Formation speed in px/sec — original was (1 + wave*0.2) px/frame
    const formationSpeed = (1 + this.wave * 0.2) * 60; // ~72 px/sec wave 1

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.enemies.push({
          x: padding + c * spacing,
          y: 55 + r * 45,
          width: 26,
          height: 22,
          type: 'BASIC',
          velX: formationSpeed,
          velY: 0,
        });
      }
    }
  }

  handleInput(keys: Set<string>, deltaTime: number) {
    if (this.gameOver) return;

    this.player.thrusting = false;
    const dx = this.player.speed * deltaTime;

    if (keys.has('ArrowLeft')) {
      this.player.x = Math.max(this.player.width / 2, this.player.x - dx);
      this.player.thrusting = true;
    }
    if (keys.has('ArrowRight')) {
      this.player.x = Math.min(this.width - this.player.width / 2, this.player.x + dx);
      this.player.thrusting = true;
    }

    if (keys.has(' ') && this.player.cooldown <= 0) {
      this.projectiles.push({
        x: this.player.x,
        y: this.height - 55,
        velY: -600,     // px/sec upward (original: -10 px/frame × 60)
        isEnemy: false,
      });
      this.player.cooldown = 0.25; // original: 15 frames / 60
      soundManager.playShoot();
    }
  }

  update(deltaTime: number) {
    if (this.gameOver) return;

    if (this.player.cooldown > 0) this.player.cooldown -= deltaTime;

    // ── Scrolling stars ─────────────────────────────────────────────
    for (const s of this.stars) {
      s.y += s.speed * deltaTime;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
    }

    // ── Enemy formation movement ─────────────────────────────────────
    // Separate BASIC enemies from DIVERs so edge detection only
    // considers the BASIC formation, not stray divers.
    let hitEdge = false;
    let formationMinX = Infinity;
    let formationMaxX = -Infinity;

    for (const e of this.enemies) {
      if (e.type === 'BASIC') {
        e.x += e.velX * this.direction * deltaTime;
        formationMinX = Math.min(formationMinX, e.x);
        formationMaxX = Math.max(formationMaxX, e.x);
      } else {
        // Diver moves downward, gently homes on player x
        e.y += e.velY * deltaTime;
        const diff = (this.player.x - e.x);
        // Simple proportional homing — no velocity accumulation (avoids overshoot)
        e.x += Math.sign(diff) * Math.min(Math.abs(diff) * 0.8 * deltaTime, 100 * deltaTime);
      }
    }

    // Edge check only on BASIC formation bounds
    if (formationMinX < 20 || formationMaxX > this.width - 20) {
      hitEdge = true;
    }

    if (hitEdge) {
      this.direction *= -1;
      for (const e of this.enemies) {
        if (e.type === 'BASIC') e.y += 20;
      }
    }

    // ── Random dive (original rate: 0.0005 per frame → 0.03/sec) ────
    // Pick one random BASIC enemy per check to avoid cascading
    const basicEnemies = this.enemies.filter(e => e.type === 'BASIC');
    if (basicEnemies.length > 0 && Math.random() < 0.03 * this.wave * deltaTime) {
      const target = basicEnemies[Math.floor(Math.random() * basicEnemies.length)];
      target.type = 'DIVER';
      target.velY = 180; // px/sec downward (original: 3 px/frame × 60)
    }

    // ── Enemy shooting — formation timer ────────────────────────────
    // One random enemy fires every ~1-2 seconds × wave difficulty
    this._shootTimer -= deltaTime;
    if (this._shootTimer <= 0 && this.enemies.length > 0) {
      const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      this.projectiles.push({
        x: shooter.x,
        y: shooter.y + shooter.height / 2 + 5,
        velY: 300,      // px/sec downward  (original: 5 px/frame × 60)
        isEnemy: true,
      });
      this._shootTimer = Math.max(0.3, 1.5 - this.wave * 0.1);
    }

    // ── Projectiles ──────────────────────────────────────────────────
    const playerY = this.height - 55;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.y += p.velY * deltaTime;

      // Remove out-of-bounds
      if (p.y < -10 || p.y > this.height + 10) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isEnemy) {
        // Check player hit
        const dx = Math.abs(p.x - this.player.x);
        const dy = Math.abs(p.y - playerY);
        if (dx < this.player.width / 2 + 2 && dy < this.player.height / 2 + 4) {
          this.spawnParticles(this.player.x, playerY, '#00eaff', 16);
          this.gameOver = true;
          soundManager.playExplosion();
          if (this.onGameOver) this.onGameOver();
          return; // stop all further processing
        }
      } else {
        // Check enemy hit (iterate backwards for safe splice)
        let hit = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dx = Math.abs(p.x - e.x);
          const dy = Math.abs(p.y - e.y);
          if (dx < e.width / 2 + 2 && dy < e.height / 2 + 2) {
            const pts = e.type === 'DIVER' ? 200 : 100;
            this.score += pts;
            if (this.onScoreChange) this.onScoreChange(this.score);
            soundManager.playExplosion();
            this.spawnParticles(e.x, e.y, e.type === 'DIVER' ? '#ff9900' : '#ff4466', 12);
            this.enemies.splice(j, 1);
            this.projectiles.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }
    }

    // ── Particles ────────────────────────────────────────────────────
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.velX * deltaTime;
      p.y += p.velY * deltaTime;
      p.velY += 60 * deltaTime; // subtle gravity
      p.life -= deltaTime;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // ── Remove divers that flew off-screen (do NOT trigger game over) ─
    // Divers are homing projectiles — they should disappear if not shot.
    // Only the ground-march of BASIC enemies should end the game.
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].type === 'DIVER' && this.enemies[i].y > this.height + 20) {
        this.enemies.splice(i, 1);
      }
    }

    // ── Wave clear ───────────────────────────────────────────────────
    if (this.enemies.length === 0) {
      this.wave++;
      this.spawnWave();
      return;
    }

    // ── Invasion check — ONLY BASIC formation enemies ─────────────────
    // Divers are already cleaned up above; only the advancing wall should
    // end the game so the player isn't punished for a diver sneaking past.
    for (const e of this.enemies) {
      if (e.type === 'BASIC' && e.y > this.height - 60) {
        this.gameOver = true;
        soundManager.playGameOver();
        if (this.onGameOver) this.onGameOver();
        return;
      }
    }
  }

  spawnParticles(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      const life = 0.3 + Math.random() * 0.5;
      this.particles.push({
        x, y,
        velX: Math.cos(angle) * speed,
        velY: Math.sin(angle) * speed - 20,
        life,
        maxLife: life,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }
}
