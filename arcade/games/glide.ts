import type { GameFactory } from '../core/types';
import { C, Particles, clamp, makeBackdrop, stars, text } from '../core/draw';

interface Gate { x: number; gapY: number; gap: number; drift: number; phase: number; passed: boolean }

const GRAV = 1500, FLAP = -430, SPEED0 = 170, GATE_W = 64, SPACING = 230;

const glide: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const ship = { x: w * 0.3, y: h * 0.45, vy: 0, r: 11 };
  let gates: Gate[] = [];
  let started = false, dead = false, deadT = 0, t = 0, speed = SPEED0;
  const trail: number[] = [];
  const fx = new Particles(250, 600);
  const far = makeBackdrop(w, h, g => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#05060f'); grd.addColorStop(1, '#0b0718');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    stars(g, w, h, 120, api.rnd);
  });
  let scroll = 0;

  const addGate = (x: number) => {
    const n = api.score;
    const gap = clamp(190 - n * 2.4, 128, 190);
    gates.push({
      x, gap,
      gapY: api.rnd() * (h - 160 - gap) + 80 + gap / 2,
      drift: n > 12 ? Math.min(40, (n - 12) * 2) * (api.rnd() < 0.5 ? 1 : -1) : 0,
      phase: api.rnd() * 6.28, passed: false,
    });
  };
  for (let i = 0; i < 4; i++) addGate(w + 120 + i * SPACING);

  const crash = () => {
    if (dead) return;
    dead = true; sfx.hit(); api.shake(12);
    fx.burst(ship.x, ship.y, 40, C.cyan, 260, 0.9, 3);
  };

  return {
    update(dt) {
      t += dt;
      fx.update(dt);
      if (dead) {
        deadT += dt;
        ship.vy += GRAV * dt; ship.y = Math.min(h + 40, ship.y + ship.vy * dt);
        if (deadT > 0.9) api.gameOver({ message: `${api.score} gates` });
        return;
      }
      if (input.action() || input.pressed('up')) {
        started = true; ship.vy = FLAP; sfx.flap();
        fx.burst(ship.x - 8, ship.y + 6, 4, '#7af7ff', 60, 0.3);
      }
      if (!started) { ship.y = h * 0.45 + Math.sin(t * 3) * 8; return; }

      speed = SPEED0 + Math.min(api.score * 2.5, 110);
      ship.vy = Math.min(ship.vy + GRAV * dt, 700);
      ship.y += ship.vy * dt;
      scroll += speed * dt;
      trail.unshift(ship.y); if (trail.length > 14) trail.pop();

      for (const gt of gates) {
        gt.x -= speed * dt;
        const gy = gt.gapY + Math.sin(t * 1.6 + gt.phase) * gt.drift;
        if (!gt.passed && gt.x + GATE_W < ship.x) { gt.passed = true; api.addScore(1); sfx.blip(); }
        // forgiving hitbox: circle vs rects, shrunk by 3px
        const r = ship.r - 3;
        if (ship.x + r > gt.x && ship.x - r < gt.x + GATE_W) {
          if (ship.y - r < gy - gt.gap / 2 || ship.y + r > gy + gt.gap / 2) crash();
        }
      }
      if (gates[0].x < -GATE_W) { gates.shift(); addGate(gates[gates.length - 1].x + SPACING); }
      if (ship.y > h - 12 || ship.y < -30) crash();
    },

    render(g) {
      far(g);
      // parallax skyline
      g.fillStyle = '#120c26';
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 73 - scroll * 0.25) % (w + 80) + w + 80) % (w + 80) - 40;
        const bh = 60 + ((i * 37) % 90);
        g.fillRect(bx, h - bh, 46, bh);
      }
      for (const gt of gates) {
        const gy = gt.gapY + Math.sin(t * 1.6 + gt.phase) * gt.drift;
        const top = gy - gt.gap / 2, bot = gy + gt.gap / 2;
        g.fillStyle = '#0d1d2a';
        g.fillRect(gt.x, 0, GATE_W, top); g.fillRect(gt.x, bot, GATE_W, h - bot);
        g.fillStyle = gt.passed ? '#2d6c7a' : C.cyan;
        g.fillRect(gt.x, top - 6, GATE_W, 6); g.fillRect(gt.x, bot, GATE_W, 6);
        g.fillRect(gt.x, 0, 2, top); g.fillRect(gt.x + GATE_W - 2, 0, 2, top);
        g.fillRect(gt.x, bot, 2, h - bot); g.fillRect(gt.x + GATE_W - 2, bot, 2, h - bot);
      }
      // ground
      g.fillStyle = '#1a0f33'; g.fillRect(0, h - 12, w, 12);
      g.fillStyle = C.pink;
      for (let x = -(scroll % 24); x < w; x += 24) g.fillRect(x, h - 12, 12, 2);

      // trail + ship
      for (let i = trail.length - 1; i >= 0; i--) {
        g.globalAlpha = (1 - i / trail.length) * 0.35;
        g.fillStyle = C.cyan;
        g.fillRect(ship.x - 6 - i * (speed / 60), trail[i] - 2, 4, 4);
      }
      g.globalAlpha = 1;
      if (!dead || deadT < 0.05) {
        const tilt = clamp(ship.vy / 600, -0.6, 1.1);
        g.save(); g.translate(ship.x, ship.y); g.rotate(tilt);
        g.fillStyle = C.cyan; g.globalAlpha = 0.2;
        g.beginPath(); g.arc(0, 0, 18, 0, 6.283); g.fill(); g.globalAlpha = 1;
        g.beginPath(); g.moveTo(14, 0); g.lineTo(-10, -10); g.lineTo(-5, 0); g.lineTo(-10, 10); g.closePath(); g.fill();
        g.fillStyle = '#ffffff'; g.fillRect(2, -2, 4, 4);
        g.restore();
      }
      fx.render(g);

      text(g, api.score, w / 2, 40, { size: 32, align: 'center', color: C.white });
      if (!started && !dead) text(g, 'TAP / SPACE TO FLAP', w / 2, h * 0.62, { size: 10, align: 'center', color: C.dim });
    },
  };
};

export default glide;
