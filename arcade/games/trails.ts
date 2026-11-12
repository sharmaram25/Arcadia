import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

const CS = 8, GW = 80, GH = 60;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const; // R D L U
const BIKE_COL = ['#5ef2ff', '#ff8a3d', '#ff4fa3', '#ffd23f'];

interface Bike { x: number; y: number; d: number; alive: boolean; col: string; ai: boolean; aggro: number }

const trails: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const grid = new Uint8Array(GW * GH); // 0 empty, 1..4 bike trail
  let bikes: Bike[] = [];
  let round = 0, count = 0, acc = 0, rate = 13, phase: 'count' | 'ride' | 'roundEnd' | 'over' = 'count', phaseT = 0, queued = -1, won = 0;
  const fx = new Particles(400);

  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= GW || y >= GH ? 9 : grid[y * GW + x]);
  const newRound = () => {
    round++; grid.fill(0);
    bikes = [
      { x: 10, y: GH / 2, d: 0, alive: true, col: BIKE_COL[0], ai: false, aggro: 0 },
      { x: GW - 11, y: GH / 2, d: 2, alive: true, col: BIKE_COL[1], ai: true, aggro: 0.2 + round * 0.05 },
      { x: GW / 2, y: 8, d: 1, alive: true, col: BIKE_COL[2], ai: true, aggro: 0.1 + round * 0.05 },
      { x: GW / 2, y: GH - 9, d: 3, alive: true, col: BIKE_COL[3], ai: true, aggro: 0.3 + round * 0.05 },
    ];
    bikes.forEach((b, i) => { grid[b.y * GW + b.x] = i + 1; });
    rate = Math.min(20, 12 + round);
    phase = 'count'; phaseT = 0; count = 3; queued = -1;
  };
  newRound();

  const space = (sx: number, sy: number, cap = 260) => {
    if (at(sx, sy)) return 0;
    const seen = new Set<number>([sy * GW + sx]);
    const q = [sx, sy];
    let n = 0;
    while (q.length && n < cap) {
      const y = q.pop()!, x = q.pop()!;
      n++;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = ny * GW + nx;
        if (!at(nx, ny) && !seen.has(k)) { seen.add(k); q.push(nx, ny); }
      }
    }
    return n;
  };

  const think = (b: Bike) => {
    const p = bikes[0];
    let best = b.d, bestScore = -1;
    for (const turn of [0, 1, 3]) {
      const d = (b.d + turn) % 4;
      const nx = b.x + DIRS[d][0], ny = b.y + DIRS[d][1];
      if (at(nx, ny)) continue;
      let sc = space(nx, ny) + (turn === 0 ? 6 : 0);
      if (p.alive && api.rnd() < b.aggro) { // cut the player off
        const dist = Math.abs(nx + DIRS[d][0] * 6 - (p.x + DIRS[p.d][0] * 6)) + Math.abs(ny + DIRS[d][1] * 6 - (p.y + DIRS[p.d][1] * 6));
        sc += Math.max(0, 40 - dist) * 2;
      }
      sc += api.rnd() * 4;
      if (sc > bestScore) { bestScore = sc; best = d; }
    }
    b.d = best;
  };

  const step = () => {
    if (queued >= 0) { const p = bikes[0]; if ((queued + 2) % 4 !== p.d) p.d = queued; queued = -1; }
    bikes.forEach(b => { if (b.alive && b.ai) think(b); });
    const heads = bikes.map(b => (b.alive ? [b.x + DIRS[b.d][0], b.y + DIRS[b.d][1]] : null));
    bikes.forEach((b, i) => {
      if (!b.alive) return;
      const [nx, ny] = heads[i]!;
      const headOn = heads.some((o, j) => j !== i && o && o[0] === nx && o[1] === ny);
      if (at(nx, ny) || headOn) {
        b.alive = false;
        fx.burst(b.x * CS + 4, b.y * CS + 4, 40, b.col, 220, 0.9, 3);
        sfx.boom(); api.shake(i === 0 ? 14 : 6);
        return;
      }
      b.x = nx; b.y = ny; grid[ny * GW + nx] = i + 1;
    });
    const p = bikes[0];
    if (!p.alive) { phase = 'over'; phaseT = 0; sfx.lose(); return; }
    if (bikes.every((b, i) => i === 0 || !b.alive)) { won++; api.setScore(won); phase = 'roundEnd'; phaseT = 0; sfx.win(); }
  };

  return {
    update(dt) {
      fx.update(dt);
      phaseT += dt;
      // buffer the latest turn so taps between steps are never lost
      if (input.pressed('right')) queued = 0;
      if (input.pressed('down')) queued = 1;
      if (input.pressed('left')) queued = 2;
      if (input.pressed('up')) queued = 3;
      if (phase === 'count') {
        const c = 3 - Math.floor(phaseT / 0.6);
        if (c !== count) { count = c; if (c > 0) sfx.tick(); else sfx.select(); }
        if (phaseT >= 1.8) { phase = 'ride'; acc = 0; }
        return;
      }
      if (phase === 'roundEnd') { if (phaseT > 1.6) newRound(); return; }
      if (phase === 'over') { if (phaseT > 1.4) api.gameOver({ message: `${won} rounds won` }); return; }
      acc += dt * rate;
      while (acc >= 1 && phase === 'ride') { acc -= 1; step(); }
    },

    render(g) {
      g.fillStyle = '#000208'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#06202c'; g.lineWidth = 1;
      g.beginPath();
      for (let x = 0; x <= GW; x += 5) { g.moveTo(x * CS + 0.5, 0); g.lineTo(x * CS + 0.5, h); }
      for (let y = 0; y <= GH; y += 5) { g.moveTo(0, y * CS + 0.5); g.lineTo(w, y * CS + 0.5); }
      g.stroke();
      for (let i = 0; i < grid.length; i++) {
        const v = grid[i];
        if (!v) continue;
        g.fillStyle = BIKE_COL[v - 1];
        g.globalAlpha = bikes[v - 1].alive ? 0.85 : 0.3;
        g.fillRect((i % GW) * CS + 1, Math.floor(i / GW) * CS + 1, CS - 2, CS - 2);
      }
      g.globalAlpha = 1;
      for (const b of bikes) {
        if (!b.alive) continue;
        g.fillStyle = b.col; g.globalAlpha = 0.3; g.fillRect(b.x * CS - 6, b.y * CS - 6, CS + 12, CS + 12);
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(b.x * CS, b.y * CS, CS, CS);
      }
      fx.render(g);
      g.strokeStyle = C.cyan; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      text(g, `ROUND ${round}`, 12, 12, { size: 9, color: C.dim });
      text(g, `WINS ${won}`, w - 12, 12, { size: 9, color: C.cyan, align: 'right' });
      if (phase === 'count') {
        text(g, count > 0 ? String(count) : 'GO', w / 2, h / 2 - 20, { size: 36, align: 'center', color: '#fff' });
        text(g, 'YOU ARE CYAN', w / 2, h / 2 + 30, { size: 10, align: 'center', color: C.cyan });
      }
      if (phase === 'roundEnd') text(g, 'ROUND WON', w / 2, h / 2 - 10, { size: 20, align: 'center', color: C.cyan });
    },
  };
};

export default trails;
