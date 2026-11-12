import type { GameFactory } from '../core/types';
import { C, Particles, fmtTime, roundRect, text } from '../core/draw';

// Klondike, draw-one. Click a card to send it to the best legal spot; drag for
// full control. Every card eases toward its layout slot, so all moves animate.

interface Card { id: number; s: number; r: number; up: boolean; x: number; y: number; tx: number; ty: number; z: number }
type PileRef = { kind: 'tab' | 'found' | 'waste' | 'stock'; i: number };

const CW = 80, CH = 112, COLX = (i: number) => 30 + i * 117, TOPY = 54, TABY = 196;
const SUIT = ['♠', '♥', '♦', '♣'];
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const red = (c: Card) => c.s === 1 || c.s === 2;

const solitaire: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  let stock: Card[] = [], waste: Card[] = [];
  const found: Card[][] = [[], [], [], []];
  const tab: Card[][] = [[], [], [], [], [], [], []];
  const history: string[] = [];
  let drag: { cards: Card[]; from: PileRef; ox: number; oy: number; sx: number; sy: number; moved: boolean } | null = null;
  let won = false, wonT = 0, autoT = 0, autoplay = false, clock = 0, moves = 0;
  const fx = new Particles(400, 400);

  // deal
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ id: s * 13 + r, s, r, up: false, x: COLX(0), y: TOPY, tx: 0, ty: 0, z: 0 });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(api.rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  for (let c = 0; c < 7; c++) for (let r = 0; r <= c; r++) { const k = deck.pop()!; k.up = r === c; tab[c].push(k); }
  stock = deck;
  const byId = new Map<number, Card>();
  [...stock, ...tab.flat()].forEach(k => byId.set(k.id, k));

  const snapshot = () => JSON.stringify({
    st: stock.map(k => [k.id, k.up]), wa: waste.map(k => [k.id, k.up]),
    fo: found.map(p => p.map(k => [k.id, k.up])), ta: tab.map(p => p.map(k => [k.id, k.up])), sc: api.score,
  });
  const restore = (s: string) => {
    const d = JSON.parse(s);
    const m = (a: [number, boolean][]) => a.map(([id, up]) => { const k = byId.get(id)!; k.up = up; return k; });
    stock = m(d.st); waste = m(d.wa);
    d.fo.forEach((p: [number, boolean][], i: number) => { found[i] = m(p); });
    d.ta.forEach((p: [number, boolean][], i: number) => { tab[i] = m(p); });
    api.setScore(d.sc);
  };
  const save = () => { history.push(snapshot()); if (history.length > 200) history.shift(); };

  const pile = (p: PileRef): Card[] => p.kind === 'tab' ? tab[p.i] : p.kind === 'found' ? found[p.i] : p.kind === 'waste' ? waste : stock;
  const canFound = (k: Card, i: number) => {
    const f = found[i], t = f[f.length - 1];
    return t ? t.s === k.s && k.r === t.r + 1 : k.r === 1;
  };
  const canTab = (k: Card, i: number) => {
    const t = tab[i][tab[i].length - 1];
    return t ? t.up && red(t) !== red(k) && k.r === t.r - 1 : k.r === 13;
  };

  const flipTops = () => {
    for (const col of tab) {
      const t = col[col.length - 1];
      if (t && !t.up) { t.up = true; api.addScore(5); sfx.tick(); }
    }
  };

  const moveCards = (from: PileRef, n: number, to: PileRef) => {
    save();
    const src = pile(from), cards = src.splice(src.length - n, n);
    pile(to).push(...cards);
    moves++;
    if (to.kind === 'found') { api.addScore(10); sfx.coin(); }
    else if (from.kind === 'waste') { api.addScore(5); sfx.bounce(); }
    else if (from.kind === 'found') { api.addScore(-15); sfx.bounce(); }
    else sfx.bounce();
    flipTops();
  };

  /** Best destination for a click: foundation first (single card), else the first legal column. */
  const autoMove = (from: PileRef, idx: number) => {
    const src = pile(from), n = src.length - idx, k = src[idx];
    if (n === 1 && from.kind !== 'found') for (let i = 0; i < 4; i++) if (canFound(k, i)) { moveCards(from, 1, { kind: 'found', i }); return true; }
    for (let off = 1; off <= 7; off++) {
      const i = from.kind === 'tab' ? (from.i + off) % 7 : off - 1;
      if (from.kind === 'tab' && i === from.i) continue;
      // don't shuffle a king between empty columns pointlessly
      if (k.r === 13 && tab[i].length === 0 && from.kind === 'tab' && idx === 0) continue;
      if (canTab(k, i)) { moveCards(from, n, { kind: 'tab', i }); return true; }
    }
    return false;
  };

  const drawStock = () => {
    save();
    if (stock.length) { const k = stock.pop()!; k.up = true; waste.push(k); sfx.tick(); }
    else if (waste.length) { stock = waste.reverse().map(k => { k.up = false; return k; }); waste = []; api.addScore(-20); sfx.blip(); }
    moves++;
  };

  const tabOffsets = (col: Card[]) => {
    const avail = h - TABY - CH - 10;
    let need = 0;
    for (let i = 0; i < col.length - 1; i++) need += col[i].up ? 28 : 12;
    const k = need > avail ? avail / need : 1;
    return { down: 12 * k, up: 28 * k };
  };

  const layout = () => {
    let z = 0;
    stock.forEach((k, i) => { k.tx = COLX(0) - Math.min(i, 8) * 0.25; k.ty = TOPY - Math.min(i, 8) * 0.25; k.z = z++; });
    waste.forEach((k, i) => { const fan = Math.max(0, i - (waste.length - 3)); k.tx = COLX(1) + fan * 18; k.ty = TOPY; k.z = z++; });
    found.forEach((p, fi) => p.forEach(k => { k.tx = COLX(3 + fi); k.ty = TOPY; k.z = z++; }));
    tab.forEach((col, ci) => {
      const o = tabOffsets(col);
      let y = TABY;
      col.forEach(k => { k.tx = COLX(ci); k.ty = y; k.z = 100 + z++; y += k.up ? o.up : o.down; });
    });
  };

  const hit = (x: number, y: number): { from: PileRef; idx: number } | null => {
    if (y >= TOPY && y <= TOPY + CH) {
      if (x >= COLX(0) && x <= COLX(0) + CW) return { from: { kind: 'stock', i: 0 }, idx: stock.length - 1 };
      const wt = waste[waste.length - 1];
      if (wt && x >= wt.tx && x <= wt.tx + CW) return { from: { kind: 'waste', i: 0 }, idx: waste.length - 1 };
      for (let i = 0; i < 4; i++) if (found[i].length && x >= COLX(3 + i) && x <= COLX(3 + i) + CW) return { from: { kind: 'found', i }, idx: found[i].length - 1 };
    }
    for (let c = 0; c < 7; c++) {
      if (x < COLX(c) || x > COLX(c) + CW) continue;
      const col = tab[c];
      for (let i = col.length - 1; i >= 0; i--) if (y >= col[i].ty && y <= col[i].ty + CH) return col[i].up ? { from: { kind: 'tab', i: c }, idx: i } : null;
    }
    return null;
  };

  const tryAutoplay = () => {
    if (!autoplay && !stock.length && !waste.length && tab.every(c => c.every(k => k.up))) autoplay = true;
  };

  return {
    update(dt) {
      fx.update(dt);
      layout();
      for (const k of byId.values()) {
        if (drag && drag.cards.includes(k)) continue;
        k.x += (k.tx - k.x) * Math.min(1, dt * 18);
        k.y += (k.ty - k.y) * Math.min(1, dt * 18);
      }
      if (won) {
        wonT += dt;
        if (Math.random() < 0.5) fx.burst(Math.random() * w, Math.random() * h * 0.6, 8, api.pick([C.yellow, C.pink, C.cyan, C.green]), 160, 1);
        if (wonT > 2.2) api.gameOver({ win: true, message: `Solved in ${fmtTime(clock)} · ${moves} moves` });
        return;
      }
      clock += dt;

      if (autoplay) {
        autoT -= dt;
        if (autoT <= 0) {
          autoT = 0.07;
          let best: { c: number; f: number } | null = null;
          for (let c = 0; c < 7 && !best; c++) {
            const k = tab[c][tab[c].length - 1];
            if (k) for (let f = 0; f < 4; f++) if (canFound(k, f)) { best = { c, f }; break; }
          }
          if (best) moveCards({ kind: 'tab', i: best.c }, 1, { kind: 'found', i: best.f });
        }
      }
      if (found.every(f => f.length === 13)) {
        won = true; api.addScore(Math.max(0, Math.round(600 - clock))); sfx.win();
        return;
      }

      if (input.pressed('b') && history.length) { restore(history.pop()!); sfx.blip(); }

      const p = input.pointer;
      if (p.pressed) {
        // header buttons
        if (p.y < 36) {
          if (p.x > w - 100) { api.gameOver({ message: `Resigned · ${found.reduce((s, f) => s + f.length, 0)}/52 home` }); return; }
          if (p.x > w - 190 && history.length) { restore(history.pop()!); sfx.blip(); return; }
        }
        const ht = hit(p.x, p.y);
        if (ht?.from.kind === 'stock' || (!ht && p.y >= TOPY && p.y <= TOPY + CH && p.x >= COLX(0) && p.x <= COLX(0) + CW)) { drawStock(); return; }
        if (ht && ht.idx >= 0) {
          const src = pile(ht.from);
          const cards = src.slice(ht.idx);
          drag = { cards, from: ht.from, ox: p.x - cards[0].x, oy: p.y - cards[0].y, sx: p.x, sy: p.y, moved: false };
        }
      }
      if (drag) {
        if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 6) drag.moved = true;
        if (drag.moved) drag.cards.forEach((k, i) => { k.x = p.x - drag!.ox; k.y = p.y - drag!.oy + i * 28; });
        if (p.released || !p.down) {
          const src = pile(drag.from), idx = src.length - drag.cards.length, lead = drag.cards[0];
          if (!drag.moved) autoMove(drag.from, idx);
          else {
            const cx = lead.x + CW / 2, cy = lead.y + CH / 2;
            let done = false;
            if (cy < TABY - 20 && drag.cards.length === 1) {
              for (let i = 0; i < 4 && !done; i++) if (Math.abs(cx - (COLX(3 + i) + CW / 2)) < CW && canFound(lead, i)) { moveCards(drag.from, 1, { kind: 'found', i }); done = true; }
            }
            if (!done) {
              const order = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => Math.abs(cx - COLX(a) - CW / 2) - Math.abs(cx - COLX(b) - CW / 2));
              for (const i of order.slice(0, 2)) {
                if (drag.from.kind === 'tab' && drag.from.i === i) continue;
                if (Math.abs(cx - COLX(i) - CW / 2) < CW && canTab(lead, i)) { moveCards(drag.from, drag.cards.length, { kind: 'tab', i }); done = true; break; }
              }
            }
            if (!done) sfx.blip();
          }
          drag = null;
          tryAutoplay();
        }
      }
    },

    render(g) {
      g.fillStyle = '#0d3a26'; g.fillRect(0, 0, w, h);
      const grd = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.45)');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);

      text(g, fmtTime(clock), 30, 16, { size: 10, color: '#cfe8d8' });
      text(g, `${moves} MOVES`, 120, 16, { size: 10, color: '#8fb8a0' });
      text(g, 'UNDO', w - 150, 16, { size: 10, color: history.length ? '#cfe8d8' : '#4f7a62', align: 'center' });
      text(g, 'RESIGN', w - 60, 16, { size: 10, color: '#cfe8d8', align: 'center' });

      // empty slots
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.5;
      const slot = (x: number, y: number, label?: string) => {
        roundRect(g, x + 0.5, y + 0.5, CW - 1, CH - 1, 7); g.stroke();
        if (label) text(g, label, x + CW / 2, y + CH / 2, { size: 22, color: 'rgba(255,255,255,0.14)', align: 'center', baseline: 'middle', font: 'sans' });
      };
      slot(COLX(0), TOPY, stock.length ? '' : '↻');
      slot(COLX(1), TOPY);
      for (let i = 0; i < 4; i++) slot(COLX(3 + i), TOPY, SUIT[i]);
      for (let i = 0; i < 7; i++) slot(COLX(i), TABY, 'K');

      const all = [...byId.values()].sort((a, b) => {
        const da = drag?.cards.includes(a) ? 1000 : 0, db = drag?.cards.includes(b) ? 1000 : 0;
        return a.z + da - (b.z + db);
      });
      for (const k of all) drawCard(g, k, drag?.cards.includes(k) ?? false);
      fx.render(g);
      if (autoplay && !won) text(g, 'AUTO-COMPLETE', w / 2, 16, { size: 10, color: C.yellow, align: 'center' });
    },
  };
};

