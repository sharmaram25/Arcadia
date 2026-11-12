import { DifficultyManager } from '../../engine/DifficultyManager';
import { soundManager } from '../../engine/SoundManager';

const COLS = 19;
const ROWS = 15;
const CELL = 28;
const PAD = 20;

// Wall grid — true = wall, false = corridor
// Simple maze-like walls for more interesting gameplay
const WALLS: boolean[][] = (() => {
  const W: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  // Border walls
  for (let c = 0; c < COLS; c++) { W[0][c] = true; W[ROWS - 1][c] = true; }
  for (let r = 0; r < ROWS; r++) { W[r][0] = true; W[r][COLS - 1] = true; }
  // Internal pillars (2×2 blocks, evenly spaced like classic Pac-Man)
  for (let r = 2; r < ROWS - 2; r += 2) {
    for (let c = 2; c < COLS - 2; c += 4) {
      if (r !== 7 || c !== 9) { // leave center open for player / drones
        W[r][c] = true; W[r][c + 1] = true;
        if (r + 1 < ROWS - 2) { W[r + 1][c] = true; W[r + 1][c + 1] = true; }
      }
    }
  }
  return W;
})();

export interface DroneMeta {
  x: number; y: number;
  color: string;
  timer: number;
  prevX: number; prevY: number;
  /** smoothed render position */
  rx: number; ry: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; color: string; r: number;
}

export class VoidChompEngine {
  width: number; height: number;
  grid: boolean[][] = []; // true = dot present
  walls: boolean[][] = WALLS;
  playerX = 1; playerY = 1;
  /** Float render position for smooth movement */
  playerRX = 1; playerRY = 1;
  drones: DroneMeta[] = [];
  particles: Particle[] = [];
  score = 0; dotsLeft = 0; level = 1;
  isGameOver = false;
  private difficulty: DifficultyManager;
  private moveTimer = 0;
  private droneTimer = 0;
  private pendingDir = { x: 1, y: 0 };
  private currentDir = { x: 1, y: 0 };
  private _mouthAngle = 0;
  private _mouthOpen = true;
  private _oxAngle = 0; // chomping animation angle
  private _bgPulse = 0;
  onScoreChange?: (s: number) => void;
  onGameOver?: () => void;

  // Power pill mechanic
  powerPills: { r: number; c: number }[] = [];
  isPowered = false;
  powerTimer = 0;
  readonly POWER_DURATION = 8; // seconds

  constructor(w: number, h: number) {
    this.width = w; this.height = h;
    this.difficulty = new DifficultyManager();
    this.newLevel();
  }

