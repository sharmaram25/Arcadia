import { DifficultyManager } from '../../engine/DifficultyManager';
import { soundManager } from '../../engine/SoundManager';

const PADDLE_H = 12;
const PADDLE_W = 100;
const BALL_R = 7;
const WIN_SCORE = 10;

export class BounceBlitzEngine {
  width: number; height: number;
  playerX: number; aiX: number;
  ballX: number; ballY: number; ballDX: number = 0; ballDY: number = 0;
  playerScore = 0; aiScore = 0;
  isGameOver = false; won = false;
  private difficulty: DifficultyManager;
  private baseBallSpeed = 5;
  onScoreChange?: (s: number) => void;
  onGameOver?: () => void;

  constructor(w: number, h: number) {
    this.width = w; this.height = h;
    this.difficulty = new DifficultyManager();
    this.playerX = w / 2 - PADDLE_W / 2;
    this.aiX = w / 2 - PADDLE_W / 2;
    this.ballX = w / 2; this.ballY = h / 2;
    this.resetBall(1);
  }

  private resetBall(dir: 1 | -1) {
    const spd = this.baseBallSpeed * this.difficulty.getSpeedMultiplier(this.playerScore);
    const angle = (Math.random() - 0.5) * 0.8;
    this.ballX = this.width / 2; this.ballY = this.height / 2;
    this.ballDX = spd * Math.sin(angle);
    this.ballDY = spd * Math.cos(angle) * dir;
  }

  handleInput(keys: Set<string>) {
    const spd = 6;
    if ((keys.has('ArrowLeft') || keys.has('a')) && this.playerX > 0)
      this.playerX = Math.max(0, this.playerX - spd);
    if ((keys.has('ArrowRight') || keys.has('d')) && this.playerX + PADDLE_W < this.width)
      this.playerX = Math.min(this.width - PADDLE_W, this.playerX + spd);
  }

  update() {
    if (this.isGameOver) return;

    // AI tracks ball with difficulty-based speed
    const aiSpeed = 3 * this.difficulty.getSpeedMultiplier(this.playerScore);
    const aiCenter = this.aiX + PADDLE_W / 2;
    if (aiCenter < this.ballX - 4) this.aiX = Math.min(this.width - PADDLE_W, this.aiX + aiSpeed);
    else if (aiCenter > this.ballX + 4) this.aiX = Math.max(0, this.aiX - aiSpeed);

    // Move ball
    this.ballX += this.ballDX;
    this.ballY += this.ballDY;

    // Wall bounces
    if (this.ballX - BALL_R <= 0) { this.ballX = BALL_R; this.ballDX = Math.abs(this.ballDX); soundManager.play('click'); }
    if (this.ballX + BALL_R >= this.width) { this.ballX = this.width - BALL_R; this.ballDX = -Math.abs(this.ballDX); soundManager.play('click'); }

    const playerPaddleY = this.height - 50;
    const aiPaddleY = 40;

    // Player paddle collision (bottom)
    if (
      this.ballY + BALL_R >= playerPaddleY &&
      this.ballY + BALL_R <= playerPaddleY + PADDLE_H + 6 &&
      this.ballX >= this.playerX - 2 && this.ballX <= this.playerX + PADDLE_W + 2 &&
      this.ballDY > 0
    ) {
      const rel = (this.ballX - (this.playerX + PADDLE_W / 2)) / (PADDLE_W / 2);
      const spd = Math.sqrt(this.ballDX ** 2 + this.ballDY ** 2) * 1.03;
      this.ballDX = spd * rel; this.ballDY = -Math.abs(spd * Math.sqrt(1 - rel ** 2));
      soundManager.play('coin');
    }

    // AI paddle collision (top)
    if (
      this.ballY - BALL_R <= aiPaddleY + PADDLE_H &&
      this.ballY - BALL_R >= aiPaddleY - 6 &&
      this.ballX >= this.aiX - 2 && this.ballX <= this.aiX + PADDLE_W + 2 &&
      this.ballDY < 0
    ) {
      const rel = (this.ballX - (this.aiX + PADDLE_W / 2)) / (PADDLE_W / 2);
      const spd = Math.sqrt(this.ballDX ** 2 + this.ballDY ** 2) * 1.02;
      this.ballDX = spd * rel; this.ballDY = Math.abs(spd * Math.sqrt(1 - rel ** 2));
      soundManager.play('click');
    }

    // Ball exits top — player scores
    if (this.ballY < -BALL_R) {
      this.playerScore++;
      this.onScoreChange?.(this.playerScore);
      soundManager.play('achievement');
      if (this.playerScore >= WIN_SCORE) { this.isGameOver = true; this.won = true; this.onGameOver?.(); return; }
      this.resetBall(1);
    }

    // Ball exits bottom — AI scores
    if (this.ballY > this.height + BALL_R) {
      this.aiScore++;
      soundManager.play('explosion');
      if (this.aiScore >= WIN_SCORE) { this.isGameOver = true; this.won = false; soundManager.play('gameover'); this.onGameOver?.(); return; }
      this.resetBall(-1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, this.width, this.height);

    // Center line
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, this.height / 2); ctx.lineTo(this.width, this.height / 2); ctx.stroke();
    ctx.setLineDash([]);

    // Subtle grid
    ctx.strokeStyle = 'rgba(167,139,250,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < this.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke(); }
    for (let y = 0; y < this.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke(); }

    const playerPaddleY = this.height - 50;
    const aiPaddleY = 40;

    // Paddles
    const drawPaddle = (x: number, y: number, color: string, color2: string) => {
      ctx.save();
      const g = ctx.createLinearGradient(x, y, x + PADDLE_W, y);
      g.addColorStop(0, color); g.addColorStop(1, color2);
      ctx.fillStyle = g;
      ctx.shadowColor = color; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.roundRect(x, y, PADDLE_W, PADDLE_H, 6); ctx.fill();
      ctx.restore();
    };
    drawPaddle(this.playerX, playerPaddleY, '#6EE7FF', '#A78BFA');
    drawPaddle(this.aiX, aiPaddleY, '#FF4466', '#FF7744');

    // Ball
    ctx.save();
    const bg = ctx.createRadialGradient(this.ballX, this.ballY, 0, this.ballX, this.ballY, BALL_R);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#6EE7FF');
    ctx.fillStyle = bg;
    ctx.shadowColor = '#6EE7FF'; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(this.ballX, this.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Score
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillText(`${this.aiScore}`, this.width / 2, this.height / 2 - 20);
    ctx.fillText(`${this.playerScore}`, this.width / 2, this.height / 2 + 48);

    // Labels
    ctx.font = '11px monospace';
    ctx.fillStyle = '#FF4466'; ctx.textAlign = 'left';
    ctx.fillText('AI', 12, aiPaddleY + PADDLE_H + 18);
    ctx.fillStyle = '#6EE7FF';
    ctx.fillText('YOU', 12, playerPaddleY - 8);

    // Win goal
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'right';
    ctx.fillText(`FIRST TO ${WIN_SCORE} WINS`, this.width - 12, this.height / 2 - 6);

    ctx.textAlign = 'center';
    ctx.fillText('← → TO MOVE YOUR PADDLE', this.width / 2, this.height - 10);
  }
}