function drawCard(g: CanvasRenderingContext2D, k: Card, lifted: boolean) {
  const { x, y } = k;
  if (lifted) { g.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(g, x + 4, y + 6, CW, CH, 7); g.fill(); }
  else { g.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(g, x + 1, y + 2, CW, CH, 7); g.fill(); }
  if (!k.up) {
    g.fillStyle = '#20263b'; roundRect(g, x, y, CW, CH, 7); g.fill();
    g.strokeStyle = '#ffb000'; g.lineWidth = 1; roundRect(g, x + 5.5, y + 5.5, CW - 11, CH - 11, 4); g.stroke();
    g.fillStyle = 'rgba(255,176,0,0.18)';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) if ((i + j) % 2 === 0) g.fillRect(x + 10 + i * 10, y + 10 + j * 10.4, 5, 5);
    return;
  }
  g.fillStyle = '#f4f1e8'; roundRect(g, x, y, CW, CH, 7); g.fill();
  const col = k.s === 1 || k.s === 2 ? '#c8323a' : '#1b1c22';
  g.fillStyle = col;
  g.font = '600 17px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText(RANK[k.r], x + 7, y + 6);
  g.font = '15px system-ui, sans-serif';
  g.fillText(SUIT[k.s], x + 7, y + 25);
  g.font = k.r > 10 ? '600 34px system-ui, sans-serif' : '40px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(k.r > 10 ? RANK[k.r] : SUIT[k.s], x + CW / 2 + 6, y + CH / 2 + 12);
}

export default solitaire;
