import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Wall { d: number; t: number; sides: number } // sides: 6-bit mask of occupied sectors

const SEC = Math.PI / 3, PR = 64, CORE = 40;

const hexspin: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const cx = w / 2, cy = h / 2;
  let walls: Wall[] = [];
  let ang = -Math.PI / 2, rot = 0, rotSpeed = 1.2, flipIn = 6, wallSpeed = 230;
  let nextAt = 0, t = 0, dead = false, deadT = 0, beat = 0, lastSec = 0;
  const fx = new Particles(200);

  const push = (mask: number, gap: number, thick = 22) => { walls.push({ d: 460 + nextAt, t: thick, sides: mask & 63 }); nextAt += gap; };
  const pattern = () => {
    const r = api.rnd(), s = api.rndInt(0, 5), lv = Math.min(t / 60, 1);
    const one = (k: number) => 1 << ((k % 6 + 6) % 6);
    if (r < 0.35) push(63 & ~one(s), 150 - lv * 30);                                // single gap
    else if (r < 0.55) { for (let i = 0; i < 3; i++) push(i % 2 ? 0b010101 : 0b101010, 110 - lv * 20); } // alternating
    else if (r < 0.75) { for (let i = 0; i < 5; i++) push(63 & ~(one(s + i) | one(s + i + 1)), 62, 20); } // spiral
    else if (r < 0.9) { push(63 & ~one(s) & ~one(s + 3), 120); push(63 & ~one(s + 1) & ~one(s + 4), 140 - lv * 30); } // twin gaps
    else { for (let i = 0; i < 4; i++) push(one(s + i * 2) | one(s + i * 2 + 1) | one(s + i * 2 + 2), 90); } // whirl
    nextAt += 60;
  };

  const sectorOf = (a: number) => { const x = ((a - rot) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2); return Math.floor(x / SEC); };
  const blockedAt = (sec: number, rIn: number, rOut: number) => walls.some(wl => (wl.sides >> sec) & 1 && wl.d < rOut && wl.d + wl.t > rIn);

  return {
    update(dt) {
      fx.update(dt);
      if (dead) { deadT += dt; rot += rotSpeed * dt * 0.2; if (deadT > 1.3) api.gameOver({ message: `${t.toFixed(2)} seconds` }); return; }
      t += dt; beat += dt;
      api.setScore(Math.floor(t));
      if (Math.floor(t) !== lastSec) { lastSec = Math.floor(t); if (lastSec % 10 === 0 && lastSec) sfx.power(); else sfx.tick(); }

      wallSpeed = 230 + Math.min(t * 3, 170);
      flipIn -= dt;
      if (flipIn <= 0) { rotSpeed = -Math.sign(rotSpeed) * (1 + api.rnd() * 1.2 + Math.min(t / 40, 1.4)); flipIn = 3 + api.rnd() * 5; }
      rot += rotSpeed * dt;

      // move, but never slide sideways into a wall
      const dir = input.axisX();
      if (dir) {
        const na = ang + dir * 9.2 * dt;
        const from = sectorOf(ang), to = sectorOf(na);
        if (from === to || !blockedAt(to, PR - 6, PR + 6)) ang = na;
      }
      ang += rotSpeed * dt; // player rides the world rotation

      nextAt -= wallSpeed * dt;
      for (const wl of walls) wl.d -= wallSpeed * dt;
      walls = walls.filter(wl => wl.d + wl.t > CORE);
      if (nextAt < 300) pattern();

      if (blockedAt(sectorOf(ang), PR - 2, PR + 8)) {
        dead = true; sfx.boom(); api.shake(16);
        fx.burst(cx + Math.cos(ang) * PR, cy + Math.sin(ang) * PR, 40, C.white, 240, 0.9, 3);
      }
    },

    render(g) {
      const pulse = 1 + Math.max(0, Math.sin(beat * Math.PI * 2.2)) * 0.04;
      const hue = (t * 6) % 360;
      const c1 = `hsl(${hue}, 70%, 9%)`, c2 = `hsl(${hue}, 70%, 13%)`, wc = `hsl(${hue + 350}, 90%, 62%)`;
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(pulse, pulse);
      // slices
      for (let k = 0; k < 6; k++) {
        g.fillStyle = k % 2 ? c1 : c2;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k * SEC) * 900, Math.sin(k * SEC) * 900); g.lineTo(Math.cos((k + 1) * SEC) * 900, Math.sin((k + 1) * SEC) * 900); g.fill();
      }
      // walls as hexagon trapezoids
      g.fillStyle = wc;
      for (const wl of walls) {
        const r0 = Math.max(CORE, wl.d), r1 = wl.d + wl.t;
        for (let k = 0; k < 6; k++) {
          if (!((wl.sides >> k) & 1)) continue;
          const a0 = k * SEC, a1 = (k + 1) * SEC;
          g.beginPath();
          g.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); g.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0);
          g.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1); g.lineTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
          g.closePath(); g.fill();
        }
      }
      // core
      g.strokeStyle = wc; g.lineWidth = 4; g.fillStyle = c1;
      g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(Math.cos(k * SEC) * CORE, Math.sin(k * SEC) * CORE); g.fill(); g.stroke();
      g.restore();

      // player
      if (!dead || Math.floor(deadT * 10) % 2) {
        const px = cx + Math.cos(ang) * PR * pulse, py = cy + Math.sin(ang) * PR * pulse;
        g.save(); g.translate(px, py); g.rotate(ang);
        g.fillStyle = '#fff'; g.beginPath(); g.moveTo(9, 0); g.lineTo(-5, -7); g.lineTo(-5, 7); g.closePath(); g.fill();
        g.restore();
      }
      fx.render(g);

      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(w - 128, 0, 128, 40);
      text(g, t.toFixed(2), w - 14, 13, { size: 14, align: 'right', color: '#fff' });
      const lvl = t < 10 ? 'WARM-UP' : t < 20 ? 'STEADY' : t < 30 ? 'QUICK' : t < 45 ? 'FRENZY' : t < 60 ? 'OVERDRIVE' : 'BEYOND';
      text(g, lvl, 14, 14, { size: 10, color: '#fff' });
    },
  };
};

export default hexspin;
