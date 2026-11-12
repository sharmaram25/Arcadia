import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Rock { x: number; y: number; vx: number; vy: number; r: number; size: 1 | 2 | 3; rot: number; vr: number; shape: number[] }
interface Shot { x: number; y: number; vx: number; vy: number; life: number }

const TAU = Math.PI * 2;

const asteroids: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const ship = { x: w / 2, y: h / 2, vx: 0, vy: 0, a: -Math.PI / 2, inv: 2, alive: true, respawn: 0 };
  let rocks: Rock[] = [], shots: Shot[] = [];
  let lives = 3, wave = 0, cool = 0, nextLife = 10000, over = false, overT = 0, thrustT = 0, waveT = 0;
  const fx = new Particles(500);
  const stars = Array.from({ length: 90 }, () => [api.rnd() * w, api.rnd() * h, api.rnd()]);

  const mkRock = (x: number, y: number, size: 1 | 2 | 3): Rock => {
    const sp = (40 + api.rnd() * 50) * (4 - size) * 0.55 + wave * 4;
    const a = api.rnd() * TAU;
    const shape = Array.from({ length: 11 }, () => 0.72 + api.rnd() * 0.32);
    return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: size * 15 + 4, size, rot: 0, vr: (api.rnd() - 0.5) * 1.6, shape };
  };
  const startWave = () => {
    wave++;
    const n = Math.min(3 + wave, 11);
    for (let i = 0; i < n; i++) {
      let x, y;
      do { x = api.rnd() * w; y = api.rnd() * h; } while (Math.hypot(x - ship.x, y - ship.y) < 180);
      rocks.push(mkRock(x, y, 3));
    }
    waveT = 2;
  };
  startWave();

  const wrap = (o: { x: number; y: number }, m = 0) => {
    if (o.x < -m) o.x += w + m * 2; else if (o.x > w + m) o.x -= w + m * 2;
    if (o.y < -m) o.y += h + m * 2; else if (o.y > h + m) o.y -= h + m * 2;
  };

  const killShip = () => {
    ship.alive = false; ship.respawn = 2; lives--;
    sfx.boom(); api.shake(14);
    fx.burst(ship.x, ship.y, 50, C.white, 240, 1.2, 2);
    if (lives <= 0) over = true;
  };

  const vec = (g: CanvasRenderingContext2D, color: string, width: number, path: () => void) => {
    g.strokeStyle = color; g.lineJoin = 'round'; g.lineCap = 'round';
    g.globalAlpha = 0.25; g.lineWidth = width * 3; path(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = width; path(); g.stroke();
  };

  return {
    update(dt) {
      fx.update(dt);
      waveT = Math.max(0, waveT - dt);
      for (const r of rocks) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r, r.r); }
      for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; wrap(s); }
      shots = shots.filter(s => s.life > 0);

      if (over) { overT += dt; if (overT > 1.5) api.gameOver({ message: `Wave ${wave}` }); return; }

      if (!ship.alive) {
        ship.respawn -= dt;
        // respawn only when the centre is clear
        if (ship.respawn <= 0 && rocks.every(r => Math.hypot(r.x - w / 2, r.y - h / 2) > r.r + 80)) {
          Object.assign(ship, { x: w / 2, y: h / 2, vx: 0, vy: 0, a: -Math.PI / 2, inv: 2.5, alive: true });
        }
      } else {
        ship.inv = Math.max(0, ship.inv - dt);
        ship.a += input.axisX() * 4.6 * dt;
        const thrust = input.down('up');
        if (thrust) {
          ship.vx += Math.cos(ship.a) * 330 * dt; ship.vy += Math.sin(ship.a) * 330 * dt;
          thrustT += dt;
          if (Math.random() < 0.6) fx.burst(ship.x - Math.cos(ship.a) * 12, ship.y - Math.sin(ship.a) * 12, 1, C.orange, 60, 0.3);
        }
        const drag = Math.pow(0.55, dt);
        ship.vx *= drag; ship.vy *= drag;
        const sp = Math.hypot(ship.vx, ship.vy);
        if (sp > 420) { ship.vx *= 420 / sp; ship.vy *= 420 / sp; }
        ship.x += ship.vx * dt; ship.y += ship.vy * dt; wrap(ship);

        cool -= dt;
        if (input.down('a') && cool <= 0 && shots.length < 6) {
          shots.push({ x: ship.x + Math.cos(ship.a) * 14, y: ship.y + Math.sin(ship.a) * 14, vx: ship.vx + Math.cos(ship.a) * 560, vy: ship.vy + Math.sin(ship.a) * 560, life: 0.9 });
          cool = 0.17; sfx.shoot();
        }
        if (input.pressed('b')) { // hyperspace: risky escape
          fx.burst(ship.x, ship.y, 20, C.cyan, 120, 0.4);
          ship.x = api.rnd() * w; ship.y = api.rnd() * h; ship.vx = ship.vy = 0;
          sfx.power();
          if (api.rnd() < 0.12) killShip();
        }
        if (ship.alive && ship.inv <= 0) {
          for (const r of rocks) if (Math.hypot(r.x - ship.x, r.y - ship.y) < r.r + 9) { killShip(); break; }
        }
      }

      // shots vs rocks
      const born: Rock[] = [];
      for (const s of shots) {
        for (const r of rocks) {
          if (r.size && Math.hypot(r.x - s.x, r.y - s.y) < r.r) {
            s.life = 0;
            api.addScore([0, 100, 50, 20][r.size]);
            fx.burst(r.x, r.y, 10 + r.size * 6, C.purple, 150, 0.7, 2);
            sfx.hit(); api.shake(r.size * 2);
            if (r.size > 1) for (let k = 0; k < 2; k++) born.push(mkRock(r.x, r.y, (r.size - 1) as 1 | 2));
            r.size = 0 as 1;
            break;
          }
        }
      }
      rocks = rocks.filter(r => r.size).concat(born);
      if (api.score >= nextLife) { lives++; nextLife += 10000; sfx.power(); }
      if (!rocks.length) startWave();
    },

    render(g) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (const [x, y, b] of stars) { g.fillStyle = `rgba(255,255,255,${0.15 + b * 0.4})`; g.fillRect(x, y, 1, 1); }

      for (const r of rocks) {
        vec(g, '#c4b5fd', 2, () => {
          g.beginPath();
          r.shape.forEach((d, i) => {
            const a = r.rot + (i / r.shape.length) * TAU;
            const x = r.x + Math.cos(a) * r.r * d, y = r.y + Math.sin(a) * r.r * d;
            if (i) g.lineTo(x, y); else g.moveTo(x, y);
          });
          g.closePath();
        });
      }
      g.fillStyle = '#fff';
      for (const s of shots) g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);

      if (ship.alive && (ship.inv <= 0 || Math.floor(ship.inv * 10) % 2 === 0)) {
        const { x, y, a } = ship;
        const pt = (ang: number, d: number) => [x + Math.cos(a + ang) * d, y + Math.sin(a + ang) * d] as const;
        vec(g, '#ffffff', 2, () => {
          const [x1, y1] = pt(0, 16), [x2, y2] = pt(2.5, 13), [x3, y3] = pt(Math.PI, 6), [x4, y4] = pt(-2.5, 13);
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath();
        });
        if (input.down('up') && Math.floor(thrustT * 30) % 2 === 0) {
          vec(g, C.orange, 2, () => { const [a1, b1] = pt(2.8, 9), [a2, b2] = pt(Math.PI, 20), [a3, b3] = pt(-2.8, 9); g.beginPath(); g.moveTo(a1, b1); g.lineTo(a2, b2); g.lineTo(a3, b3); });
        }
      }
      fx.render(g);

      for (let i = 0; i < lives; i++) {
        const x = 24 + i * 22, y = 24;
        vec(g, '#ffffff', 1.5, () => { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 7, y + 7); g.lineTo(x, y + 3); g.lineTo(x - 7, y + 7); g.closePath(); });
      }
      text(g, `WAVE ${wave}`, w - 16, 16, { size: 10, color: C.dim, align: 'right' });
      if (waveT > 0) text(g, `WAVE ${wave}`, w / 2, h / 2 - 60, { size: 18, color: C.purple, align: 'center', alpha: Math.min(1, waveT) });
      if (!ship.alive && !over) text(g, 'STAND BY', w / 2, h / 2, { size: 12, color: C.dim, align: 'center' });
    },
  };
};

export default asteroids;
