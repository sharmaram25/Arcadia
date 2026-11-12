import type { GameFactory } from '../core/types';
import { C, text } from '../core/draw';

// Pads sit at the arrow directions so the keyboard mapping is obvious.
const PADS = [
  { btn: 'up', col: '#4dff8a', dim: '#123d22', a0: -Math.PI * 3 / 4 },
  { btn: 'right', col: '#ff4757', dim: '#3d1218', a0: -Math.PI / 4 },
  { btn: 'down', col: '#ffd23f', dim: '#3d3210', a0: Math.PI / 4 },
  { btn: 'left', col: '#5ea8ff', dim: '#12263d', a0: Math.PI * 3 / 4 },
] as const;
const FREQ = [392, 523, 659, 330];

const echo: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const cx = w / 2, cy = h / 2 + 10, R = 190, r0 = 62;
  const seq: number[] = [];
  let mode: 'show' | 'input' | 'fail' | 'good' = 'good', idx = 0, timer = 0.8, lit = -1, litT = 0, failT = 0;

  const flash = (i: number, dur: number) => { lit = i; litT = dur; sfx.note(FREQ[i], dur); };
  const stepTime = () => Math.max(0.22, 0.6 - seq.length * 0.025);

  const press = (i: number) => {
    if (mode !== 'input') return;
    flash(i, 0.22);
    if (seq[idx] === i) {
      idx++;
      if (idx === seq.length) { api.setScore(seq.length); mode = 'good'; timer = 0.9; }
    } else {
      mode = 'fail'; failT = 0; sfx.lose(); api.shake(8); lit = seq[idx]; litT = 1.2;
    }
  };

  return {
    update(dt) {
      litT -= dt; if (litT <= 0) lit = -1;
      if (mode === 'fail') { failT += dt; if (failT > 1.4) api.gameOver({ message: `Sequence of ${seq.length}` }); return; }
      if (mode === 'good') {
        timer -= dt;
        if (timer <= 0) { seq.push(api.rndInt(0, 3)); mode = 'show'; idx = 0; timer = 0.35; }
        return;
      }
      if (mode === 'show') {
        timer -= dt;
        if (timer <= 0) {
          if (idx < seq.length) { flash(seq[idx], stepTime() * 0.75); idx++; timer = stepTime(); }
          else { mode = 'input'; idx = 0; }
        }
        return;
      }
      PADS.forEach((p, i) => { if (input.pressed(p.btn)) press(i); });
      const pt = input.pointer;
      if (pt.pressed) {
        const dx = pt.x - cx, dy = pt.y - cy, d = Math.hypot(dx, dy);
        if (d > r0 && d < R) {
          const a = Math.atan2(dy, dx);
          PADS.forEach((p, i) => {
            let rel = a - p.a0; rel = ((rel % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (rel < Math.PI / 2) press(i);
          });
        }
      }
    },

    render(g) {
      g.fillStyle = '#0b0618'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#05030c'; g.beginPath(); g.arc(cx, cy, R + 12, 0, Math.PI * 2); g.fill();
      PADS.forEach((p, i) => {
        const on = lit === i;
        const a0 = p.a0 + 0.05, a1 = p.a0 + Math.PI / 2 - 0.05;
        if (on) {
          g.fillStyle = p.col; g.globalAlpha = 0.25;
          g.beginPath(); g.arc(cx, cy, R + 24, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.fill(); g.globalAlpha = 1;
        }
        g.fillStyle = on ? p.col : p.dim;
        g.beginPath(); g.arc(cx, cy, R, a0, a1); g.arc(cx, cy, r0 + 8, a1, a0, true); g.closePath(); g.fill();
        if (on) { g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(cx, cy, R - 12, a0 + 0.1, a1 - 0.7); g.arc(cx, cy, R - 34, a1 - 0.7, a0 + 0.1, true); g.fill(); }
        // arrow glyph
        const mid = p.a0 + Math.PI / 4, ax = cx + Math.cos(mid) * (R * 0.66), ay = cy + Math.sin(mid) * (R * 0.66);
        g.save(); g.translate(ax, ay); g.rotate(mid);
        g.fillStyle = on ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.18)';
        g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -9); g.lineTo(-6, 9); g.fill();
        g.restore();
      });
      g.fillStyle = '#0b0618'; g.beginPath(); g.arc(cx, cy, r0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2a1d4a'; g.lineWidth = 3; g.stroke();
      text(g, seq.length ? String(seq.length) : '--', cx, cy - 8, { size: 22, align: 'center', color: C.white, baseline: 'middle' });
      const status = mode === 'show' ? 'WATCH' : mode === 'input' ? 'REPEAT' : mode === 'fail' ? 'MISS' : 'READY';
      text(g, status, cx, cy + 20, { size: 8, align: 'center', color: mode === 'fail' ? C.red : mode === 'input' ? C.green : C.dim, baseline: 'middle' });
      text(g, 'ECHO', 18, 18, { size: 12, color: C.purple });
      if (mode === 'input') text(g, `${idx}/${seq.length}`, w - 18, 18, { size: 10, color: C.dim, align: 'right' });
    },
  };
};

export default echo;