  newLevel() {
    this.grid = [];
    this.dotsLeft = 0;
    this.isPowered = false;
    this.powerTimer = 0;
    this.particles = [];

    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        // No dots on walls or player start zone
        if (this.walls[r][c]) { this.grid[r][c] = false; continue; }
        this.grid[r][c] = true;
        this.dotsLeft++;
      }
    }

    // Player start
    this.playerX = 1; this.playerY = 1;
    this.playerRX = 1; this.playerRY = 1;
    if (this.grid[1][1]) { this.grid[1][1] = false; this.dotsLeft--; }

    // Power pills at 4 corners (non-wall cells closest to corners)
    this.powerPills = [
      { r: 1, c: 1 },
      { r: 1, c: COLS - 2 },
      { r: ROWS - 2, c: 1 },
      { r: ROWS - 2, c: COLS - 2 },
    ].filter(p => !this.walls[p.r][p.c]);
    // Remove power pills from normal dot count too
    for (const pp of this.powerPills) {
      if (this.grid[pp.r][pp.c]) { this.grid[pp.r][pp.c] = false; this.dotsLeft--; }
    }

    // Drones at opposite corners
    const droneCount = Math.min(2 + Math.floor(this.level / 2), 4);
    this.drones = [];
    const corners = [
      { x: COLS - 2, y: 1 },
      { x: 1, y: ROWS - 2 },
      { x: COLS - 2, y: ROWS - 2 },
      { x: COLS / 2 | 0, y: ROWS / 2 | 0 },
    ];
    const droneColors = ['#FF4466', '#FF7744', '#A78BFA', '#22C55E'];
    for (let i = 0; i < droneCount; i++) {
      this.drones.push({ ...corners[i], color: droneColors[i], timer: 0, prevX: corners[i].x, prevY: corners[i].y, rx: corners[i].x, ry: corners[i].y });
    }
  }

  private canMove(x: number, y: number, dx: number, dy: number): boolean {
    const nx = x + dx; const ny = y + dy;
    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
    if (this.walls[ny][nx]) return false;
    return true;
  }

  handleInput(keys: Set<string>) {
    if (keys.has('ArrowUp') || keys.has('w')) this.pendingDir = { x: 0, y: -1 };
    else if (keys.has('ArrowDown') || keys.has('s')) this.pendingDir = { x: 0, y: 1 };
    else if (keys.has('ArrowLeft') || keys.has('a')) this.pendingDir = { x: -1, y: 0 };
    else if (keys.has('ArrowRight') || keys.has('d')) this.pendingDir = { x: 1, y: 0 };
  }

  update(dt: number) {
    if (this.isGameOver) return;

    this._bgPulse += dt;
    const speedMult = this.difficulty.getSpeedMultiplier(this.score);
    const playerInterval = 0.13 / speedMult;
    const droneInterval = Math.max(0.08, (0.28 - this.level * 0.015)) / speedMult;

    // Power mode timer
    if (this.isPowered) {
      this.powerTimer -= dt;
      if (this.powerTimer <= 0) { this.isPowered = false; this.powerTimer = 0; }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Player movement
    this.moveTimer += dt;
    if (this.moveTimer >= playerInterval) {
      this.moveTimer = 0;
      this._mouthAngle = 0;

      const dirs = [this.pendingDir, this.currentDir];
      for (const d of dirs) {
        if (this.canMove(this.playerX, this.playerY, d.x, d.y)) {
          this.playerX += d.x; this.playerY += d.y;
          this.currentDir = d;
          // Eat dot
          const cell = this.grid[this.playerY]?.[this.playerX];
          if (cell) {
            this.grid[this.playerY][this.playerX] = false;
            this.dotsLeft--;
            this.score += 10;
            this.onScoreChange?.(this.score);
            soundManager.play('coin');
            this._spawnDotParticles(this.playerX, this.playerY, '#6EE7FF');
          }
          // Power pill
          const ppIdx = this.powerPills.findIndex(p => p.r === this.playerY && p.c === this.playerX);
          if (ppIdx !== -1) {
            this.powerPills.splice(ppIdx, 1);
            this.isPowered = true;
            this.powerTimer = this.POWER_DURATION;
            this.score += 50;
            this.onScoreChange?.(this.score);
            soundManager.play('achievement');
          }
          break;
        }
      }
    }

    // Smooth render position lerp
    const lerpSpeed = 12;
    this.playerRX += (this.playerX - this.playerRX) * Math.min(1, lerpSpeed * dt);
    this.playerRY += (this.playerY - this.playerRY) * Math.min(1, lerpSpeed * dt);

    // Drone movement
    this.droneTimer += dt;
    if (this.droneTimer >= droneInterval) {
      this.droneTimer = 0;
      for (const drone of this.drones) {
        drone.prevX = drone.x; drone.prevY = drone.y;
        const dx = this.playerX - drone.x;
        const dy = this.playerY - drone.y;
        const moves: { x: number; y: number }[] = [];
        if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
        if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
        // Anti-stuck: add perpendicular
        moves.push({ x: Math.sign(-dy || 1), y: Math.sign(dx || -1) });
        // If powered, drones flee
        if (this.isPowered) {
          moves.reverse();
        }
        for (const m of moves) {
          if (this.canMove(drone.x, drone.y, m.x, m.y)) {
            drone.x += m.x; drone.y += m.y; break;
          }
        }
      }
    }

    // Smooth drone lerp
    const droneLerp = 10;
    for (const drone of this.drones) {
      drone.rx += (drone.x - drone.rx) * Math.min(1, droneLerp * dt);
      drone.ry += (drone.y - drone.ry) * Math.min(1, droneLerp * dt);
    }

    // Collision with drone
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      if (d.x === this.playerX && d.y === this.playerY) {
        if (this.isPowered) {
          // Eat drone
          this.score += 200;
          this.onScoreChange?.(this.score);
          this._spawnDotParticles(d.x, d.y, d.color, 20);
          soundManager.play('explosion');
          // Respawn drone at start corner
          this.drones.splice(i, 1);
        } else {
          this.isGameOver = true;
          this._spawnDotParticles(this.playerX, this.playerY, '#FACC15', 30);
          soundManager.play('gameover');
          this.onGameOver?.();
          return;
        }
      }
    }

    // Level complete
    if (this.dotsLeft === 0) {
      this.score += this.level * 150;
      this.onScoreChange?.(this.score);
      soundManager.play('achievement');
      this.level++;
      this.newLevel();
    }
  }

  private _spawnDotParticles(gridX: number, gridY: number, color: string, count = 8) {
    const ox = (this.width - COLS * CELL) / 2;
    const oy = PAD + 24;
    const px = ox + gridX * CELL + CELL / 2;
    const py = oy + gridY * CELL + CELL / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.particles.push({ x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4 + Math.random() * 0.3, color, r: 2 + Math.random() * 2 });
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const W = this.width; const H = this.height;
    const ox = (W - COLS * CELL) / 2;
    const oy = PAD + 24;

    // Background
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, W, H);

    // Subtle bg pulse when powered
    if (this.isPowered) {
      const pulse = 0.06 + 0.04 * Math.sin(this._bgPulse * 6);
      ctx.fillStyle = `rgba(167,139,250,${pulse})`;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Walls ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = '#6EE7FF';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0c2a44';
    ctx.strokeStyle = 'rgba(110,231,255,0.6)';
    ctx.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.walls[r][c]) {
          ctx.fillRect(ox + c * CELL, oy + r * CELL, CELL, CELL);
          ctx.strokeRect(ox + c * CELL + 0.5, oy + r * CELL + 0.5, CELL - 1, CELL - 1);
        }
      }
    }
    ctx.restore();

    // ── Grid corridors (subtle) ────────────────────────────────────────
    ctx.strokeStyle = 'rgba(110,231,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!this.walls[r][c]) ctx.strokeRect(ox + c * CELL, oy + r * CELL, CELL, CELL);
      }
    }

    // ── Dots ──────────────────────────────────────────────────────────
    const dotPulse = 0.7 + 0.3 * Math.sin(this._bgPulse * 2.5);
    ctx.save();
    ctx.fillStyle = '#6EE7FF';
    ctx.shadowColor = '#6EE7FF';
    ctx.shadowBlur = 4;
    ctx.globalAlpha = dotPulse;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c]) {
          ctx.beginPath();
          ctx.arc(ox + c * CELL + CELL / 2, oy + r * CELL + CELL / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    // ── Power pills ───────────────────────────────────────────────────
    const pillPulse = 0.6 + 0.4 * Math.abs(Math.sin(this._bgPulse * 3));
    ctx.save();
    ctx.shadowBlur = 16 * pillPulse;
    ctx.shadowColor = '#FACC15';
    ctx.globalAlpha = pillPulse;
    for (const pp of this.powerPills) {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(ox + pp.c * CELL + CELL / 2, oy + pp.r * CELL + CELL / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Particles ─────────────────────────────────────────────────────
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Drones ────────────────────────────────────────────────────────
    for (const drone of this.drones) {
      ctx.save();
      const dx = ox + drone.rx * CELL + CELL / 2;
      const dy = oy + drone.ry * CELL + CELL / 2;
      const r = CELL / 2 - 3;
      const frightened = this.isPowered && this.powerTimer > 0;
      const col = frightened ? (this.powerTimer < 2 ? (Math.sin(this._bgPulse * 12) > 0 ? '#ffffff' : '#4466ff') : '#4466ff') : drone.color;

      ctx.shadowColor = col;
      ctx.shadowBlur = frightened ? 18 : 12;

      // Ghost body
      ctx.fillStyle = col + '33';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dy - 2, r, Math.PI, 0);
      // Scalloped bottom
      const steps = 3;
      const sw = (r * 2) / steps;
      for (let i = 0; i < steps; i++) {
        const cx2 = dx - r + sw * i + sw / 2;
        const cy2 = dy + r - 2;
        if (i % 2 === 0) {
          ctx.arc(cx2, cy2, sw / 2, 0, Math.PI, true);
        } else {
          ctx.arc(cx2, cy2, sw / 2, Math.PI, 0, false);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eyes
      if (!frightened) {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.ellipse(dx - 4, dy - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(dx + 4, dy - 4, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(dx - 3, dy - 4, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(dx + 5, dy - 4, 1.8, 0, Math.PI * 2); ctx.fill();
      } else {
        // Frightened eyes — X pattern
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
        for (const ex of [-4, 4]) {
          ctx.beginPath();
          ctx.moveTo(dx + ex - 2, dy - 6); ctx.lineTo(dx + ex + 2, dy - 2);
          ctx.moveTo(dx + ex + 2, dy - 6); ctx.lineTo(dx + ex - 2, dy - 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // ── Player (chomper) ──────────────────────────────────────────────
    {
      const px = ox + this.playerRX * CELL + CELL / 2;
      const py = oy + this.playerRY * CELL + CELL / 2;
      const r = CELL / 2 - 2;

      // Determine direction angle
      let faceAngle = 0;
      if (this.currentDir.x === 1) faceAngle = 0;
      else if (this.currentDir.x === -1) faceAngle = Math.PI;
      else if (this.currentDir.y === -1) faceAngle = -Math.PI / 2;
      else if (this.currentDir.y === 1) faceAngle = Math.PI / 2;

      // Chomping animation
      this._oxAngle += 8 * (this.isPowered ? 1.5 : 1);
      const mouthAng = Math.max(0.05, Math.abs(Math.sin(this._oxAngle * 0.1)) * 0.55);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(faceAngle);
      ctx.shadowColor = this.isPowered ? '#A78BFA' : '#FACC15';
      ctx.shadowBlur = this.isPowered ? 22 : 18;
      ctx.fillStyle = this.isPowered ? '#A78BFA' : '#FACC15';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, mouthAng, Math.PI * 2 - mouthAng);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(r * 0.2, -r * 0.45, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── HUD ───────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Space Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 10, 18);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`LEVEL ${this.level}`, W / 2, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#6EE7FF';
    ctx.fillText(`DOTS: ${this.dotsLeft}`, W - 10, 18);

    if (this.isPowered) {
      ctx.textAlign = 'center';
      ctx.fillStyle = this.powerTimer < 2 ? (Math.sin(this._bgPulse * 10) > 0 ? '#ff4466' : '#A78BFA') : '#A78BFA';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`⚡ POWER MODE — ${Math.ceil(this.powerTimer)}s`, W / 2, H - 10);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '11px monospace';
      ctx.fillText('ARROWS TO MOVE — EAT ALL DOTS — EVADE DRONES', W / 2, H - 10);
    }

    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff4466';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px "Space Grotesk", sans-serif';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '16px monospace';
      ctx.fillText(`Score: ${this.score} — Level: ${this.level}`, W / 2, H / 2 + 26);
    }
  }
}
