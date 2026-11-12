import type { GameFactory } from '../core/types';
import { C, Particles, roundRect, text } from '../core/draw';

const N = 8, CS = 56, OX = 16, OY = 76, TYPES = 6, TIME = 90;
const COL = ['#ff4fa3', '#5ef2ff', '#4dff8a', '#ffd23f', '#a78bfa', '#ff8a3d'];

interface Gem { t: number; dy: number; vy: number; dying: number }
type Phase = 'idle' | 'swap' | 'unswap' | 'clear' | 'fall';

const gemswap: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const grid: Gem[][] = [];
  let phase: Phase = 'idle', anim = 0, chain = 0, time = TIME, sel: [number, number] | null = null;
  let swapA: [number, number] = [0, 0], swapB: [number, number] = [0, 0];
  let cur: [number, number] = [3, 3], useCursor = false, idleT = 0, hint: [number, number, number, number] | null = null;
  let over = false, overT = 0, dragFrom: [number, number] | null = null, popups: { x: number; y: number; s: string; t: number }[] = [];
  const fx = new Particles(500, 500);

  const rt = () => api.rndInt(0, TYPES - 1);
  for (let r = 0; r < N; r++) {
    grid.push([]);
    for (let c = 0; c < N; c++) {
      let t: number;
      do { t = rt(); } while ((c >= 2 && grid[r][c - 1].t === t && grid[r][c - 2].t === t) || (r >= 2 && grid[r - 1][c].t === t && grid[r - 2][c].t === t));
      grid[r].push({ t, dy: -(N - r) * CS - 200, vy: 0, dying: 0 });
    }
  }
  phase = 'fall';

  const findMatches = () => {
    const m = new Set<number>();
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) {
      const t = grid[r][c].t;
      if (t >= 0 && grid[r][c + 1].t === t && grid[r][c + 2].t === t) { m.add(r * N + c); m.add(r * N + c + 1); m.add(r * N + c + 2); }
    }
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) {
      const t = grid[r][c].t;
      if (t >= 0 && grid[r + 1][c].t === t && grid[r + 2][c].t === t) { m.add(r * N + c); m.add((r + 1) * N + c); m.add((r + 2) * N + c); }
    }
    return m;
  };
  const swap = (a: [number, number], b: [number, number]) => { const t = grid[a[0]][a[1]]; grid[a[0]][a[1]] = grid[b[0]][b[1]]; grid[b[0]][b[1]] = t; };
  const findMove = (): [number, number, number, number] | null => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= N || c2 >= N) continue;
      swap([r, c], [r2, c2]);
      const ok = findMatches().size > 0;
      swap([r, c], [r2, c2]);
      if (ok) return [r, c, r2, c2];
    }
    return null;
  };

  const trySwap = (a: [number, number], b: [number, number]) => {
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return false;
    swapA = a; swapB = b; swap(a, b); phase = 'swap'; anim = 0; chain = 0; sel = null; idleT = 0; hint = null;
    sfx.blip();
    return true;
  };

  const startClear = (m: Set<number>) => {
    chain++;
    const pts = m.size * 10 * chain + (m.size >= 4 ? 30 : 0) + (m.size >= 5 ? 60 : 0);
    api.addScore(pts);
    let sx = 0, sy = 0;
    m.forEach(i => {
      const r = Math.floor(i / N), c = i % N;
      grid[r][c].dying = 0.001;
      sx += c; sy += r;
      fx.burst(OX + c * CS + CS / 2, OY + r * CS + CS / 2, 8, COL[grid[r][c].t], 180, 0.6, 3);
    });
    popups.push({ x: OX + (sx / m.size) * CS + CS / 2, y: OY + (sy / m.size) * CS + CS / 2, s: chain > 1 ? `+${pts} x${chain}` : `+${pts}`, t: 0.9 });
    sfx.note(330 * Math.pow(1.122, Math.min(chain, 8)), 0.14);
    if (chain >= 3) api.shake(chain * 2);
    if (m.size >= 5) time = Math.min(TIME, time + 2);
    phase = 'clear'; anim = 0;
  };

  const gravity = () => {
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        if (grid[r][c].dying) continue;
        if (write !== r) { grid[write][c] = grid[r][c]; grid[write][c].dy -= (write - r) * CS; }
        write--;
      }
      for (let r = write, k = 1; r >= 0; r--, k++) grid[r][c] = { t: rt(), dy: -(write + 1) * CS - k * 6, vy: 0, dying: 0 };
    }
    phase = 'fall';
  };

  const cellAt = (x: number, y: number): [number, number] | null => {
    const c = Math.floor((x - OX) / CS), r = Math.floor((y - OY) / CS);
    return r >= 0 && c >= 0 && r < N && c < N ? [r, c] : null;
  };

  const drawGem = (g: CanvasRenderingContext2D, t: number, x: number, y: number, s: number) => {
    const r = CS * 0.36 * s;
    g.fillStyle = COL[t];
    g.beginPath();
    switch (t) {
      case 0: g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); break; // diamond
      case 1: g.arc(x, y, r * 0.92, 0, Math.PI * 2); break; // orb
      case 2: for (let k = 0; k < 6; k++) g.lineTo(x + Math.cos(k * Math.PI / 3) * r, y + Math.sin(k * Math.PI / 3) * r); break; // hex
      case 3: g.moveTo(x, y - r); g.lineTo(x + r, y + r * 0.8); g.lineTo(x - r, y + r * 0.8); break; // triangle
      case 4: roundRect(g, x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6, 5); break; // square
      default: for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(k * Math.PI / 5 - Math.PI / 2) * rr, y + Math.sin(k * Math.PI / 5 - Math.PI / 2) * rr); } // star
    }
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x - r * 0.35, y - r * 0.5, r * 0.25, r * 0.25);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + r * 0.2, y + r * 0.25, r * 0.4, 0, Math.PI * 2); g.fill();
  };

  return {
    update(dt) {
      fx.update(dt);
      for (const p of popups) { p.t -= dt; p.y -= 30 * dt; }
      popups = popups.filter(p => p.t > 0);
      if (over) { overT += dt; if (overT > 1.4) api.gameOver({ message: 'Time up' }); return; }
      if (phase !== 'fall' || api.time > 0.5) time -= dt;
      if (time <= 0 && phase === 'idle') { time = 0; over = true; sfx.lose(); return; }

      anim += dt;
      if (phase === 'swap' && anim >= 0.14) {
        const m = findMatches();
        if (m.size) startClear(m); else { swap(swapA, swapB); phase = 'unswap'; anim = 0; sfx.bounce(); }
      } else if (phase === 'unswap' && anim >= 0.14) phase = 'idle';
      else if (phase === 'clear') {
        for (const row of grid) for (const g of row) if (g.dying) g.dying += dt;
        if (anim >= 0.2) gravity();
      } else if (phase === 'fall') {
        let moving = false;
        for (const row of grid) for (const g of row) {
          if (g.dy < 0) { g.vy += 2600 * dt; g.dy = Math.min(0, g.dy + g.vy * dt); moving = true; } else g.vy = 0;
        }
        if (!moving) {
          const m = findMatches();
          if (m.size) startClear(m);
          else {
            phase = 'idle';
            if (!findMove()) { // reshuffle when stuck
              for (const row of grid) for (const g of row) { g.t = rt(); g.dy = -40; }
              phase = 'fall'; popups.push({ x: w / 2, y: OY + N * CS / 2, s: 'SHUFFLE', t: 1 });
            }
          }
        }
      }

      if (phase !== 'idle') return;
      idleT += dt;
      if (idleT > 6 && !hint) hint = findMove();

      const mv = (dr: number, dc: number) => {
        useCursor = true;
        if (sel) { const b: [number, number] = [sel[0] + dr, sel[1] + dc]; if (b[0] >= 0 && b[0] < N && b[1] >= 0 && b[1] < N) trySwap(sel, b); return; }
        cur = [Math.max(0, Math.min(N - 1, cur[0] + dr)), Math.max(0, Math.min(N - 1, cur[1] + dc))];
      };
      if (input.pressed('left')) mv(0, -1);
      if (input.pressed('right')) mv(0, 1);
      if (input.pressed('up')) mv(-1, 0);
      if (input.pressed('down')) mv(1, 0);
      if (input.pressed('a')) { useCursor = true; sel = sel ? null : [...cur]; sfx.tick(); }

      const p = input.pointer;
      if (p.pressed) {
        const c = cellAt(p.x, p.y);
        useCursor = false;
        if (c) {
          if (sel && trySwap(sel, c)) return;
          sel = c; dragFrom = c; sfx.tick();
        }
      }
      if (p.down && dragFrom) { // swipe-to-swap
        const c = cellAt(p.x, p.y);
        if (c && (c[0] !== dragFrom[0] || c[1] !== dragFrom[1])) { const d = dragFrom; dragFrom = null; trySwap(d, [d[0] + Math.sign(c[0] - d[0]) * (Math.abs(c[0] - d[0]) >= Math.abs(c[1] - d[1]) ? 1 : 0), d[1] + Math.sign(c[1] - d[1]) * (Math.abs(c[1] - d[1]) > Math.abs(c[0] - d[0]) ? 1 : 0)]); }
      }
      if (p.released) dragFrom = null;
    },

    render(g) {
      g.fillStyle = '#12051a'; g.fillRect(0, 0, w, h);
      text(g, 'GEM SWAP', OX, 18, { size: 14, color: C.pink });
      // timer bar
      const tf = Math.max(0, time / TIME);
      g.fillStyle = '#2a1033'; roundRect(g, OX, 46, N * CS, 10, 5); g.fill();
      g.fillStyle = tf < 0.2 ? (Math.floor(time * 4) % 2 ? C.red : C.orange) : C.pink;
      roundRect(g, OX, 46, N * CS * tf, 10, 5); g.fill();
      text(g, Math.ceil(time), w - OX, 18, { size: 14, align: 'right', color: tf < 0.2 ? C.red : C.white });

      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        g.fillStyle = (r + c) % 2 ? '#1c0a26' : '#220d2e';
        g.fillRect(OX + c * CS, OY + r * CS, CS, CS);
      }
      const k = Math.min(1, anim / 0.14);
      const e = k * k * (3 - 2 * k);
      g.save(); g.beginPath(); g.rect(OX, OY, N * CS, N * CS); g.clip();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const gm = grid[r][c];
        let x = OX + c * CS + CS / 2, y = OY + r * CS + CS / 2 + gm.dy;
        if (phase === 'swap' || phase === 'unswap') {
          // visually travel from the other cell
          const isA = r === swapA[0] && c === swapA[1], isB = r === swapB[0] && c === swapB[1];
          if (isA || isB) {
            const o = isA ? swapB : swapA;
            x += (o[1] - c) * CS * (1 - e); y += (o[0] - r) * CS * (1 - e);
          }
        }
        const s = gm.dying ? Math.max(0, 1 - gm.dying / 0.2) : 1;
        const isSel = sel && sel[0] === r && sel[1] === c;
        drawGem(g, gm.t, x, y, s * (isSel ? 1.1 + Math.sin(api.time * 10) * 0.05 : 1));
      }
      g.restore();
      if (hint && Math.floor(api.time * 2) % 2) {
        g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
        g.strokeRect(OX + hint[1] * CS + 3, OY + hint[0] * CS + 3, CS - 6, CS - 6);
        g.strokeRect(OX + hint[3] * CS + 3, OY + hint[2] * CS + 3, CS - 6, CS - 6);
      }
      if (useCursor) { g.strokeStyle = sel ? C.yellow : '#fff'; g.lineWidth = 3; g.strokeRect(OX + cur[1] * CS + 2, OY + cur[0] * CS + 2, CS - 4, CS - 4); }
      else if (sel) { g.strokeStyle = C.yellow; g.lineWidth = 3; g.strokeRect(OX + sel[1] * CS + 2, OY + sel[0] * CS + 2, CS - 4, CS - 4); }
      fx.render(g);
      for (const p of popups) text(g, p.s, p.x, p.y, { size: 12, align: 'center', color: C.yellow, alpha: Math.min(1, p.t * 2) });
    },
  };
};

export default gemswap;
