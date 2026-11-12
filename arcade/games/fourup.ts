import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

const COLS = 7, ROWS = 6, CS = 70, OX = 35, OY = 110;
type Cell = 0 | 1 | 2; // 1 = player, 2 = bot

const fourup: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  let board: Cell[] = new Array(COLS * ROWS).fill(0);
  let col = 3, turn: 1 | 2 = 1, wins = 0, drop: { c: number; r: number; who: Cell; y: number; vy: number } | null = null;
  let result: 0 | 1 | 2 | 3 = 0, resultT = 0, line: number[] = [], thinkT = 0, over = false;
  const fx = new Particles(300, 500);

  const at = (b: Cell[], c: number, r: number) => b[r * COLS + c];
  const openRow = (b: Cell[], c: number) => { for (let r = ROWS - 1; r >= 0; r--) if (!at(b, c, r)) return r; return -1; };
  const winner = (b: Cell[]): { who: Cell; cells: number[] } | null => {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const v = at(b, c, r); if (!v) continue;
      for (const [dc, dr] of dirs) {
        const cells = [r * COLS + c];
        for (let k = 1; k < 4; k++) { const cc = c + dc * k, rr = r + dr * k; if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS || at(b, cc, rr) !== v) break; cells.push(rr * COLS + cc); }
        if (cells.length === 4) return { who: v, cells };
      }
    }
    return null;
  };

  // heuristic: count open windows of four, centre preference
  const evalBoard = (b: Cell[]) => {
    let s = 0;
    for (let r = 0; r < ROWS; r++) if (at(b, 3, r) === 2) s += 3; else if (at(b, 3, r) === 1) s -= 3;
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dc, dr] of dirs) {
      let me = 0, op = 0, ok = true;
      for (let k = 0; k < 4; k++) {
        const cc = c + dc * k, rr = r + dr * k;
        if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) { ok = false; break; }
        const v = at(b, cc, rr); if (v === 2) me++; else if (v === 1) op++;
      }
      if (!ok || (me && op)) continue;
      s += me === 3 ? 12 : me === 2 ? 3 : 0;
      s -= op === 3 ? 14 : op === 2 ? 3 : 0;
    }
    return s;
  };
  const ORDER = [3, 2, 4, 1, 5, 0, 6];
  const minimax = (b: Cell[], depth: number, a: number, beta: number, max: boolean): number => {
    const wv = winner(b);
    if (wv) return wv.who === 2 ? 100000 + depth : -100000 - depth;
    if (depth === 0 || b.every(Boolean)) return evalBoard(b);
    let best = max ? -Infinity : Infinity;
    for (const c of ORDER) {
      const r = openRow(b, c); if (r < 0) continue;
      b[r * COLS + c] = max ? 2 : 1;
      const v = minimax(b, depth - 1, a, beta, !max);
      b[r * COLS + c] = 0;
      if (max) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
      if (beta <= a) break;
    }
    return best;
  };
  const botMove = () => {
    const depth = Math.min(2 + wins, 6);
    let best = 3, bv = -Infinity;
    for (const c of ORDER) {
      const r = openRow(board, c); if (r < 0) continue;
      board[r * COLS + c] = 2;
      const v = minimax(board, depth - 1, -Infinity, Infinity, false) + (wins === 0 ? api.rnd() * 6 : 0);
      board[r * COLS + c] = 0;
      if (v > bv) { bv = v; best = c; }
    }
    return best;
  };

  const play = (c: number, who: 1 | 2) => {
    const r = openRow(board, c); if (r < 0) return false;
    drop = { c, r, who, y: OY - CS, vy: 0 };
    return true;
  };

  const newRound = () => { board = new Array(COLS * ROWS).fill(0); result = 0; line = []; turn = wins % 2 === 0 ? 1 : 2; thinkT = 0.5; };

  return {
    update(dt) {
      fx.update(dt);
      if (drop) {
        drop.vy += 2600 * dt; drop.y += drop.vy * dt;
        const ty = OY + drop.r * CS;
        if (drop.y >= ty) {
          if (drop.vy > 500) { drop.y = ty; drop.vy *= -0.28; sfx.bounce(); } else {
            board[drop.r * COLS + drop.c] = drop.who; drop = null;
            const wv = winner(board);
            if (wv) {
              line = wv.cells; result = wv.who; resultT = 0;
              if (wv.who === 1) { wins++; api.setScore(wins); sfx.win(); line.forEach(i => fx.burst(OX + (i % COLS) * CS + CS / 2, OY + Math.floor(i / COLS) * CS + CS / 2, 14, C.yellow, 200, 0.8)); }
              else { sfx.lose(); api.shake(8); }
            } else if (board.every(Boolean)) { result = 3; resultT = 0; }
            else { turn = turn === 1 ? 2 : 1; thinkT = 0.45; }
          }
        }
        return;
      }
      if (result) {
        resultT += dt;
        if (resultT > 1.8) { if (result === 2) { if (!over) { over = true; api.gameOver({ message: wins ? `${wins} win streak` : 'The bot wins' }); } } else newRound(); }
        return;
      }
      if (turn === 2) { thinkT -= dt; if (thinkT <= 0) play(botMove(), 2); return; }
      if (input.pressed('left')) { col = (col + COLS - 1) % COLS; sfx.tick(); }
      if (input.pressed('right')) { col = (col + 1) % COLS; sfx.tick(); }
      const p = input.pointer;
      if (p.active && p.x > OX && p.x < OX + COLS * CS) col = Math.floor((p.x - OX) / CS);
      if (input.pressed('a') || input.pressed('down') || (p.pressed && p.x > OX && p.x < OX + COLS * CS)) { if (!play(col, 1)) sfx.blip(); }
    },

    render(g) {
      g.fillStyle = '#0a0f2a'; g.fillRect(0, 0, w, h);
      text(g, 'FOUR UP', 24, 20, { size: 14, color: C.yellow });
      text(g, `STREAK ${wins}`, w - 24, 20, { size: 11, color: C.white, align: 'right' });
      text(g, `BOT LEVEL ${Math.min(2 + wins, 6) - 1}`, w - 24, 40, { size: 8, color: C.dim, align: 'right' });
      const status = result === 1 ? 'YOU WIN!' : result === 2 ? 'BOT WINS' : result === 3 ? 'DRAW' : turn === 1 ? 'YOUR MOVE' : 'BOT IS THINKING';
      text(g, status, w / 2, 56, { size: 11, align: 'center', color: result === 1 ? C.yellow : result === 2 ? C.red : C.white });

      // hover disc
      if (turn === 1 && !drop && !result) {
        g.fillStyle = C.yellow; g.globalAlpha = 0.85;
        g.beginPath(); g.arc(OX + col * CS + CS / 2, OY - CS / 2 + 4, CS * 0.36, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      }
      const disc = (x: number, y: number, who: Cell, hi = false) => {
        g.fillStyle = who === 1 ? C.yellow : C.red;
        g.beginPath(); g.arc(x, y, CS * 0.38, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x, y, CS * 0.27, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - 8, y - 8, 6, 0, Math.PI * 2); g.fill();
        if (hi) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, CS * 0.4, 0, Math.PI * 2); g.stroke(); }
      };
      if (drop) disc(OX + drop.c * CS + CS / 2, drop.y + CS / 2, drop.who);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const v = board[r * COLS + c];
        if (v) disc(OX + c * CS + CS / 2, OY + r * CS + CS / 2, v, line.includes(r * COLS + c) && Math.floor(resultT * 6) % 2 === 0);
      }
      // board frame with holes (drawn over discs via evenodd)
      g.fillStyle = '#2350d8';
      g.beginPath();
      g.rect(OX - 10, OY - 10, COLS * CS + 20, ROWS * CS + 20);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = OX + c * CS + CS / 2, y = OY + r * CS + CS / 2; g.moveTo(x + CS * 0.4, y); g.arc(x, y, CS * 0.4, 0, Math.PI * 2, true); }
      g.fill('evenodd');
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(OX - 10, OY - 10, COLS * CS + 20, 4);
      g.fillStyle = '#16348f'; g.fillRect(OX - 18, OY + ROWS * CS + 10, COLS * CS + 36, 12);
      fx.render(g);
    },
  };
};

export default fourup;
