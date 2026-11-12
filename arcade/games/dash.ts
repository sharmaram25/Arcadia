import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Ob { x: number; y: number; w: number; h: number; kind: 'block' | 'drone'; phase: number }

const GROUND = 300, GRAV = 2600, JUMP = -820;

const RUN = [
  ['..oooo..', '.owwwwo.', '.owkwko.', '..oooo..', '.occcco.', 'oc.cc.co', '..c..c..', '.c....c.'],
  ['..oooo..', '.owwwwo.', '.owkwko.', '..oooo..', '.occcco.', '.occcco.', '...cc...', '..c..c..'],
];
const DUCK = ['........', '........', '........', '..oooo..', '.owwkwo.', 'occcccco', '.c.cc.c.', 'c......c'];
const PAL: Record<string, string> = { o: '#2a0a14', w: '#ffe0c2', k: '#2a0a14', c: '#ff8a3d' };

const dash: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const p = { x: 110, y: GROUND, vy: 0, duck: false, grounded: true, coyote: 0, buffer: 0 };
  let obs: Ob[] = [];
  let speed = 340, dist = 0, spawnIn = 1.1, t = 0, dead = false, deadT = 0, frame = 0;
  const fx = new Particles(300, 900);

  const spawn = () => {
    const r = api.rnd();
    const lvl = Math.min(dist / 4000, 1);
    if (r < 0.62 - lvl * 0.2) {
      const bw = 24 + api.rndInt(0, 2) * 18, bh = 30 + api.rndInt(0, 2) * 16;
      obs.push({ x: w + 20, y: GROUND - bh, w: bw, h: bh, kind: 'block', phase: 0 });
      if (lvl > 0.4 && api.rnd() < 0.3) obs.push({ x: w + 20 + bw + 26, y: GROUND - 30, w: 24, h: 30, kind: 'block', phase: 0 });
    } else {
      const high = api.rnd() < 0.55; // high drones must be ducked, low ones jumped
      obs.push({ x: w + 20, y: high ? GROUND - 70 : GROUND - 34, w: 40, h: 22, kind: 'drone', phase: api.rnd() * 6 });
    }
    const gap = (0.85 + api.rnd() * 0.9) * (380 / speed) * 1.3;
    spawnIn = Math.max(0.55, gap);
  };

  const box = () => p.duck && p.grounded ? { x: p.x - 18, y: p.y - 26, w: 36, h: 26 } : { x: p.x - 13, y: p.y - 46, w: 26, h: 46 };

  return {
    update(dt) {
      t += dt;
      fx.update(dt);
      if (dead) {
        deadT += dt;
        if (deadT > 1) api.gameOver({ message: `${Math.floor(dist / 10)} m` });
        return;
      }
      speed = Math.min(820, 340 + dist * 0.035);
      dist += speed * dt;
      api.setScore(dist / 10);

      // jump with buffer + coyote time, variable height on release
      if (input.pressed('a') || input.pressed('up') || input.pointer.pressed) p.buffer = 0.12;
      p.buffer -= dt;
      p.coyote = p.grounded ? 0.08 : p.coyote - dt;
      if (p.buffer > 0 && p.coyote > 0) {
        p.vy = JUMP; p.grounded = false; p.coyote = 0; p.buffer = 0; sfx.jump();
        fx.burst(p.x, GROUND, 8, '#ffb47a', 90, 0.35);
      }
      const holding = input.down('a') || input.down('up') || input.pointer.down;
      if (!holding && p.vy < -300) p.vy = -300;
      p.duck = input.down('down');
      p.vy += GRAV * dt * (p.duck && !p.grounded ? 2.2 : 1); // fast-fall when ducking mid-air
      p.y += p.vy * dt;
      if (p.y >= GROUND) { if (!p.grounded) fx.burst(p.x, GROUND, 6, '#ffb47a', 70, 0.3); p.y = GROUND; p.vy = 0; p.grounded = true; }
      if (p.grounded) frame += dt * speed / 40;

      spawnIn -= dt;
      if (spawnIn <= 0) spawn();
      const b = box();
      for (const o of obs) {
        o.x -= speed * dt * (o.kind === 'drone' ? 1.12 : 1);
        o.phase += dt * 8;
        const oy = o.kind === 'drone' ? o.y + Math.sin(o.phase) * 2 : o.y;
        if (b.x < o.x + o.w - 4 && b.x + b.w > o.x + 4 && b.y < oy + o.h - 2 && b.y + b.h > oy + 2) {
          dead = true; sfx.hit(); api.shake(12);
          fx.burst(p.x, p.y - 24, 40, C.orange, 260, 0.9, 3);
        }
      }
      obs = obs.filter(o => o.x > -80);
      if (Math.floor(dist / 1000) !== Math.floor((dist - speed * dt) / 1000)) sfx.coin();
    },

    render(g) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#12030f'); sky.addColorStop(0.7, '#4a0f2c'); sky.addColorStop(1, '#ff6a3d');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      // sun
      g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(w * 0.72, GROUND - 40, 70, Math.PI, 0); g.fill();
      g.fillStyle = '#4a0f2c'; for (let i = 0; i < 5; i++) g.fillRect(w * 0.72 - 70, GROUND - 40 - 10 - i * 12, 140, 3 + i * 0.4);
      // parallax hills
      const layer = (k: number, col: string, amp: number, base: number) => {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) g.lineTo(x, base - Math.abs(Math.sin((x + dist * k) * 0.006)) * amp - Math.sin((x + dist * k) * 0.017) * amp * 0.3);
        g.lineTo(w, h); g.fill();
      };
      layer(0.15, '#2a0820', 60, GROUND - 10);
      layer(0.35, '#1c0518', 40, GROUND);
      // ground
      g.fillStyle = '#12020c'; g.fillRect(0, GROUND, w, h - GROUND);
      g.fillStyle = C.orange; g.fillRect(0, GROUND, w, 2);
      g.fillStyle = 'rgba(255,138,61,0.35)';
      for (let x = -(dist % 40); x < w; x += 40) g.fillRect(x, GROUND + 14, 18, 2);
      for (let x = -((dist * 1.4) % 70); x < w; x += 70) g.fillRect(x, GROUND + 34, 30, 2);

      for (const o of obs) {
        if (o.kind === 'block') {
          g.fillStyle = '#ff2f6d'; g.fillRect(o.x, o.y, o.w, o.h);
          g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(o.x, o.y, o.w, 4);
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(o.x + o.w - 5, o.y, 5, o.h);
        } else {
          const oy = o.y + Math.sin(o.phase) * 2;
          g.fillStyle = '#5ef2ff'; g.fillRect(o.x + 6, oy + 6, o.w - 12, o.h - 10);
          g.fillStyle = '#d6fcff'; g.fillRect(o.x + 14, oy + 9, 6, 6);
          const flap = Math.floor(o.phase) % 2 ? 0 : 4;
          g.fillStyle = 'rgba(94,242,255,0.7)'; g.fillRect(o.x, oy + flap, 12, 3); g.fillRect(o.x + o.w - 12, oy + flap, 12, 3);
        }
      }

      if (!dead || Math.floor(deadT * 12) % 2) {
        const map = p.duck && p.grounded ? DUCK : RUN[p.grounded ? Math.floor(frame) % 2 : 0];
        const s = 6;
        const x0 = p.x - 4 * s, y0 = p.y - 8 * s;
        map.forEach((row, j) => { for (let i = 0; i < 8; i++) { const c = PAL[row[i]]; if (c) { g.fillStyle = c; g.fillRect(x0 + i * s, y0 + j * s, s, s); } } });
      }
      fx.render(g);
      text(g, `${Math.floor(dist / 10)} M`, w - 16, 16, { size: 12, align: 'right', color: C.white });
      text(g, `${Math.round(speed / 3.4)} KM/H`, w - 16, 34, { size: 8, align: 'right', color: C.dim });
      if (t < 2.5) text(g, 'SPACE JUMP · DOWN DUCK', w / 2, 60, { size: 10, align: 'center', color: C.white, alpha: Math.min(1, 2.5 - t) });
    },
  };
};

export default dash;
