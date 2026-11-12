import { DefenderEngine } from './DefenderEngine';

export class DefenderRenderer {
  ctx: CanvasRenderingContext2D;
  engine: DefenderEngine;
  width: number;
  height: number;
  private _waveFlashTimer: number = 0;
  private _lastWave: number = 1;

  constructor(ctx: CanvasRenderingContext2D, engine: DefenderEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  draw(deltaTime: number = 0) {
    const ctx = this.ctx;
    const e = this.engine;

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Stars (pre-generated, scroll) ─────────────────────────────────
    for (const s of e.stars) {
      ctx.globalAlpha = s.brightness;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // ── Ground line ───────────────────────────────────────────────────
    const groundY = this.height - 40;
    const gGrad = ctx.createLinearGradient(0, groundY - 2, 0, groundY + 4);
    gGrad.addColorStop(0, 'rgba(0,234,255,0.6)');
    gGrad.addColorStop(1, 'rgba(0,234,255,0)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, groundY - 2, this.width, 6);

    // ── Player Ship ───────────────────────────────────────────────────
    const px = e.player.x;
    const py = this.height - 55;
    this._drawPlayerShip(ctx, px, py, e.player.thrusting);

    // ── Enemies ───────────────────────────────────────────────────────
    for (const en of e.enemies) {
      this._drawEnemy(ctx, en.x, en.y, en.type);
    }

    // ── Player Projectiles (cyan laser bolts) ─────────────────────────
    for (const p of e.projectiles) {
      if (!p.isEnemy) {
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 14;

        // Core bolt
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 2, p.y - 10, 4, 18);

        // Glow layer
        const grad = ctx.createLinearGradient(p.x, p.y - 10, p.x, p.y + 8);
        grad.addColorStop(0, 'rgba(0,255,255,0.9)');
        grad.addColorStop(1, 'rgba(0,120,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - 3, p.y - 10, 6, 20);

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // ── Enemy Projectiles (red plasma) ───────────────────────────────
    for (const p of e.projectiles) {
      if (p.isEnemy) {
        ctx.save();
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 10;

        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 1.2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    // ── Particles ─────────────────────────────────────────────────────
    for (const p of e.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // ── Wave banner ───────────────────────────────────────────────────
    if (e.wave !== this._lastWave) {
      this._lastWave = e.wave;
      this._waveFlashTimer = 2.0;
    }
    if (this._waveFlashTimer > 0) {
      this._waveFlashTimer -= deltaTime;
      const alpha = Math.min(1, this._waveFlashTimer * 2);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00eaff';
      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 28px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`WAVE ${e.wave}`, this.width / 2, this.height / 2 - 10);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // ── Ship drawing ────────────────────────────────────────────────────
  private _drawPlayerShip(ctx: CanvasRenderingContext2D, x: number, y: number, thrusting: boolean) {
    ctx.save();
    ctx.translate(x, y);

    // Ship glow aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    aura.addColorStop(0, 'rgba(0,234,255,0.12)');
    aura.addColorStop(1, 'rgba(0,234,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // ── Left engine nacelle ──────────────────────────────────────────
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 1.5;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-4, 2);       // Inner base
    ctx.lineTo(-18, 8);      // Wing tip
    ctx.lineTo(-20, 2);      // Nacelle back
    ctx.lineTo(-14, -2);     // Nacelle front
    ctx.lineTo(-5, -1);      // Inner front
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,180,220,0.25)';
    ctx.fill();
    ctx.stroke();

    // Right wing (mirror)
    ctx.beginPath();
    ctx.moveTo(4, 2);
    ctx.lineTo(18, 8);
    ctx.lineTo(20, 2);
    ctx.lineTo(14, -2);
    ctx.lineTo(5, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ── Main fuselage ────────────────────────────────────────────────
    ctx.strokeStyle = '#00eaff';
    ctx.fillStyle = 'rgba(10,40,60,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -17);      // Nose
    ctx.lineTo(6, -6);       // Shoulder right
    ctx.lineTo(5, 9);        // Tail right
    ctx.lineTo(-5, 9);       // Tail left
    ctx.lineTo(-6, -6);      // Shoulder left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit window
    ctx.fillStyle = 'rgba(0,255,255,0.35)';
    ctx.strokeStyle = '#00eaff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -6, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Center spine line
    ctx.strokeStyle = 'rgba(0,234,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 7);
    ctx.stroke();

    // ── Engine exhausts ──────────────────────────────────────────────
    if (thrusting || Math.random() < 0.5) {
      const flameLen = thrusting ? 8 + Math.random() * 10 : 4 + Math.random() * 4;

      // Left nacelle flame
      const lg = ctx.createLinearGradient(-17, 8, -17, 8 + flameLen);
      lg.addColorStop(0, 'rgba(255,160,30,0.95)');
      lg.addColorStop(0.4, 'rgba(255,80,0,0.7)');
      lg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = lg;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(-17, 8 + flameLen / 2, 3, flameLen / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right nacelle flame
      const rg = ctx.createLinearGradient(17, 8, 17, 8 + flameLen);
      rg.addColorStop(0, 'rgba(255,160,30,0.95)');
      rg.addColorStop(0.4, 'rgba(255,80,0,0.7)');
      rg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(17, 8 + flameLen / 2, 3, flameLen / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Center main engine (smaller idle flicker)
      const cf = thrusting ? flameLen * 0.6 : flameLen * 0.35;
      const cg = ctx.createLinearGradient(0, 9, 0, 9 + cf);
      cg.addColorStop(0, 'rgba(100,220,255,0.9)');
      cg.addColorStop(1, 'rgba(0,100,255,0)');
      ctx.fillStyle = cg;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 9 + cf / 2, 2, cf / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private _drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number, type: 'BASIC' | 'DIVER') {
    ctx.save();
    ctx.translate(x, y);

    const isDiver = type === 'DIVER';
    const baseColor = isDiver ? '#ff8800' : '#ff3366';
    const glowColor = isDiver ? '#ffaa00' : '#ff0055';

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1.5;

    // Body — saucer / alien ship shape
    ctx.fillStyle = isDiver ? 'rgba(80,30,0,0.7)' : 'rgba(60,0,30,0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dome
    ctx.fillStyle = isDiver ? 'rgba(255,180,0,0.3)' : 'rgba(255,0,80,0.3)';
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Side pods
    ctx.strokeStyle = baseColor;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.lineWidth = 1.2;
    for (const xSign of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(xSign * 11, 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center light
    ctx.fillStyle = isDiver ? '#ffcc00' : '#ff1155';
    ctx.shadowColor = isDiver ? '#ffaa00' : '#ff0055';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
