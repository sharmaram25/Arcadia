import type { GameFactory } from '../core/types';
import { C, Particles, clear, makeBackdrop, text } from '../core/draw';

const N = 30;      // grid cells per side
const S = 20;      // cell size (600 / 30)
type P = { x: number; y: number };

const snake: GameFactory = (api) => {
  const { input, sfx } = api;
  let body: P[] = [{ x: 12, y: 15 }, { x: 11, y: 15 }, { x: 10, y: 15 }];
  let prev: P[] = body.map(p => ({ ...p }));
  let dir: P = { x: 1, y: 0 };
  const queue: P[] = []; // buffered turns: two quick taps both register
  let acc = 0;
  let speed = 7.5;   // cells / second
  let grow = 0;
  let dead = false, deadT = 0, eaten = 0;
  let bonus: (P & { t: number }) | null = null;
  let pulse = 0;
  const fx = new Particles(300);

  const free = (p: P) => !body.some(b => b.x === p.x && b.y === p.y);
  const spawn = (): P => {
    for (let i = 0; i < 500; i++) {
      const p = { x: api.rndInt(1, N - 2), y: api.rndInt(1, N - 2) };
      if (free(p) && !(bonus && bonus.x === p.x && bonus.y === p.y)) return p;
    }
    return { x: 1, y: 1 };
  };
  let food = spawn();

  const bg = makeBackdrop(api.w, api.h, g => {
    clear(g, api.w, api.h, '#06090a');
    g.fillStyle = '#0f1a16';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) g.fillRect(x * S + S / 2 - 1, y * S + S / 2 - 1, 2, 2);
    g.strokeStyle = '#1b3a2c'; g.lineWidth = 2;
    g.strokeRect(1, 1, api.w - 2, api.h - 2);
  });

  const turn = (x: number, y: number) => {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if ((last.x === -x && last.y === -y) || (last.x === x && last.y === y)) return;
    if (queue.length < 2) queue.push({ x, y });
  };

  const die = () => {
    dead = true;
    sfx.hit();
    api.shake(10);
    const h = body[0];
    fx.burst(h.x * S + S / 2, h.y * S + S / 2, 40, C.green, 220, 0.8, 3);
  };

  const step = () => {
    if (queue.length) dir = queue.shift()!;
    const h = body[0];
    const nh = { x: h.x + dir.x, y: h.y + dir.y };
    if (nh.x < 0 || nh.y < 0 || nh.x >= N || nh.y >= N) { die(); return; }
    const tailMoves = grow === 0;
    for (let i = 0; i < body.length - (tailMoves ? 1 : 0); i++) {
      if (body[i].x === nh.x && body[i].y === nh.y) { die(); return; }
    }
    const old = body;
    body = [nh, ...old];
    if (grow > 0) grow--; else body.pop();
    // Segment i now sits where segment i-1 was; it visually travels from old[i].
    // A freshly grown tail segment has no old position, so it stays put.
    prev = body.map((_, i) => (i === 0 ? { ...h } : { ...(old[i] ?? old[old.length - 1]) }));

    if (nh.x === food.x && nh.y === food.y) {
      eaten++;
      grow += 2;
      api.addScore(10 + Math.floor(body.length / 8) * 5);
      speed = Math.min(17, speed + 0.22);
      sfx.coin();
      fx.burst(nh.x * S + S / 2, nh.y * S + S / 2, 14, C.yellow, 140, 0.5);
      food = spawn();
      if (!bonus && eaten % 5 === 0) bonus = { ...spawn(), t: 6 };
    }
    if (bonus && nh.x === bonus.x && nh.y === bonus.y) {
      api.addScore(50 + Math.ceil(bonus.t) * 10);
      grow += 1;
      sfx.power();
      fx.burst(nh.x * S + S / 2, nh.y * S + S / 2, 26, C.purple, 200, 0.7);
      bonus = null;
    }
  };

  return {
    update(dt) {
      fx.update(dt);
      pulse += dt;
      if (dead) {
        deadT += dt;
        if (deadT > 0.8) api.gameOver({ message: `Length ${body.length}` });
        return;
      }
      if (input.pressed('left')) turn(-1, 0);
      if (input.pressed('right')) turn(1, 0);
      if (input.pressed('up')) turn(0, -1);
      if (input.pressed('down')) turn(0, 1);
      if (bonus && (bonus.t -= dt) <= 0) bonus = null;
      acc += dt * speed;
      while (acc >= 1 && !dead) { acc -= 1; step(); }
    },

    render(g) {
      bg(g);
      const t = dead ? 1 : Math.min(acc, 1);

      // food
      const fp = 1 + Math.sin(pulse * 6) * 0.12;
      const fx0 = food.x * S + S / 2, fy0 = food.y * S + S / 2;
      g.fillStyle = C.yellow; g.globalAlpha = 0.18;
      g.fillRect(fx0 - 11 * fp, fy0 - 11 * fp, 22 * fp, 22 * fp);
      g.globalAlpha = 1;
      g.fillRect(fx0 - 6 * fp, fy0 - 6 * fp, 12 * fp, 12 * fp);

      if (bonus && (bonus.t > 1.5 || Math.floor(bonus.t * 8) % 2 === 0)) {
        const bx = bonus.x * S + S / 2, by = bonus.y * S + S / 2;
        g.fillStyle = C.purple;
        g.beginPath(); g.moveTo(bx, by - 9); g.lineTo(bx + 9, by); g.lineTo(bx, by + 9); g.lineTo(bx - 9, by); g.closePath(); g.fill();
      }

      // body as one smooth polyline through interpolated segment centres
      const pts: number[] = [];
      for (let i = 0; i < body.length; i++) {
        const a = prev[i] ?? body[i], b = body[i];
        pts.push((a.x + (b.x - a.x) * t) * S + S / 2, (a.y + (b.y - a.y) * t) * S + S / 2);
      }
      g.lineJoin = 'round'; g.lineCap = 'round';
      const path = () => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); };
      const col = dead ? (Math.floor(deadT * 10) % 2 ? C.red : C.green) : C.green;
      g.strokeStyle = col; g.globalAlpha = 0.16; g.lineWidth = 22; path(); g.stroke();
      g.globalAlpha = 1; g.lineWidth = 14; path(); g.stroke();
      g.strokeStyle = '#b8ffd2'; g.lineWidth = 3; g.globalAlpha = 0.5; path(); g.stroke(); g.globalAlpha = 1;

      // head + eyes facing travel direction
      const hx = pts[0], hy = pts[1];
      g.fillStyle = '#d8ffe6';
      g.beginPath(); g.arc(hx, hy, 8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#06110b';
      const ex = dir.y !== 0 ? 3.5 : 0, ey = dir.x !== 0 ? 3.5 : 0;
      g.fillRect(hx + dir.x * 3 - ex - 1.5, hy + dir.y * 3 - ey - 1.5, 3, 3);
      g.fillRect(hx + dir.x * 3 + ex - 1.5, hy + dir.y * 3 + ey - 1.5, 3, 3);

      fx.render(g);
      text(g, `LEN ${body.length}`, 12, 12, { size: 10, color: C.dim });
      text(g, `${speed.toFixed(1)} C/S`, api.w - 12, 12, { size: 10, color: C.dim, align: 'right' });
    },
  };
};

export default snake;
