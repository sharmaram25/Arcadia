import type { GameFactory } from '../core/types';
import { C, Particles, text } from '../core/draw';

interface Target { x: number; y: number; r: number; life: number; max: number; born: number }
interface Pop { x: number; y: number; s: string; t: number; c: string }

const ROUND = 30;

const reflex: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  let targets: Target[] = [], pops: Pop[] = [];
  let time = ROUND, spawnT = 0.4, streak = 0, hits = 0, shots = 0, reactSum = 0, over = false, overT = 0, started = false;
  const fx = new Particles(400);

  const spawn = () => {
    const prog = 1 - time / ROUND;
    const r = 34 - prog * 12;
    const max = 1.5 - prog * 0.6;
    let x = 0, y = 0;
    for (let i = 0; i < 20; i++) {
      x = 50 + api.rnd() * (w - 100); y = 70 + api.rnd() * (h - 120);
      if (targets.every(t => Math.hypot(t.x - x, t.y - y) > 90)) break;
    }
    targets.push({ x, y, r, life: max, max, born: api.time });
  };

  return {
    update(dt) {
      fx.update(dt);
      for (const p of pops) { p.t -= dt; p.y -= 40 * dt; }
      pops = pops.filter(p => p.t > 0);
      if (over) {
        overT += dt;
        if (overT > 1.2) api.gameOver({ message: `${shots ? Math.round((hits / shots) * 100) : 0}% accuracy · ${hits ? Math.round((reactSum / hits) * 1000) : 0} ms avg` });
        return;
      }
      if (!started) { if (input.pointer.pressed) started = true; else { if (!targets.length) spawn(); return; } }
      time -= dt;
      if (time <= 0) { time = 0; over = true; sfx.win(); return; }

      spawnT -= dt;
      const maxOn = 2 + Math.floor((1 - time / ROUND) * 3);
      if (spawnT <= 0 && targets.length < maxOn) { spawn(); spawnT = 0.35 + api.rnd() * 0.35; }

      for (const t of targets) {
        t.life -= dt;
        if (t.life <= 0) { streak = 0; pops.push({ x: t.x, y: t.y, s: 'MISS', t: 0.6, c: C.dim }); }
      }
      targets = targets.filter(t => t.life > 0);

      const p = input.pointer;
      if (p.pressed) {
        shots++;
        let hit: Target | null = null;
        for (const t of targets) { const s = t.r * (t.life / t.max) * 0.6 + t.r * 0.4; if (Math.hypot(p.x - t.x, p.y - t.y) <= s + 4) { hit = t; break; } }
        if (hit) {
          hits++; streak++;
          const react = hit.max - hit.life; reactSum += react;
          const mult = Math.min(1 + Math.floor(streak / 5), 5);
          const pts = Math.round((60 + 140 * (hit.life / hit.max)) * mult);
          api.addScore(pts);
          pops.push({ x: hit.x, y: hit.y - 10, s: `+${pts}`, t: 0.7, c: mult > 1 ? C.yellow : C.white });
          fx.burst(hit.x, hit.y, 22, C.red, 220, 0.5, 3);
          sfx.note(520 + Math.min(streak, 12) * 40, 0.08);
          targets = targets.filter(t => t !== hit);
        } else {
          streak = 0; api.addScore(-20); sfx.blip();
          pops.push({ x: p.x, y: p.y, s: '-20', t: 0.5, c: C.red });
        }
      }
    },

    render(g) {
      g.fillStyle = '#0d0204'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,71,87,0.06)';
      for (let y = 0; y < h; y += 24) for (let x = (y / 24) % 2 ? 12 : 0; x < w; x += 24) g.fillRect(x, y, 2, 2);
      for (const t of targets) {
        const k = t.life / t.max, s = t.r * k * 0.6 + t.r * 0.4;
        for (let i = 4; i >= 1; i--) { g.fillStyle = i % 2 ? C.red : '#fff2f2'; g.beginPath(); g.arc(t.x, t.y, (s * i) / 4, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2;
        g.beginPath(); g.arc(t.x, t.y, t.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
      }
      fx.render(g);
      for (const p of pops) text(g, p.s, p.x, p.y, { size: 11, align: 'center', color: p.c, alpha: Math.min(1, p.t * 2) });
      // HUD
      const tf = time / ROUND;
      g.fillStyle = '#2a0a10'; g.fillRect(0, 0, w, 6);
      g.fillStyle = tf < 0.2 ? C.yellow : C.red; g.fillRect(0, 0, w * tf, 6);
      text(g, time.toFixed(1), 16, 18, { size: 12, color: '#fff' });
      if (streak >= 5) text(g, `STREAK ${streak}  x${Math.min(1 + Math.floor(streak / 5), 5)}`, w - 16, 18, { size: 10, color: C.yellow, align: 'right' });
      if (!started) text(g, 'CLICK THE TARGET TO START', w / 2, h - 40, { size: 11, align: 'center', color: '#fff' });
      if (input.pointer.active) {
        const { x, y } = input.pointer;
        g.strokeStyle = '#fff'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x - 4, y); g.moveTo(x + 4, y); g.lineTo(x + 12, y); g.moveTo(x, y - 12); g.lineTo(x, y - 4); g.moveTo(x, y + 4); g.lineTo(x, y + 12); g.stroke();
      }
    },
  };
};

export default reflex;
