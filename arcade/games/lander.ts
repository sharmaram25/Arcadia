import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Pad { x0: number; x1: number; y: number; mult: number }

const G = 46, THRUST = 120, ROT = 2.6;

const lander: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  let terrain: [number, number][] = [], pads: Pad[] = [];
  const s = { x: 120, y: 80, vx: 50, vy: 0, a: 0 };
  let fuel = 1000, level = 1, state: 'fly' | 'landed' | 'crashed' = 'fly', stateT = 0, msg = '', over = false;
  const fx = new Particles(400, 60);
  const stars = Array.from({ length: 120 }, () => [api.rnd() * w, api.rnd() * h * 0.7]);

  const build = () => {
    terrain = []; pads = [];
    const padSpots = new Set<number>();
    const segs = 28, step = w / segs;
    while (padSpots.size < 3) padSpots.add(api.rndInt(3, segs - 3));
    let y = 430 + api.rnd() * 60;
    const mults = [2, 3, 5].sort(() => api.rnd() - 0.5);
    let pi = 0;
    for (let i = 0; i <= segs; i++) {
      const x = i * step;
      if (padSpots.has(i)) {
        const m = mults[pi++];
        const pw = m === 5 ? step * 0.9 : m === 3 ? step * 1.4 : step * 2;
        y = Math.min(540, Math.max(300, y));
        terrain.push([x, y]); terrain.push([x + pw, y]);
        pads.push({ x0: x, x1: x + pw, y, mult: m });
        i += Math.ceil(pw / step) - 1;
      } else {
        y += (api.rnd() - 0.5) * 120 * (1 + level * 0.1);
        y = Math.min(570, Math.max(250, y));
        terrain.push([x, y]);
      }
    }
    terrain.push([w, y]);
    Object.assign(s, { x: 100 + api.rnd() * 200, y: 70, vx: 40 + api.rnd() * 40, vy: 0, a: 0 });
  };
  build();

  const groundAt = (x: number) => {
    for (let i = 1; i < terrain.length; i++) {
      const [x0, y0] = terrain[i - 1], [x1, y1] = terrain[i];
      if (x >= x0 && x <= x1) return y0 + (y1 - y0) * ((x - x0) / Math.max(1e-6, x1 - x0));
    }
    return h;
  };

  return {
    update(dt) {
      fx.update(dt);
      if (state !== 'fly') {
        stateT += dt;
        if (stateT > 2.4) {
          if (over) { api.gameOver({ message: `Reached level ${level}` }); return; }
          if (state === 'landed') level++;
          build(); state = 'fly'; stateT = 0;
        }
        return;
      }
      s.a += input.axisX() * ROT * dt;
      s.a = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.a));
      const burn = (input.down('up') || input.down('a')) && fuel > 0;
      if (burn) {
        s.vx += Math.sin(s.a) * THRUST * dt; s.vy -= Math.cos(s.a) * THRUST * dt;
        fuel = Math.max(0, fuel - 55 * dt);
        if (Math.random() < 0.7) fx.burst(s.x - Math.sin(s.a) * 14, s.y + Math.cos(s.a) * 14, 1, Math.random() < 0.5 ? C.orange : C.yellow, 70, 0.35);
      }
      s.vy += G * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < 0) s.x += w; if (s.x > w) s.x -= w;

      const feet = s.y + 14;
      if (feet >= groundAt(s.x - 10) || feet >= groundAt(s.x + 10)) {
        const pad = pads.find(p => s.x - 10 >= p.x0 && s.x + 10 <= p.x1);
        const soft = Math.abs(s.vy) < 38 && Math.abs(s.vx) < 26 && Math.abs(s.a) < 0.22;
        if (pad && soft) {
          state = 'landed';
          const pts = Math.round((50 + (38 - Math.abs(s.vy)) * 3) * pad.mult);
          api.addScore(pts); fuel = Math.min(1000, fuel + 150);
          msg = Math.abs(s.vy) < 12 ? `PERFECT LANDING  +${pts}` : `GOOD LANDING  +${pts}`;
          sfx.win(); s.y = pad.y - 14; s.vx = s.vy = 0; s.a = 0;
        } else {
          state = 'crashed'; fuel = Math.max(0, fuel - 250);
          msg = pad ? 'TOO FAST' : 'CRASHED';
          sfx.boom(); api.shake(14);
          fx.burst(s.x, s.y, 60, C.white, 220, 1.2, 2);
          if (fuel <= 0) { over = true; msg = 'OUT OF FUEL'; }
        }
        stateT = 0;
      }
      if (fuel <= 0 && s.y > h + 40) { state = 'crashed'; over = true; msg = 'LOST IN SPACE'; }
    },

    render(g) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (const [x, y] of stars) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x, y, 1, 1); }
      // terrain (vector)
      g.fillStyle = '#05060b'; g.beginPath(); g.moveTo(0, h); terrain.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(w, h); g.fill();
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(242,244,255,0.25)'; g.lineWidth = 5; g.beginPath(); terrain.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.strokeStyle = '#f2f4ff'; g.lineWidth = 1.5; g.stroke();
      for (const p of pads) {
        g.strokeStyle = C.green; g.lineWidth = 4; g.beginPath(); g.moveTo(p.x0, p.y); g.lineTo(p.x1, p.y); g.stroke();
        text(g, `x${p.mult}`, (p.x0 + p.x1) / 2, p.y + 10, { size: 9, align: 'center', color: C.green });
      }
      // lander
      if (state !== 'crashed') {
        g.save(); g.translate(s.x, s.y); g.rotate(s.a);
        g.strokeStyle = '#ffffff'; g.lineWidth = 1.6;
        g.beginPath();
        g.rect(-8, -14, 16, 11);
        g.moveTo(-11, -3); g.lineTo(11, -3); g.lineTo(8, 4); g.lineTo(-8, 4); g.closePath();
        g.moveTo(-6, 4); g.lineTo(-12, 14); g.moveTo(6, 4); g.lineTo(12, 14);
        g.moveTo(-15, 14); g.lineTo(-9, 14); g.moveTo(9, 14); g.lineTo(15, 14);
        g.stroke();
        if ((input.down('up') || input.down('a')) && fuel > 0 && state === 'fly') {
          g.strokeStyle = C.orange; g.beginPath(); g.moveTo(-4, 5); g.lineTo(0, 12 + Math.random() * 10); g.lineTo(4, 5); g.stroke();
        }
        g.restore();
      }
      fx.render(g);

      // telemetry
      const alt = Math.max(0, Math.round(groundAt(s.x) - s.y - 14));
      const okV = Math.abs(s.vy) < 38, okH = Math.abs(s.vx) < 26, okA = Math.abs(s.a) < 0.22;
      const row = (label: string, val: string, ok: boolean | null, y: number) => {
        text(g, label, 16, y, { size: 8, color: C.dim });
        text(g, val, 130, y, { size: 9, color: ok === null ? C.white : ok ? C.green : C.red, align: 'right' });
      };
      row('ALTITUDE', String(alt), null, 16);
      row('H-SPEED', s.vx.toFixed(0), okH, 32);
      row('V-SPEED', s.vy.toFixed(0), okV, 48);
      row('ANGLE', `${Math.round(s.a * 57.3)}°`, okA, 64);
      text(g, 'FUEL', w - 16, 16, { size: 8, color: C.dim, align: 'right' });
      g.fillStyle = '#1a1d29'; g.fillRect(w - 156, 30, 140, 8);
      g.fillStyle = fuel < 200 ? C.red : fuel < 450 ? C.yellow : C.green; g.fillRect(w - 156, 30, 140 * fuel / 1000, 8);
      text(g, `LEVEL ${level}`, w / 2, 16, { size: 9, color: C.dim, align: 'center' });
      if (state !== 'fly') text(g, msg, w / 2, 180, { size: 16, align: 'center', color: state === 'landed' ? C.green : C.red });
    },
  };
};

export default lander;
