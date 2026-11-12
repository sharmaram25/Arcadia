import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Block { x: number; w: number; y: number; hue: number }
interface Chip { x: number; y: number; w: number; vy: number; vx: number; rot: number; vr: number; hue: number }

const BH = 30, BASE_W = 220;

const skystack: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const groundY = h - 90;
  const tower: Block[] = [{ x: (w - BASE_W) / 2, w: BASE_W, y: groundY - BH, hue: 190 }];
  let cur: Block & { dir: number; speed: number } = spawnNext();
  let chips: Chip[] = [];
  let cam = 0, camT = 0, perfect = 0, dead = false, deadT = 0, flash = 0, t = 0;
  const fx = new Particles(300);
  const clouds = Array.from({ length: 14 }, (_, i) => ({ x: api.rnd() * w, y: groundY - 200 - i * 260 - api.rnd() * 120, s: 0.6 + api.rnd() * 0.8 }));

  function spawnNext() {
    const top = tower[tower.length - 1];
    const n = tower.length;
    const fromLeft = n % 2 === 0;
    return { x: fromLeft ? -top.w : w, w: top.w, y: top.y - BH, hue: (190 + n * 9) % 360, dir: fromLeft ? 1 : -1, speed: Math.min(170 + n * 7, 420) };
  }

  const drop = () => {
    const top = tower[tower.length - 1];
    const off = cur.x - top.x;
    if (Math.abs(off) <= 5) {
      // perfect: snap, chain, and occasionally regrow
      cur.x = top.x; perfect++;
      if (perfect >= 3 && cur.w < BASE_W) { cur.w = Math.min(BASE_W, cur.w + 14); cur.x = Math.max(0, cur.x - 7); }
      sfx.note(440 + Math.min(perfect, 8) * 70, 0.15); flash = 0.25;
      fx.burst(cur.x + cur.w / 2, cur.y + BH, 18, '#ffffff', 160, 0.5);
      api.addScore(1 + Math.min(perfect, 5));
    } else {
      perfect = 0;
      const overlap = cur.w - Math.abs(off);
      if (overlap <= 0) {
        chips.push({ x: cur.x, y: cur.y, w: cur.w, vy: 0, vx: cur.dir * 60, rot: 0, vr: cur.dir * 2, hue: cur.hue });
        dead = true; sfx.lose(); api.shake(8);
        return;
      }
      const chipX = off > 0 ? top.x + top.w : cur.x;
      chips.push({ x: chipX, y: cur.y, w: Math.abs(off), vy: -40, vx: Math.sign(off) * 80, rot: 0, vr: Math.sign(off) * 3, hue: cur.hue });
      cur.x = off > 0 ? cur.x : top.x;
      cur.w = overlap;
      sfx.bounce();
      api.addScore(1);
    }
    tower.push({ x: cur.x, w: cur.w, y: cur.y, hue: cur.hue });
    cur = spawnNext();
    camT = Math.max(0, (groundY - BH * 6) - cur.y);
  };

  return {
    update(dt) {
      t += dt;
      fx.update(dt);
      flash = Math.max(0, flash - dt);
      cam += (camT - cam) * Math.min(1, dt * 5);
      for (const c of chips) { c.vy += 1400 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt; }
      chips = chips.filter(c => c.y - cam < h + 200);
      if (dead) { deadT += dt; if (deadT > 1.2) api.gameOver({ message: `${tower.length - 1} floors` }); return; }
      cur.x += cur.dir * cur.speed * dt;
      if (cur.x + cur.w > w + 40 && cur.dir > 0) cur.dir = -1;
      if (cur.x < -40 && cur.dir < 0) cur.dir = 1;
      if (input.action()) drop();
    },

    render(g) {
      const alt = Math.min(1, cam / 4000);
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, `hsl(${215 + alt * 40}, 70%, ${38 - alt * 30}%)`);
      sky.addColorStop(1, `hsl(${200 + alt * 50}, 80%, ${70 - alt * 50}%)`);
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      if (alt > 0.3) { g.fillStyle = `rgba(255,255,255,${(alt - 0.3) * 0.9})`; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % w, (i * 61) % h, 1, 1); }

      g.save(); g.translate(0, cam);
      for (const c of clouds) {
        const s = 10 * c.s;
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.fillRect(c.x, c.y, s * 8, s); g.fillRect(c.x + s, c.y - s, s * 5, s); g.fillRect(c.x - s, c.y + s, s * 10, s);
      }
      // ground
      g.fillStyle = '#16324f'; g.fillRect(0, groundY, w, 400);
      g.fillStyle = '#5ef2ff'; g.fillRect(0, groundY, w, 3);
      const blk = (b: { x: number; y: number; w: number; hue: number }) => {
        g.fillStyle = `hsl(${b.hue}, 85%, 60%)`; g.fillRect(b.x, b.y, b.w, BH);
        g.fillStyle = `hsl(${b.hue}, 90%, 78%)`; g.fillRect(b.x, b.y, b.w, 5);
        g.fillStyle = `hsl(${b.hue}, 70%, 40%)`; g.fillRect(b.x, b.y + BH - 5, b.w, 5);
      };
      for (const b of tower) if (b.y + cam > -BH && b.y + cam < h + BH) blk(b);
      if (!dead) {
        blk(cur);
        g.fillStyle = 'rgba(255,255,255,0.12)';
        const top = tower[tower.length - 1];
        g.fillRect(top.x, cur.y + BH, top.w, 2);
      }
      for (const c of chips) {
        g.save(); g.translate(c.x + c.w / 2, c.y + BH / 2); g.rotate(c.rot);
        g.fillStyle = `hsl(${c.hue}, 85%, 55%)`; g.fillRect(-c.w / 2, -BH / 2, c.w, BH);
        g.restore();
      }
      fx.render(g);
      g.restore();

      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 0.5})`; g.fillRect(0, 0, w, h); }
      text(g, tower.length - 1, w / 2, 40, { size: 40, align: 'center', color: '#fff' });
      if (perfect >= 2) text(g, `PERFECT x${perfect}`, w / 2, 92, { size: 11, align: 'center', color: C.yellow });
      if (t < 2.5) text(g, 'TAP / SPACE TO DROP', w / 2, h - 50, { size: 10, align: 'center', color: '#fff', alpha: Math.min(1, 2.5 - t) });
    },
  };
};

export default skystack;
