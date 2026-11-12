import type { GameFactory } from '../core/types';
import { C, Particles, clamp, text } from '../core/draw';

const MAX = 1500;
const COLS = ['#ff4fa3', '#ffd23f', '#5ef2ff', '#a78bfa', '#4dff8a'];

const dodge: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  // pooled bullets in typed arrays: zero allocation while the screen is full
  const bx = new Float32Array(MAX), by = new Float32Array(MAX), bvx = new Float32Array(MAX), bvy = new Float32Array(MAX);
  const br = new Float32Array(MAX), bc = new Uint8Array(MAX), bg = new Uint8Array(MAX);
  let n = 0;
  const p = { x: w / 2, y: h - 80, inv: 1.5 };
  let lives = 3, t = 0, patT = 0, pat = 0, emitAng = 0, graze = 0, dead = false, deadT = 0, flash = 0;
  const em = { x: w / 2, y: 110 };
  const fx = new Particles(300);

  const fire = (x: number, y: number, a: number, sp: number, r = 5, c = 0) => {
    if (n >= MAX) return;
    bx[n] = x; by[n] = y; bvx[n] = Math.cos(a) * sp; bvy[n] = Math.sin(a) * sp; br[n] = r; bc[n] = c; bg[n] = 0; n++;
  };
  const clearAll = () => { for (let i = 0; i < n; i++) fx.burst(bx[i], by[i], 1, COLS[bc[i]], 60, 0.4); n = 0; };

  const level = () => Math.min(1 + t / 25, 4);
  const patterns = [
    (dt: number) => { // rotating spiral arms
      emitAng += dt * 2.2;
      if (Math.floor(t * 14) !== Math.floor((t - dt) * 14)) for (let k = 0; k < 3 + Math.floor(level()); k++) fire(em.x, em.y, emitAng + k * (Math.PI * 2 / (3 + Math.floor(level()))), 120 + level() * 15, 5, 0);
    },
    (dt: number) => { // expanding rings with a gap
      if (Math.floor(t * 1.6) !== Math.floor((t - dt) * 1.6)) {
        const m = 22 + Math.floor(level() * 6), off = api.rnd() * Math.PI * 2;
        for (let k = 0; k < m; k++) fire(em.x, em.y, off + (k / m) * Math.PI * 2, 140, 6, 2);
      }
    },
    (dt: number) => { // aimed fans
      if (Math.floor(t * 2.4) !== Math.floor((t - dt) * 2.4)) {
        const a = Math.atan2(p.y - em.y, p.x - em.x);
        for (let k = -3; k <= 3; k++) fire(em.x, em.y, a + k * 0.13, 210 + level() * 20, 5, 1);
      }
    },
    (dt: number) => { // curtain rain from the top
      if (Math.floor(t * 10) !== Math.floor((t - dt) * 10)) fire(api.rnd() * w, -10, Math.PI / 2 + (api.rnd() - 0.5) * 0.3, 140 + api.rnd() * 80, 4, 4);
    },
    (dt: number) => { // flower: double counter-spirals
      emitAng += dt * 1.4;
      if (Math.floor(t * 9) !== Math.floor((t - dt) * 9)) for (let k = 0; k < 6; k++) { fire(em.x, em.y, emitAng + k * Math.PI / 3, 110, 5, 3); fire(em.x, em.y, -emitAng + k * Math.PI / 3, 110, 5, 0); }
    },
  ];

  return {
    update(dt) {
      fx.update(dt);
      flash = Math.max(0, flash - dt);
      if (dead) { deadT += dt; if (deadT > 1.4) api.gameOver({ message: `${t.toFixed(1)}s · ${graze} grazes` }); }
      else {
        t += dt; patT += dt;
        if (patT > 7) { patT = 0; pat = (pat + 1 + api.rndInt(0, patterns.length - 2)) % patterns.length; }
        patterns[pat](dt);
        if (level() > 2.5) patterns[(pat + 2) % patterns.length](dt * 0.5);
        em.x = w / 2 + Math.sin(t * 0.7) * 160;
        api.setScore(t * 50 + graze * 10);

        const focus = input.down('b');
        const sp = focus ? 150 : 300;
        p.x += input.axisX() * sp * dt; p.y += input.axisY() * sp * dt;
        if (input.pointer.down) { p.x += (input.pointer.x - p.x) * Math.min(1, dt * 12); p.y += (input.pointer.y - 60 - p.y) * Math.min(1, dt * 12); }
        p.x = clamp(p.x, 10, w - 10); p.y = clamp(p.y, 20, h - 14);
        p.inv = Math.max(0, p.inv - dt);
      }

      for (let i = 0; i < n; i++) {
        bx[i] += bvx[i] * dt; by[i] += bvy[i] * dt;
        if (bx[i] < -20 || bx[i] > w + 20 || by[i] < -40 || by[i] > h + 20) {
          const j = --n; bx[i] = bx[j]; by[i] = by[j]; bvx[i] = bvx[j]; bvy[i] = bvy[j]; br[i] = br[j]; bc[i] = bc[j]; bg[i] = bg[j]; i--; continue;
        }
        if (dead) continue;
        const dx = bx[i] - p.x, dy = by[i] - p.y, d2 = dx * dx + dy * dy;
        const hit = br[i] + 3;
        if (d2 < hit * hit && p.inv <= 0) {
          lives--; sfx.boom(); api.shake(12); flash = 0.3;
          fx.burst(p.x, p.y, 40, C.white, 220, 0.9, 2);
          clearAll(); p.inv = 2;
          if (lives <= 0) { dead = true; sfx.lose(); }
          break;
        } else if (!bg[i] && d2 < (br[i] + 16) ** 2 && p.inv <= 0) {
          bg[i] = 1; graze++; sfx.tick();
          fx.burst(p.x + dx * 0.5, p.y + dy * 0.5, 2, '#ffffff', 80, 0.25);
        }
      }
    },

    render(g) {
      g.fillStyle = '#0a0012'; g.fillRect(0, 0, w, h);
      const sc = (t * 40) % 40;
      g.strokeStyle = 'rgba(167,139,250,0.08)'; g.lineWidth = 1; g.beginPath();
      for (let y = -40 + sc; y < h; y += 40) { g.moveTo(0, y); g.lineTo(w, y); }
      g.stroke();
      // emitter
      g.save(); g.translate(em.x, em.y); g.rotate(t * 2);
      g.strokeStyle = C.pink; g.lineWidth = 2;
      g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo(Math.cos(k * Math.PI / 3) * 18, Math.sin(k * Math.PI / 3) * 18); g.stroke();
      g.restore();
      // bullets: halo pass then core pass (two fills per colour batch)
      for (let i = 0; i < n; i++) { g.fillStyle = COLS[bc[i]]; g.globalAlpha = 0.25; g.beginPath(); g.arc(bx[i], by[i], br[i] * 1.9, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
      for (let i = 0; i < n; i++) { g.fillStyle = COLS[bc[i]]; g.beginPath(); g.arc(bx[i], by[i], br[i], 0, 6.283); g.fill(); }
      g.fillStyle = '#fff';
      for (let i = 0; i < n; i++) { g.beginPath(); g.arc(bx[i], by[i], br[i] * 0.45, 0, 6.283); g.fill(); }
      // player
      if (!dead && (p.inv <= 0 || Math.floor(p.inv * 12) % 2)) {
        g.fillStyle = '#fff';
        g.beginPath(); g.moveTo(p.x, p.y - 12); g.lineTo(p.x + 9, p.y + 9); g.lineTo(p.x, p.y + 4); g.lineTo(p.x - 9, p.y + 9); g.closePath(); g.fill();
        if (input.down('b')) { g.strokeStyle = C.pink; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, 16, 0, 6.283); g.stroke(); }
        g.fillStyle = C.pink; g.beginPath(); g.arc(p.x, p.y, 3, 0, 6.283); g.fill();
      }
      fx.render(g);
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, w, h); }
      for (let i = 0; i < lives; i++) { g.fillStyle = C.pink; g.fillRect(14 + i * 16, h - 22, 10, 10); }
      text(g, `GRAZE ${graze}`, w - 14, h - 22, { size: 9, color: C.dim, align: 'right' });
      text(g, `${t.toFixed(1)}s`, w / 2, 14, { size: 11, color: C.white, align: 'center' });
    },
  };
};

export default dodge;
