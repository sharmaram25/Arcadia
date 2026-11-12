import type { GameFactory } from '../core/types';
import { C, Particles, makeBackdrop, stars, text } from '../core/draw';

const SHORT = 'arc byte code data echo flux grid hack jolt key lag loop node null ping port ram rom run sync tick wave zap bit bot cpu dot fan gem hex ink jet lux map net orb pix ray set tab vim web zip bug cap dev git log mux pod'.split(' ');
const MID = 'pixel vector arcade neon laser sprite canvas buffer cursor kernel socket packet render shader script toggle signal stream syntax thread binary cipher crypto docker filter glitch matrix module object parser plasma portal python quartz router server tensor uplink vertex widget joystick quantum'.split(' ');
const LONG = 'algorithm bandwidth benchmark component framework hyperlink interface mainframe overclock processor recursion simulator spreadsheet stylesheet terminal transistor typescript wireframe compiler debugger firmware highscore keyboard metadata protocol database deadline meeting synergy quarterly'.split(' ');

interface Word { s: string; x: number; y: number; vy: number; typed: number }
interface Beam { x: number; y: number; t: number }

const typestorm: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const GROUND = h - 46;
  let words: Word[] = [];
  let target: Word | null = null;
  let lives = 3, wave = 1, spawnT = 0.5, spawned = 0, combo = 0, bestCombo = 0;
  let chars = 0, misses = 0, dead = false, deadT = 0, flash = 0;
  const beams: Beam[] = [];
  const fx = new Particles(500, 120);
  const bg = makeBackdrop(w, h, g => {
    g.fillStyle = '#07060d'; g.fillRect(0, 0, w, h);
    stars(g, w, GROUND, 90, api.rnd);
    g.fillStyle = '#140d24'; g.fillRect(0, GROUND, w, h - GROUND);
    g.fillStyle = '#ff4fa3'; g.fillRect(0, GROUND, w, 2);
  });

  const perWave = () => 8 + wave * 3;
  const spawn = () => {
    const pool = wave < 3 ? (api.rnd() < 0.7 ? SHORT : MID) : wave < 6 ? (api.rnd() < 0.55 ? MID : api.rnd() < 0.6 ? SHORT : LONG) : (api.rnd() < 0.5 ? LONG : MID);
    let s = api.pick(pool), tries = 0;
    // avoid two on-screen words sharing a first letter: keeps targeting unambiguous
    while (words.some(o => o.s[0] === s[0]) && tries++ < 12) s = api.pick(pool);
    const tw = s.length * 13;
    words.push({ s, x: 20 + api.rnd() * (w - 40 - tw), y: -10, vy: 22 + wave * 5 + api.rnd() * 10, typed: 0 });
    spawned++;
  };

  const kill = (wd: Word) => {
    const cx = wd.x + wd.s.length * 6.5, cy = wd.y;
    beams.push({ x: cx, y: cy, t: 0.15 });
    fx.burst(cx, cy, 10 + wd.s.length * 3, C.pink, 200, 0.7, 2);
    combo++; bestCombo = Math.max(bestCombo, combo);
    api.addScore(wd.s.length * 10 * Math.min(1 + Math.floor(combo / 5), 5));
    words = words.filter(o => o !== wd);
    target = null;
    sfx.shoot();
  };

  return {
    update(dt) {
      fx.update(dt);
      for (const b of beams) b.t -= dt;
      while (beams.length && beams[0].t <= 0) beams.shift();
      flash = Math.max(0, flash - dt);
      if (dead) { deadT += dt; if (deadT > 1.2) api.gameOver({ message: `Wave ${wave} · ${Math.round(chars / 5 / Math.max(api.time / 60, 0.1))} WPM` }); return; }

      if (input.codesPressed.includes('Backspace') && target) { target.typed = 0; target = null; sfx.blip(); }
      for (const ch of input.typed) {
        if (!target) {
          const cands = words.filter(o => o.s[0] === ch).sort((a, b) => b.y - a.y);
          if (cands.length) target = cands[0];
        }
        if (target && target.s[target.typed] === ch) {
          target.typed++; chars++; sfx.key();
          if (target.typed === target.s.length) kill(target);
        } else { misses++; combo = 0; flash = 0.12; sfx.blip(); }
      }

      spawnT -= dt;
      if (spawnT <= 0 && spawned < perWave()) { spawn(); spawnT = Math.max(0.55, 2.1 - wave * 0.16) * (0.7 + api.rnd() * 0.6); }
      if (spawned >= perWave() && words.length === 0) { wave++; spawned = 0; spawnT = 1.5; sfx.power(); api.addScore(wave * 50); }

      for (const wd of words) {
        wd.y += wd.vy * dt * (wd === target ? 0.85 : 1);
        if (wd.y >= GROUND - 4) {
          lives--; combo = 0; api.shake(10); sfx.hit();
          fx.burst(wd.x + wd.s.length * 6, GROUND, 30, C.orange, 180, 0.8, 3);
          if (wd === target) target = null;
          wd.y = 9999;
          if (lives <= 0) { dead = true; sfx.lose(); }
        }
      }
      words = words.filter(o => o.y < 9000);
    },

    render(g) {
      bg(g);
      // turret
      const tx = w / 2, ty = GROUND + 2;
      g.fillStyle = '#ff4fa3'; g.fillRect(tx - 18, ty, 36, 10); g.fillRect(tx - 4, ty - 12, 8, 14);
      for (const b of beams) {
        g.strokeStyle = C.pink; g.globalAlpha = b.t / 0.15; g.lineWidth = 3;
        g.beginPath(); g.moveTo(tx, ty - 12); g.lineTo(b.x, b.y); g.stroke();
      }
      g.globalAlpha = 1;

      g.font = `600 20px ui-monospace, Menlo, Consolas, monospace`;
      g.textBaseline = 'middle'; g.textAlign = 'left';
      for (const wd of words) {
        const danger = wd.y > GROUND - 110;
        const isT = wd === target;
        const tw = g.measureText(wd.s).width;
        if (isT) { g.fillStyle = 'rgba(255,79,163,0.14)'; g.fillRect(wd.x - 6, wd.y - 14, tw + 12, 28); }
        g.fillStyle = isT ? C.white : danger ? C.orange : '#c7c9dc';
        const done = wd.s.slice(0, wd.typed);
        g.fillText(wd.s, wd.x, wd.y);
        if (done) { g.fillStyle = C.pink; g.fillText(done, wd.x, wd.y); }
      }
      fx.render(g);
      if (flash > 0) { g.fillStyle = `rgba(255,90,95,${flash})`; g.fillRect(0, 0, w, h); }

      text(g, `WAVE ${wave}`, 14, h - 30, { size: 10, color: C.dim });
      text(g, 'SHIELD', w - 120, h - 30, { size: 8, color: C.dim });
      for (let i = 0; i < 3; i++) { g.fillStyle = i < lives ? C.green : '#2a2f42'; g.fillRect(w - 60 + i * 16, h - 31, 12, 10); }
      if (combo >= 5) text(g, `COMBO x${Math.min(1 + Math.floor(combo / 5), 5)}`, w / 2, h - 18, { size: 9, color: C.yellow, align: 'center' });
      if (api.time < 4 && !words.length) text(g, 'START TYPING THE FALLING WORDS', w / 2, h / 2, { size: 10, color: C.dim, align: 'center' });
    },
  };
};

export default typestorm;
