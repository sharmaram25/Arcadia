import type { GameFactory } from '../core/types';
import { C, Particles, fmtTime, text } from '../core/draw';

const COLS = 16, ROWS = 16, MINES = 40, CS = 30, TOP = 40;
const NUM = ['', '#5ea8ff', '#4dff8a', '#ff5a5f', '#b58cff', '#ffb000', '#5ef2ff', '#f2f4ff', '#a0a8c8'];

const sweeper: GameFactory = (api) => {
  const { input, sfx } = api;
  const mine = new Uint8Array(COLS * ROWS);
  const adj = new Uint8Array(COLS * ROWS);
  const open = new Uint8Array(COLS * ROWS);
  const flag = new Uint8Array(COLS * ROWS);
  let placed = false, done = false, doneT = 0, won = false, revealed = 0, flags = 0;
  let cur = { c: 7, r: 7 }, useCursor = false, hover = -1;
  let holdT = -1, holdIdx = -1, holdFlagged = false;
  let boom = -1, clock = 0;
  const fx = new Particles(300, 300);

  const idx = (c: number, r: number) => r * COLS + c;
  const nbrs = (i: number) => {
    const c = i % COLS, r = (i / COLS) | 0, out: number[] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const x = c + dx, y = r + dy;
      if (x >= 0 && y >= 0 && x < COLS && y < ROWS) out.push(idx(x, y));
    }
    return out;
  };

  const place = (safe: number) => {
    const ban = new Set([safe, ...nbrs(safe)]);
    let n = 0;
    while (n < MINES) {
      const i = api.rndInt(0, COLS * ROWS - 1);
      if (mine[i] || ban.has(i)) continue;
      mine[i] = 1; n++;
    }
    for (let i = 0; i < mine.length; i++) adj[i] = nbrs(i).reduce((s, j) => s + mine[j], 0);
    placed = true;
  };

  const lose = (i: number) => {
    done = true; boom = i; sfx.boom(); api.shake(14);
    for (let j = 0; j < mine.length; j++) if (mine[j]) open[j] = 1;
    fx.burst((i % COLS) * CS + CS / 2, TOP + ((i / COLS) | 0) * CS + CS / 2, 50, C.red, 260, 0.9, 3);
    api.setScore(revealed);
  };

  const reveal = (i: number) => {
    if (open[i] || flag[i]) return;
    if (!placed) place(i);
    if (mine[i]) { lose(i); return; }
    const stack = [i];
    let n = 0;
    while (stack.length) {
      const k = stack.pop()!;
      if (open[k] || flag[k]) continue;
      open[k] = 1; revealed++; n++;
      if (adj[k] === 0) for (const j of nbrs(k)) if (!open[j]) stack.push(j);
    }
    if (n > 8) sfx.select(); else sfx.tick();
    api.setScore(revealed);
    if (revealed === COLS * ROWS - MINES) {
      done = true; won = true;
      for (let j = 0; j < mine.length; j++) if (mine[j] && !flag[j]) { flag[j] = 1; flags++; }
      api.setScore(Math.max(250, Math.round(1000 - clock * 4)));
      sfx.win();
    }
  };

  const chord = (i: number) => {
    if (!open[i] || !adj[i]) return;
    const ns = nbrs(i);
    if (ns.reduce((s, j) => s + flag[j], 0) !== adj[i]) return;
    for (const j of ns) if (!open[j] && !flag[j]) { reveal(j); if (done) return; }
  };

  const toggleFlag = (i: number) => {
    if (open[i]) return;
    flag[i] ^= 1; flags += flag[i] ? 1 : -1;
    sfx.blip();
  };

  const cellAt = (x: number, y: number) => {
    const c = Math.floor(x / CS), r = Math.floor((y - TOP) / CS);
    return c >= 0 && r >= 0 && c < COLS && r < ROWS ? idx(c, r) : -1;
  };

  return {
    update(dt) {
      fx.update(dt);
      if (done) { doneT += dt; if (doneT > 1.4) api.gameOver({ win: won, message: won ? `Cleared in ${fmtTime(clock)}` : `${revealed} safe cells` }); return; }
      if (placed) clock += dt;

      // keyboard cursor
      const mv = (dc: number, dr: number) => { useCursor = true; cur = { c: (cur.c + dc + COLS) % COLS, r: (cur.r + dr + ROWS) % ROWS }; };
      if (input.pressed('left')) mv(-1, 0);
      if (input.pressed('right')) mv(1, 0);
      if (input.pressed('up')) mv(0, -1);
      if (input.pressed('down')) mv(0, 1);
      if (input.pressed('a')) { useCursor = true; const i = idx(cur.c, cur.r); if (open[i]) chord(i); else reveal(i); }
      if (input.pressed('b')) { useCursor = true; toggleFlag(idx(cur.c, cur.r)); }

      // pointer: click reveal, right-click flag, long-press flag (touch)
      const p = input.pointer;
      hover = p.active ? cellAt(p.x, p.y) : -1;
      if (p.rightPressed && hover >= 0) { useCursor = false; toggleFlag(hover); }
      if (p.pressed && hover >= 0) { useCursor = false; holdT = 0; holdIdx = hover; holdFlagged = false; }
      if (holdT >= 0 && p.down) {
        holdT += dt;
        if (holdT > 0.38 && !holdFlagged && !open[holdIdx]) { toggleFlag(holdIdx); holdFlagged = true; navigator.vibrate?.(15); }
      }
      if (p.released && holdT >= 0) {
        if (!holdFlagged && hover === holdIdx) { if (open[holdIdx]) chord(holdIdx); else reveal(holdIdx); }
        holdT = -1;
      }
    },

    render(g) {
      g.fillStyle = '#0c0d12'; g.fillRect(0, 0, api.w, api.h);
      text(g, `MINES ${String(MINES - flags).padStart(2, '0')}`, 12, 14, { size: 11, color: C.red });
      text(g, fmtTime(clock), api.w - 12, 14, { size: 11, color: C.white, align: 'right' });
      text(g, done ? (won ? 'CLEAR' : 'BOOM') : placed ? '' : 'FIRST CLICK IS SAFE', api.w / 2, 15, { size: 8, color: C.dim, align: 'center' });

      g.font = `bold 16px ui-monospace, Menlo, Consolas, monospace`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = idx(c, r), x = c * CS, y = TOP + r * CS;
        if (open[i]) {
          g.fillStyle = i === boom ? '#5a1218' : '#12141c';
          g.fillRect(x, y, CS, CS);
          g.fillStyle = '#1b1e29'; g.fillRect(x, y, CS, 1); g.fillRect(x, y, 1, CS);
          if (mine[i]) {
            g.fillStyle = i === boom ? C.white : C.red;
            g.beginPath(); g.arc(x + CS / 2, y + CS / 2, 6, 0, 6.283); g.fill();
            g.fillRect(x + CS / 2 - 9, y + CS / 2 - 1, 18, 2); g.fillRect(x + CS / 2 - 1, y + CS / 2 - 9, 2, 18);
          } else if (adj[i]) {
            g.fillStyle = NUM[adj[i]];
            g.fillText(String(adj[i]), x + CS / 2, y + CS / 2 + 1);
          }
        } else {
          const hot = (!useCursor && i === hover && !done);
          g.fillStyle = hot ? '#353b54' : '#2a2f42';
          g.fillRect(x, y, CS, CS);
          g.fillStyle = '#3a4160'; g.fillRect(x, y, CS - 1, 2); g.fillRect(x, y, 2, CS - 1);
          g.fillStyle = '#1a1d29'; g.fillRect(x, y + CS - 2, CS, 2); g.fillRect(x + CS - 2, y, 2, CS);
          if (flag[i]) {
            const wrong = done && !won && !mine[i];
            g.fillStyle = '#d0d4e4'; g.fillRect(x + 12, y + 7, 2, 16);
            g.fillStyle = wrong ? C.dim : C.yellow;
            g.beginPath(); g.moveTo(x + 14, y + 7); g.lineTo(x + 22, y + 11); g.lineTo(x + 14, y + 15); g.fill();
          }
        }
      }
      if (useCursor && !done) {
        g.strokeStyle = C.yellow; g.lineWidth = 2;
        g.strokeRect(cur.c * CS + 1, TOP + cur.r * CS + 1, CS - 2, CS - 2);
      }
      fx.render(g);
    },
  };
};

export default sweeper;
