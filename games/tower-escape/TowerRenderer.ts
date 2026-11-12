import { TowerEngine } from './TowerEngine';

export class TowerRenderer {
  ctx: CanvasRenderingContext2D;
  engine: TowerEngine;
  width: number;
  height: number;

  constructor(ctx: CanvasRenderingContext2D, engine: TowerEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  draw() {
    const ctx = this.ctx;
    const theme = this.engine.currentLevelDef?.theme ?? { platform: '#7c3aed', bg: '#0B0F19', glow: '#a78bfa' };

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // Level indicator
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = 'bold 80px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`L${this.engine.level}`, this.width / 2, this.height / 2 + 30);

    // ── Ladders ────────────────────────────────────────────────────────
    this.engine.ladders.forEach(lad => {
      // Rail lines
      ctx.strokeStyle = theme.glow;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lad.x + 5, lad.y); ctx.lineTo(lad.x + 5, lad.y + lad.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lad.x + lad.w - 5, lad.y); ctx.lineTo(lad.x + lad.w - 5, lad.y + lad.h); ctx.stroke();
      // Rungs
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.5;
      for (let y = lad.y + 10; y < lad.y + lad.h; y += 18) {
        ctx.beginPath(); ctx.moveTo(lad.x + 5, y); ctx.lineTo(lad.x + lad.w - 5, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // ── Platforms ──────────────────────────────────────────────────────
    const goalIdx = this.engine.currentLevelDef?.goalPlatIndex ?? this.engine.platforms.length - 1;
    this.engine.platforms.forEach((plat, i) => {
      const isGoal = i === goalIdx;
      ctx.save();
      if (isGoal) {
        // Goal platform — brighter pulse
        const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = theme.platform;
      }
      // Rounded-ish platform
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      // Top edge highlight
      ctx.fillStyle = isGoal ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
      ctx.fillRect(plat.x, plat.y, plat.w, 2);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Goal flag emoji / crown on the goal platform
    {
      const gp = this.engine.platforms[goalIdx];
      if (gp) {
        ctx.save();
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆', gp.x + gp.w / 2, gp.y - 6);
        ctx.restore();
      }
    }

    // ── Player ─────────────────────────────────────────────────────────
    const p = this.engine.player;
    ctx.save();
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    if (!p.facingRight) ctx.scale(-1, 1);

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

    // Helmet visor
    ctx.fillStyle = 'rgba(0,220,255,0.55)';
    ctx.fillRect(p.w / 2 - 9, -p.h / 2 + 3, 8, 8);

    // Legs (animated)
    const legAnim = Math.sin(Date.now() * 0.015) * 4;
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(-p.w / 2, p.h / 2 - 2, 8, 6 + legAnim);
    ctx.fillRect(p.w / 2 - 8, p.h / 2 - 2, 8, 6 - legAnim);

    // Arm
    ctx.fillStyle = '#facc15';
    ctx.fillRect(p.w / 2, -p.h / 2 + 8, 5, 8);

    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Barrels ────────────────────────────────────────────────────────
    this.engine.barrels.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;

      // Wooden barrel body
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r, b.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Metal bands
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      for (const off of [-b.r * 0.4, 0, b.r * 0.4]) {
        ctx.beginPath();
        ctx.ellipse(0, off, b.r, b.r * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // ── Level clear / Game Over overlay ───────────────────────────────
    if (this.engine.won || this.engine.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(0, 0, this.width, this.height);

      const msg = this.engine.won ? `LEVEL ${this.engine.level - 1} CLEAR!` : 'GAME OVER';
      const sub = this.engine.won ? 'Loading next level...' : 'Press Restart to try again';

      ctx.textAlign = 'center';
      ctx.shadowColor = this.engine.won ? '#facc15' : '#ef4444';
      ctx.shadowBlur = 20;
      ctx.fillStyle = this.engine.won ? '#facc15' : '#ffffff';
      ctx.font = 'bold 38px "Space Grotesk", sans-serif';
      ctx.fillText(msg, this.width / 2, this.height / 2);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillText(sub, this.width / 2, this.height / 2 + 44);
    }
  }
}
