import { DifficultyManager } from '../../engine/DifficultyManager';
import { soundManager } from '../../engine/SoundManager';

const COLS = 10;
const BRICK_ROWS = 6;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 7;
const BRICK_PADDING = 4;

const ROW_COLORS = [
  '#FF4466', '#FF7744', '#FACC15', '#44FF88', '#6EE7FF', '#A78BFA',
];

export interface Brick {
  x: number; y: number; w: number; h: number; color: string; alive: boolean;
}

export class PrismBreakEngine {
  width: number; height: number;
  paddleX: number; paddleW: number; paddleY: number;
  ballX: number; ballY: number; ballDX: number; ballDY: number;
  bricks: Brick[] = [];
  score = 0; lives = 3; level = 1;
  isGameOver = false; isWin = false;
  private difficulty: DifficultyManager;
  private baseBallSpeed = 4;
  onScoreChange?: (s: number) => void;
  onGameOver?: () => void;

  constructor(w: number, h: number) {
    this.width = w; this.height = h;
    this.difficulty = new DifficultyManager();
    this.paddleW = 100;
    this.paddleY = h - 50;
    this.paddleX = w / 2 - this.paddleW / 2;
    this.ballX = w / 2; this.ballY = h - 80;
    const spd = this.baseBallSpeed * this.difficulty.getSpeedMultiplier(0);
    this.ballDX = spd; this.ballDY = -spd;
    this.buildBricks();
  }

  buildBricks() {
    this.bricks = [];
    const bw = (this.width - BRICK_PADDING * (COLS + 1)) / COLS;
    const bh = 22;
    const topOffset = 60;
    for (let r = 0; r < BRICK_ROWS + this.level - 1; r++) {
      const row = Math.min(r, ROW_COLORS.length - 1);
      for (let c = 0; c < COLS; c++) {
        this.bricks.push({
          x: BRICK_PADDING + c * (bw + BRICK_PADDING),
          y: topOffset + r * (bh + BRICK_PADDING),
          w: bw, h: bh,
          color: ROW_COLORS[row],
          alive: true,
        });
      }
    }
  }

  handleInput(keys: Set<string>) {
    const spd = 7;
    if ((keys.has('ArrowLeft') || keys.has('a')) && this.paddleX > 0) {
      this.paddleX = Math.max(0, this.paddleX - spd);
    }
    if ((keys.has('ArrowRight') || keys.has('d')) && this.paddleX + this.paddleW < this.width) {
      this.paddleX = Math.min(this.width - this.paddleW, this.paddleX + spd);
    }
  }

