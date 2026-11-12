import { HorizonEngine } from './HorizonEngine';

export class HorizonRenderer {
  ctx: CanvasRenderingContext2D;
  engine: HorizonEngine;
  width: number;
  height: number;
  private _time: number = 0;

  constructor(ctx: CanvasRenderingContext2D, engine: HorizonEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  draw() {
    const ctx = this.ctx;
    this._time++;

    // ── Background ────────────────────────────────────────────────────
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Nebula gradient ───────────────────────────────────────────────
    const neb = ctx.createRadialGradient(
      this.width * 0.6, this.height * 0.4, 10,
      this.width * 0.6, this.height * 0.4, 300
    );
    neb.addColorStop(0, 'rgba(60,0,100,0.18)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Stars (twinkling) ─────────────────────────────────────────────
    this.engine.stars.forEach(s => {
      const twinkle = 0.5 + 0.5 * Math.sin(this._time * 0.07 + s.pos.x);
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.pos.x, s.pos.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Bullets ───────────────────────────────────────────────────────
    this.engine.bullets.forEach(b => {
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
      // Core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.pos.x, b.pos.y - 2, b.width, 4);
      // Glow trail
      const grad = ctx.createLinearGradient(b.pos.x, 0, b.pos.x + b.width, 0);
      grad.addColorStop(0, 'rgba(0,200,255,0)');
      grad.addColorStop(1, 'rgba(0,255,255,0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.pos.x - 16, b.pos.y - 1.5, b.width + 16, 3);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // ── Enemies ───────────────────────────────────────────────────────
    this.engine.enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.pos.x + e.width / 2, e.pos.y + e.height / 2);

      if (e.type === 'chaser') {
        // Chaser — angular fighter, red/orange, points LEFT
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 14;

        // Body
        ctx.fillStyle = 'rgba(50,10,0,0.85)';
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-14, 0);          // Nose (left)
        ctx.lineTo(2, -8);           // Top shoulder
        ctx.lineTo(8, -4);           // Wing tip top
        ctx.lineTo(4, 0);            // Center indent
        ctx.lineTo(8, 4);            // Wing tip bottom
        ctx.lineTo(2, 8);            // Bottom shoulder
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit slit
        ctx.fillStyle = 'rgba(255,100,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(-4, 0, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow (right side, since ship points left)
        const flicker = 4 + Math.random() * 5;
        const eg = ctx.createRadialGradient(8, 0, 0, 8, 0, flicker);
        eg.addColorStop(0, 'rgba(255,150,0,0.9)');
        eg.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.ellipse(8 + flicker * 0.3, 0, flicker * 0.6, flicker * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Basic enemy — saucer/drone shape, orange
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 10;

        // Saucer disk
        ctx.fillStyle = 'rgba(40,15,0,0.85)';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dome
        ctx.fillStyle = 'rgba(255,140,0,0.25)';
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -4, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center eye
        ctx.fillStyle = '#ff8800';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Left/right engine pods
        for (const sx of [-1, 1]) {
          const eg = ctx.createRadialGradient(sx * 13, 0, 0, sx * 13, 0, 5);
          eg.addColorStop(0, 'rgba(255,120,0,0.8)');
          eg.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.ellipse(sx * 14, 0, 5, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // ── Player Ship ───────────────────────────────────────────────────
    if (!this.engine.gameOver) {
      const p = this.engine.player;
      ctx.save();
      ctx.translate(p.pos.x + p.width / 2, p.pos.y + p.height / 2);

      // Aura
      const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
      aura.addColorStop(0, 'rgba(0,234,255,0.1)');
      aura.addColorStop(1, 'rgba(0,234,255,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#00eaff';
      ctx.shadowBlur = 14;

      // Left wing
      ctx.strokeStyle = '#00eaff';
      ctx.fillStyle = 'rgba(0,160,200,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 2);
      ctx.lineTo(18, 8);
      ctx.lineTo(20, 2);
      ctx.lineTo(14, -2);
      ctx.lineTo(5, -1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right wing (mirrored — going down for horizontal ship)
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.lineTo(18, -8);
      ctx.lineTo(20, -2);
      ctx.lineTo(14, 2);
      ctx.lineTo(5, 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fuselage
      ctx.fillStyle = 'rgba(5,30,50,0.9)';
      ctx.strokeStyle = '#00eaff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 0);           // Nose (right)
      ctx.lineTo(8, -7);          // Top shoulder
      ctx.lineTo(-16, -5);         // Tail top
      ctx.lineTo(-20, 0);          // Tail center
      ctx.lineTo(-16, 5);          // Tail bottom
      ctx.lineTo(8, 7);            // Bottom shoulder
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = 'rgba(0,255,255,0.3)';
      ctx.strokeStyle = '#00eaff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(8, 0, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Engine flame trail (animated)
      const flameLen = 14 + Math.random() * 10;
      const fg = ctx.createLinearGradient(-20, 0, -20 - flameLen, 0);
      fg.addColorStop(0, 'rgba(255,140,0,0.95)');
      fg.addColorStop(0.5, 'rgba(255,60,0,0.6)');
      fg.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = fg;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(-16 - flameLen, 0);
      ctx.lineTo(-16, 4);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Particles ─────────────────────────────────────────────────────
    this.engine.particles.forEach(p => {
      const alpha = Math.max(0, Math.min(1, p.life / 30));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
