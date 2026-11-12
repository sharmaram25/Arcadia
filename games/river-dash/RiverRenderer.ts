import { RiverEngine } from './RiverEngine';

// Car colors palette — classic retro vehicles
const CAR_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

export class RiverRenderer {
  ctx: CanvasRenderingContext2D;
  engine: RiverEngine;
  width: number;
  height: number;
  private _tick: number = 0;

  constructor(ctx: CanvasRenderingContext2D, engine: RiverEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  draw() {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    this._tick++;

    // ── Lanes ──────────────────────────────────────────────────────────
    this.engine.lanes.forEach((lane, index) => {
      const y = index * gs;

      if (lane.type === 'GOAL') {
        // Lily pad zone / finish
        const gg = ctx.createLinearGradient(0, y, 0, y + gs);
        gg.addColorStop(0, '#14532d');
        gg.addColorStop(1, '#052e16');
        ctx.fillStyle = gg;
        ctx.fillRect(0, y, this.width, gs);
        // Goal text
        ctx.fillStyle = 'rgba(134,239,172,0.5)';
        ctx.font = `bold ${gs * 0.45}px "Space Grotesk", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('🏠 HOME', this.width / 2, y + gs / 2);
      } else if (lane.type === 'SAFE') {
        // Grassy bank
        const sg = ctx.createLinearGradient(0, y, 0, y + gs);
        sg.addColorStop(0, '#1a2e10');
        sg.addColorStop(1, '#0f1a08');
        ctx.fillStyle = sg;
        ctx.fillRect(0, y, this.width, gs);
        // Grass tufts
        ctx.fillStyle = 'rgba(74,222,128,0.15)';
        for (let x = 10; x < this.width; x += 22) {
          ctx.fillRect(x, y + gs - 6, 8, 6);
        }
      } else if (lane.type === 'ROAD') {
        // Asphalt
        const rg = ctx.createLinearGradient(0, y, 0, y + gs);
        rg.addColorStop(0, '#1c1917');
        rg.addColorStop(1, '#0c0a09');
        ctx.fillStyle = rg;
        ctx.fillRect(0, y, this.width, gs);
        // Road lane markings (dashed center line)
        ctx.strokeStyle = 'rgba(250,200,20,0.4)';
        ctx.setLineDash([14, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y + gs / 2);
        ctx.lineTo(this.width, y + gs / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Edge kerb
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(0, y, this.width, 3);
        ctx.fillRect(0, y + gs - 3, this.width, 3);
      } else if (lane.type === 'RIVER') {
        // Water — animated ripple tint
        const wave = Math.sin(this._tick * 0.04 + index) * 0.04;
        const wg = ctx.createLinearGradient(0, y, 0, y + gs);
        wg.addColorStop(0, `rgba(7,89,133,${0.9 + wave})`);
        wg.addColorStop(1, `rgba(4,60,100,${0.9 - wave})`);
        ctx.fillStyle = wg;
        ctx.fillRect(0, y, this.width, gs);
        // Ripple highlights
        ctx.strokeStyle = 'rgba(125,211,252,0.2)';
        ctx.lineWidth = 1;
        for (let rx = ((this._tick * Math.abs(lane.speed)) % 60) - 60; rx < this.width; rx += 55) {
          ctx.beginPath();
          ctx.moveTo(rx, y + gs * 0.4);
          ctx.bezierCurveTo(rx + 15, y + gs * 0.3, rx + 30, y + gs * 0.5, rx + 45, y + gs * 0.4);
          ctx.stroke();
        }
      }
    });

    // ── Lane objects ───────────────────────────────────────────────────
    this.engine.lanes.forEach((lane, index) => {
      const y = index * gs;

      lane.objects.forEach(obj => {
        if (obj.type === 'CAR') {
          this._drawCar(ctx, obj.x, y, obj.w, gs, obj.variant, lane.speed < 0);
        } else if (obj.type === 'LOG') {
          this._drawLog(ctx, obj.x, y, obj.w, gs);
        }
      });
    });

    // ── Player (frog) ──────────────────────────────────────────────────
    if (!this.engine.gameOver) {
      const floatX = this.engine.player.floatX;
      const px = this.engine.player.gridX * gs + floatX + gs / 2;
      const py = this.engine.player.gridY * gs + gs / 2 - this.engine.player.hopOffset;
      this._drawFrog(ctx, px, py, gs);
    }

    // ── Round indicator ────────────────────────────────────────────────
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillText(`Round ${this.engine.round}`, 8, 8);

    // ── Game Over ──────────────────────────────────────────────────────
    if (this.engine.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px "Space Grotesk", sans-serif';
      ctx.fillText('SPLAT! 🐸', this.width / 2, this.height / 2 - 20);

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '18px "Inter", sans-serif';
      ctx.fillText('Press Restart to try again', this.width / 2, this.height / 2 + 22);
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private _drawFrog(ctx: CanvasRenderingContext2D, cx: number, cy: number, gs: number) {
    ctx.save();
    ctx.translate(cx, cy);

    const r = gs * 0.34;
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 10;

    // Body
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(0, 2, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.ellipse(0, 4, r * 0.6, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left leg
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(-r * 0.9, r * 0.5, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Right leg
    ctx.beginPath();
    ctx.ellipse(r * 0.9, r * 0.5, r * 0.35, r * 0.2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Left eye
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-r * 0.45, -r * 0.75, r * 0.28, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(-r * 0.45, -r * 0.78, r * 0.14, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -r * 0.75, r * 0.28, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -r * 0.78, r * 0.14, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private _drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, gs: number, variant: number, flipped: boolean) {
    const h = gs - 10;
    const oy = y + 5;
    const colors = CAR_COLORS;
    const body = colors[variant % colors.length];

    ctx.save();
    if (flipped) {
      ctx.translate(x + w, oy + h / 2);
      ctx.scale(-1, 1);
      ctx.translate(-w / 2, -h / 2);
    } else {
      ctx.translate(x, oy);
    }

    ctx.shadowColor = body;
    ctx.shadowBlur = 8;

    // Body
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 4);
    ctx.fill();

    // Roof (lighter)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    const rW = w * 0.45;
    const rX = w * 0.28;
    ctx.beginPath();
    ctx.roundRect(rX, 3, rW, h * 0.45, 3);
    ctx.fill();

    // Windshields
    ctx.fillStyle = 'rgba(180,220,255,0.5)';
    ctx.fillRect(rX + 2, 5, rW * 0.42, h * 0.35);
    ctx.fillRect(rX + rW * 0.52, 5, rW * 0.42, h * 0.35);

    // Wheels
    ctx.fillStyle = '#1a1a1a';
    ctx.shadowBlur = 0;
    const wr = h * 0.22;
    for (const wx of [w * 0.18, w * 0.82]) {
      ctx.beginPath();
      ctx.arc(wx, h, wr, 0, Math.PI * 2);
      ctx.fill();
      // Wheel rim
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(wx, h, wr * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Headlight
    ctx.fillStyle = 'rgba(255,250,150,0.85)';
    ctx.shadowColor = '#ffffa0';
    ctx.shadowBlur = 6;
    ctx.fillRect(w - 5, h * 0.2, 5, h * 0.25);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private _drawLog(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, gs: number) {
    const h = gs - 10;
    const oy = y + 5;

    ctx.save();
    ctx.shadowColor = '#92400e';
    ctx.shadowBlur = 6;

    // Main log body
    const lg = ctx.createLinearGradient(x, oy, x, oy + h);
    lg.addColorStop(0, '#78350f');
    lg.addColorStop(0.4, '#92400e');
    lg.addColorStop(1, '#451a03');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.roundRect(x, oy, w, h, h / 2);
    ctx.fill();

    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let gx = x + 20; gx < x + w - 10; gx += 22) {
      ctx.beginPath();
      ctx.moveTo(gx, oy + 3);
      ctx.lineTo(gx + 4, oy + h - 3);
      ctx.stroke();
    }

    // End caps
    const capG = ctx.createRadialGradient(x + h / 2, oy + h / 2, 1, x + h / 2, oy + h / 2, h / 2);
    capG.addColorStop(0, '#d97706');
    capG.addColorStop(1, '#78350f');
    ctx.fillStyle = capG;
    ctx.beginPath();
    ctx.ellipse(x + h / 2, oy + h / 2, h / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - h / 2, oy + h / 2, h / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tree rings on cap
    ctx.strokeStyle = 'rgba(120,53,15,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + h / 2, oy + h / 2, h * 0.3, h * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