  update() {
    if (this.isGameOver) return;

    const speedMult = this.difficulty.getSpeedMultiplier(this.score);
    const speed = this.baseBallSpeed * (1 + (this.level - 1) * 0.15) * speedMult;
    const dir = Math.sqrt(this.ballDX ** 2 + this.ballDY ** 2) || 1;
    this.ballDX = (this.ballDX / dir) * speed;
    this.ballDY = (this.ballDY / dir) * speed;

    this.ballX += this.ballDX;
    this.ballY += this.ballDY;

    // Wall bounces
    if (this.ballX - BALL_RADIUS <= 0) { this.ballX = BALL_RADIUS; this.ballDX = Math.abs(this.ballDX); soundManager.play('click'); }
    if (this.ballX + BALL_RADIUS >= this.width) { this.ballX = this.width - BALL_RADIUS; this.ballDX = -Math.abs(this.ballDX); soundManager.play('click'); }
    if (this.ballY - BALL_RADIUS <= 0) { this.ballY = BALL_RADIUS; this.ballDY = Math.abs(this.ballDY); soundManager.play('click'); }

    // Paddle collision
    if (
      this.ballY + BALL_RADIUS >= this.paddleY &&
      this.ballY + BALL_RADIUS <= this.paddleY + PADDLE_HEIGHT + 4 &&
      this.ballX >= this.paddleX - 4 &&
      this.ballX <= this.paddleX + this.paddleW + 4 &&
      this.ballDY > 0
    ) {
      const rel = (this.ballX - (this.paddleX + this.paddleW / 2)) / (this.paddleW / 2);
      const angle = rel * 60 * (Math.PI / 180);
      const s = Math.sqrt(this.ballDX ** 2 + this.ballDY ** 2);
      this.ballDX = s * Math.sin(angle);
      this.ballDY = -Math.abs(s * Math.cos(angle));
      soundManager.play('click');
    }

    // Ball lost
    if (this.ballY > this.height + BALL_RADIUS) {
      this.lives--;
      if (this.lives <= 0) {
        this.isGameOver = true;
        soundManager.play('gameover');
        this.onGameOver?.();
      } else {
        soundManager.play('explosion');
        this.ballX = this.width / 2;
        this.ballY = this.paddleY - 20;
        const spd = this.baseBallSpeed * this.difficulty.getSpeedMultiplier(this.score);
        this.ballDX = spd * (Math.random() > 0.5 ? 1 : -1);
        this.ballDY = -spd;
      }
    }

    // Brick collisions
    let allDead = true;
    for (const b of this.bricks) {
      if (!b.alive) continue;
      allDead = false;
      if (
        this.ballX + BALL_RADIUS > b.x && this.ballX - BALL_RADIUS < b.x + b.w &&
        this.ballY + BALL_RADIUS > b.y && this.ballY - BALL_RADIUS < b.y + b.h
      ) {
        b.alive = false;
        this.score += 10;
        this.onScoreChange?.(this.score);
        soundManager.play('coin');
        const overlapL = this.ballX + BALL_RADIUS - b.x;
        const overlapR = b.x + b.w - (this.ballX - BALL_RADIUS);
        const overlapT = this.ballY + BALL_RADIUS - b.y;
        const overlapB = b.y + b.h - (this.ballY - BALL_RADIUS);
        const minH = Math.min(overlapL, overlapR);
        const minV = Math.min(overlapT, overlapB);
        if (minH < minV) this.ballDX *= -1; else this.ballDY *= -1;
      }
    }

    if (allDead) {
      this.level++;
      this.score += this.level * 50;
      this.onScoreChange?.(this.score);
      soundManager.play('achievement');
      this.buildBricks();
      this.ballX = this.width / 2; this.ballY = this.paddleY - 20;
      const spd = this.baseBallSpeed * this.difficulty.getSpeedMultiplier(this.score);
      this.ballDX = spd; this.ballDY = -spd;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid
    ctx.strokeStyle = 'rgba(110,231,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke(); }
    for (let y = 0; y < this.height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke(); }

    // Bricks
    for (const b of this.bricks) {
      if (!b.alive) continue;
      ctx.save();
      ctx.shadowColor = b.color; ctx.shadowBlur = 8;
      ctx.fillStyle = b.color + '33';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5);
      ctx.restore();
    }

    // Paddle
    ctx.save();
    const pg = ctx.createLinearGradient(this.paddleX, this.paddleY, this.paddleX + this.paddleW, this.paddleY);
    pg.addColorStop(0, '#6EE7FF');
    pg.addColorStop(1, '#A78BFA');
    ctx.fillStyle = pg;
    ctx.shadowColor = '#6EE7FF'; ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(this.paddleX, this.paddleY, this.paddleW, PADDLE_HEIGHT, 6);
    ctx.fill();
    ctx.restore();

    // Ball
    ctx.save();
    const bg = ctx.createRadialGradient(this.ballX, this.ballY, 0, this.ballX, this.ballY, BALL_RADIUS);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#6EE7FF');
    ctx.fillStyle = bg;
    ctx.shadowColor = '#6EE7FF'; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(this.ballX, this.ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 12, 24);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6EE7FF';
    ctx.fillText(`LEVEL ${this.level}`, this.width / 2, 24);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`LIVES: ${'♥ '.repeat(this.lives).trim()}`, this.width - 12, 24);
    ctx.textAlign = 'left';

    // Controls hint
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('← → ARROWS TO MOVE PADDLE', this.width / 2, this.height - 14);
  }
}
