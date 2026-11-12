import type { GameFactory } from '../core/types';
import { C, roundRect, text } from '../core/draw';

interface Tile { id: number; v: number; r: number; c: number; pr: number; pc: number; dying?: boolean; born: number; pop: number }

const N = 4, BX = 20, BY = 100, BS = 440, GAP = 12;
const CELL = (BS - GAP * (N + 1)) / N;
const ANIM = 0.11;

const COLORS: Record<number, [string, string]> = {
  2: ['#1d2230', '#c9cfe6'], 4: ['#232a3d', '#dfe4f7'], 8: ['#5a3a12', '#ffd9a0'], 16: ['#6e3410', '#ffcf9a'],
  32: ['#7a2420', '#ffc2b8'], 64: ['#8c1830', '#ffd0dc'], 128: ['#6b5a10', '#fff1a6'], 256: ['#7a6610', '#fff4b8'],
  512: ['#806c00', '#fff8c8'], 1024: ['#0f6a55', '#c8fff0'], 2048: ['#ffd23f', '#1a1400'],
};
const col = (v: number) => COLORS[v] ?? ['#ff4fa3', '#1a0010'];

const fuse: GameFactory = (api) => {
  const { input, sfx } = api;
  let tiles: Tile[] = [];
  let nextId = 1, anim = 0, t = 0, won = false, over = false, overT = 0, bestTile = 2;
  let swipe: { x: number; y: number } | null = null;

  const at = (r: number, c: number) => tiles.find(k => !k.dying && k.r === r && k.c === c);
  const spawn = () => {
    const empty: [number, number][] = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!at(r, c)) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = api.pick(empty);
    tiles.push({ id: nextId++, v: api.rnd() < 0.9 ? 2 : 4, r, c, pr: r, pc: c, born: t, pop: 0 });
  };
  spawn(); spawn();

  const canMove = () => {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const a = at(r, c);
      if (!a) return true;
      const b = at(r, c + 1), d = at(r + 1, c);
      if ((b && b.v === a.v) || (d && d.v === a.v)) return true;
    }
    return false;
  };

  const move = (dr: number, dc: number) => {
    tiles = tiles.filter(k => !k.dying);
    tiles.forEach(k => { k.pr = k.r; k.pc = k.c; k.pop = 0; });
    let moved = false, gained = 0;
    const order = [0, 1, 2, 3];
    const rows = dr === 1 ? [...order].reverse() : order;
    const cols = dc === 1 ? [...order].reverse() : order;
    const mergedInto = new Set<number>();
    for (const r of rows) for (const c of cols) {
      const k = at(r, c);
      if (!k) continue;
      let nr = r, nc = c;
      while (true) {
        const tr = nr + dr, tc = nc + dc;
        if (tr < 0 || tr >= N || tc < 0 || tc >= N) break;
        const o = at(tr, tc);
        if (!o) { nr = tr; nc = tc; continue; }
        if (o.v === k.v && !mergedInto.has(o.id)) {
          // k slides onto o and both die; a doubled tile is born there
          k.r = tr; k.c = tc; k.dying = true; o.dying = true;
          const v = k.v * 2;
          const nt: Tile = { id: nextId++, v, r: tr, c: tc, pr: tr, pc: tc, born: t + ANIM, pop: 1 };
          tiles.push(nt); mergedInto.add(nt.id);
          gained += v; bestTile = Math.max(bestTile, v);
          moved = true;
        }
        break;
      }
      if (!k.dying && (nr !== r || nc !== c)) { k.r = nr; k.c = nc; moved = true; }
    }
    if (!moved) return;
    anim = ANIM;
    if (gained) { api.addScore(gained); sfx.note(220 + Math.log2(gained) * 60, 0.08); } else sfx.tick();
    spawn();
    if (bestTile >= 2048 && !won) { won = true; sfx.win(); }
    if (!canMove()) over = true;
  };

  return {
    update(dt) {
      t += dt;
      if (anim > 0) anim = Math.max(0, anim - dt);
      if (over) { overT += dt; if (overT > 1.1) api.gameOver({ win: won, message: `Best tile ${bestTile}` }); return; }
      if (anim > 0.04) return; // allow fast input chaining near the end of a slide
      if (input.pressed('left')) move(0, -1);
      else if (input.pressed('right')) move(0, 1);
      else if (input.pressed('up')) move(-1, 0);
      else if (input.pressed('down')) move(1, 0);
      const p = input.pointer;
      if (p.pressed) swipe = { x: p.x, y: p.y };
      if (p.released && swipe) {
        const dx = p.x - swipe.x, dy = p.y - swipe.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) {
          if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1); else move(dy > 0 ? 1 : -1, 0);
        }
        swipe = null;
      }
    },

    render(g) {
      g.fillStyle = '#0c0d12'; g.fillRect(0, 0, api.w, api.h);
      text(g, 'FUSE', BX, 30, { size: 26, color: C.yellow });
      text(g, 'BEST TILE', api.w - BX, 28, { size: 8, color: C.dim, align: 'right' });
      text(g, bestTile, api.w - BX, 44, { size: 18, color: C.white, align: 'right' });
      text(g, won ? '2048 REACHED — KEEP GOING' : 'JOIN THE TILES. GET TO 2048.', BX, 70, { size: 8, color: won ? C.yellow : C.dim });

      g.fillStyle = '#161923'; roundRect(g, BX, BY, BS, BS, 10); g.fill();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        g.fillStyle = '#1d2130';
        roundRect(g, BX + GAP + c * (CELL + GAP), BY + GAP + r * (CELL + GAP), CELL, CELL, 6); g.fill();
      }
      const p = anim > 0 ? 1 - anim / ANIM : 1;
      const e = 1 - (1 - p) * (1 - p); // ease-out
      const draw = (k: Tile) => {
        if (k.born > t) return;
        const r = k.pr + (k.r - k.pr) * e, c = k.pc + (k.c - k.pc) * e;
        const age = t - k.born;
        let s = 1;
        if (k.pop) s = age < 0.12 ? 1 + Math.sin((age / 0.12) * Math.PI) * 0.12 : 1;
        else if (age < 0.1 && k.pr === k.r && k.pc === k.c) s = age / 0.1;
        const x = BX + GAP + c * (CELL + GAP) + CELL / 2, y = BY + GAP + r * (CELL + GAP) + CELL / 2;
        const sz = CELL * s;
        const [bg, fg] = col(k.v);
        g.fillStyle = bg; roundRect(g, x - sz / 2, y - sz / 2, sz, sz, 6); g.fill();
        const fs = k.v < 100 ? 26 : k.v < 1000 ? 21 : 16;
        text(g, k.v, x, y + 1, { size: fs * s, color: fg, align: 'center', baseline: 'middle' });
      };
      tiles.filter(k => k.dying).forEach(draw);
      tiles.filter(k => !k.dying).forEach(draw);
      if (over) {
        g.fillStyle = 'rgba(12,13,18,0.6)'; g.fillRect(BX, BY, BS, BS);
        text(g, 'NO MOVES', api.w / 2, BY + BS / 2, { size: 20, align: 'center', baseline: 'middle' });
      }
    },
  };
};

export default fuse;
