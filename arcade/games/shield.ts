import type { GameFactory } from '../core/types';
import { C, Particles, clamp, text } from '../core/draw';

interface Missile { sx: number; sy: number; x: number; y: number; tx: number; ty: number; sp: number; split: boolean; friendly: boolean; dead?: boolean }
interface Blast { x: number; y: number; t: number; friendly: boolean }

const GROUND = 560, BLAST_R = 46, BLAST_T = 1.3;

const shield: GameFactory = (api) => {
  const { input, sfx, w, h } = api;
  const cities = [130, 210, 290, 510, 590, 670].map(x => ({ x, alive: true }));
  const bats = [{ x: 40, ammo: 10, alive: true }, { x: 400, ammo: 10, alive: true }, { x: 760, ammo: 10, alive: true }];
  let ms: Missile[] = [], blasts: Blast[] = [];
  let wave = 0, toSpawn = 0, spawnT = 0, between = 2, tally = 0, over = false, overT = 0, nextCity = 10000;
  const cross = { x: w / 2, y: h / 2 };
  const fx = new Particles(300, 200);
  const stars = Array.from({ length: 80 }, () => [api.rnd() * w, api.rnd() * 420]);

  const targets = () => [...cities.filter(c => c.alive).map(c => c.x), ...bats.filter(b => b.alive).map(b => b.x)];
  const startWave = () => {
    wave++; toSpawn = 8 + wave * 3; spawnT = 0.5;
    bats.forEach(b => { b.alive = true; b.ammo = 10; });
  };

  const enemy = (sx: number, sy: number, split: boolean) => {
    const ts = targets();
    if (!ts.length) return;
    const tx = api.pick(ts);
    ms.push({ sx, sy, x: sx, y: sy, tx, ty: GROUND, sp: 28 + wave * 7 + api.rnd() * 12, split, friendly: false });
  };

  const fire = (x: number, y: number) => {
    if (y > GROUND - 30) return;
    let best = -1, bd = 1e9;
    bats.forEach((b, i) => { if (b.alive && b.ammo > 0 && Math.abs(b.x - x) < bd) { bd = Math.abs(b.x - x); best = i; } });
    if (best < 0) { sfx.blip(); return; }
    const b = bats[best]; b.ammo--;
    ms.push({ sx: b.x, sy: GROUND - 18, x: b.x, y: GROUND - 18, tx: x, ty: y, sp: best === 1 ? 620 : 460, split: false, friendly: true });
    sfx.shoot();
  };

  const boom = (x: number, y: number, friendly: boolean) => {
    blasts.push({ x, y, t: 0, friendly });
    if (!friendly) { sfx.boom(); api.shake(6); } else sfx.hit();
  };

  return {
    update(dt) {
      fx.update(dt);
      if (over) { overT += dt; if (overT > 1.8) api.gameOver({ message: `Wave ${wave}` }); }

      // crosshair: pointer or keys
      if (input.pointer.active) { cross.x = input.pointer.x; cross.y = input.pointer.y; }
      const ax = input.axisX(), ay = input.axisY();
      if (ax || ay) { input.pointer.active = false; cross.x = clamp(cross.x + ax * 520 * dt, 0, w); cross.y = clamp(cross.y + ay * 520 * dt, 0, GROUND - 40); }
      if (!over && wave > 0 && tally <= 0) {
        if (input.pointer.pressed) fire(input.pointer.x, input.pointer.y);
        if (input.pressed('a')) fire(cross.x, cross.y);
      }

      // waves
      if (wave === 0 || (toSpawn === 0 && !ms.some(m => !m.friendly) && !blasts.length && tally <= 0 && !over)) {
        if (wave > 0 && tally === 0) {
          tally = 2.2;
          const bonus = bats.reduce((s, b) => s + b.ammo * 5, 0) + cities.filter(c => c.alive).length * 100;
          api.addScore(bonus * Math.min(1 + Math.floor(wave / 2), 6) / 1);
          sfx.coin();
        } else if (wave === 0) { between -= dt; if (between <= 0) startWave(); }
      }
      if (tally > 0) {
        tally -= dt;
        if (tally <= 0) {
          tally = 0;
          if (api.score >= nextCity) { const dead = cities.find(c => !c.alive); if (dead) { dead.alive = true; sfx.power(); } nextCity += 10000; }
          startWave();
        }
      }
      if (toSpawn > 0) {
        spawnT -= dt;
        if (spawnT <= 0) {
          enemy(api.rnd() * w, -10, wave >= 3 && api.rnd() < 0.2 + wave * 0.02);
          toSpawn--; spawnT = Math.max(0.25, 1.4 - wave * 0.1) * (0.5 + api.rnd());
        }
      }

      for (const m of ms) {
        const dx = m.tx - m.sx, dy = m.ty - m.sy, len = Math.hypot(dx, dy);
        m.x += (dx / len) * m.sp * dt; m.y += (dy / len) * m.sp * dt;
        const done = Math.hypot(m.x - m.sx, m.y - m.sy) >= len;
        if (m.friendly && done) { m.dead = true; boom(m.tx, m.ty, true); }
        if (!m.friendly) {
          if (m.split && m.y > 160 + api.rnd() * 100) { m.split = false; for (let k = 0; k < 2; k++) enemy(m.x, m.y, false); }
          if (done) {
            m.dead = true; boom(m.x, GROUND - 4, false);
            cities.forEach(c => { if (c.alive && Math.abs(c.x - m.x) < 26) { c.alive = false; fx.burst(c.x, GROUND - 10, 40, C.cyan, 200, 1, 3); } });
            bats.forEach(b => { if (b.alive && Math.abs(b.x - m.x) < 24) { b.alive = false; b.ammo = 0; fx.burst(b.x, GROUND - 10, 30, C.yellow, 180, 0.9, 3); } });
            if (!cities.some(c => c.alive) && !over) { over = true; sfx.lose(); }
          }
        }
      }
      for (const b of blasts) {
        b.t += dt;
        const r = Math.sin(Math.min(1, b.t / BLAST_T) * Math.PI) * BLAST_R;
        for (const m of ms) if (!m.friendly && !m.dead && Math.hypot(m.x - b.x, m.y - b.y) < r) {
          m.dead = true; api.addScore(25 * Math.min(1 + Math.floor(wave / 2), 6));
          blasts.push({ x: m.x, y: m.y, t: 0, friendly: true }); // chain reaction
          sfx.hit();
        }
      }
      ms = ms.filter(m => !m.dead);
      blasts = blasts.filter(b => b.t < BLAST_T);
    },

    render(g) {
      const sky = g.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#020210'); sky.addColorStop(0.75, '#1a0a3a'); sky.addColorStop(1, '#3a1040');
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x, y] of stars) g.fillRect(x, y, 1, 1);
      // ground
      g.fillStyle = '#2a1a08'; g.beginPath(); g.moveTo(0, GROUND);
      for (const b of bats) { g.lineTo(b.x - 40, GROUND); g.lineTo(b.x - 18, GROUND - 22); g.lineTo(b.x + 18, GROUND - 22); g.lineTo(b.x + 40, GROUND); }
      g.lineTo(w, GROUND); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = C.yellow; g.fillRect(0, GROUND, w, 2);
      // cities
      for (const c of cities) {
        if (!c.alive) { g.fillStyle = '#3a2a1a'; g.fillRect(c.x - 18, GROUND - 6, 36, 6); continue; }
        g.fillStyle = C.cyan;
        [[-18, 14], [-10, 24], [-2, 18], [6, 28], [14, 12]].forEach(([dx, bh]) => g.fillRect(c.x + dx, GROUND - bh, 7, bh));
        g.fillStyle = '#063040'; [[-8, 18], [8, 22]].forEach(([dx, y]) => g.fillRect(c.x + dx, GROUND - y, 2, 2));
      }
      // batteries + ammo pips
      for (const b of bats) {
        if (!b.alive) continue;
        for (let i = 0; i < b.ammo; i++) { const row = Math.floor(i / 4); g.fillStyle = C.white; g.fillRect(b.x - 8 + (i % 4) * 5 - row * 2, GROUND + 8 + row * 6, 3, 4); }
        g.fillStyle = C.yellow; g.beginPath(); g.moveTo(b.x - 8, GROUND - 22); g.lineTo(b.x, GROUND - 32); g.lineTo(b.x + 8, GROUND - 22); g.fill();
      }
      // missiles
      g.lineWidth = 2;
      for (const m of ms) {
        g.strokeStyle = m.friendly ? 'rgba(94,242,255,0.8)' : 'rgba(255,90,95,0.9)';
        g.beginPath(); g.moveTo(m.sx, m.sy); g.lineTo(m.x, m.y); g.stroke();
        g.fillStyle = '#fff'; g.fillRect(m.x - 1.5, m.y - 1.5, 3, 3);
        if (m.friendly) { g.strokeStyle = C.cyan; g.lineWidth = 1; g.beginPath(); g.moveTo(m.tx - 5, m.ty - 5); g.lineTo(m.tx + 5, m.ty + 5); g.moveTo(m.tx + 5, m.ty - 5); g.lineTo(m.tx - 5, m.ty + 5); g.stroke(); g.lineWidth = 2; }
      }
      for (const b of blasts) {
        const r = Math.sin(Math.min(1, b.t / BLAST_T) * Math.PI) * BLAST_R;
        const flick = Math.floor(b.t * 20) % 3;
        g.fillStyle = flick === 0 ? '#fff6d0' : flick === 1 ? C.yellow : C.orange;
        g.globalAlpha = 0.9; g.beginPath(); g.arc(b.x, b.y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      }
      fx.render(g);
      // crosshair
      g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cross.x - 10, cross.y); g.lineTo(cross.x - 3, cross.y); g.moveTo(cross.x + 3, cross.y); g.lineTo(cross.x + 10, cross.y);
      g.moveTo(cross.x, cross.y - 10); g.lineTo(cross.x, cross.y - 3); g.moveTo(cross.x, cross.y + 3); g.lineTo(cross.x, cross.y + 10); g.stroke();

      text(g, `WAVE ${wave}`, 14, 14, { size: 10, color: C.dim });
      text(g, `x${Math.min(1 + Math.floor(wave / 2), 6)} POINTS`, w - 14, 14, { size: 10, color: C.dim, align: 'right' });
      if (tally > 0) {
        text(g, 'WAVE CLEAR', w / 2, 220, { size: 18, align: 'center', color: C.yellow });
        text(g, `${cities.filter(c => c.alive).length} CITIES SAVED`, w / 2, 254, { size: 10, align: 'center', color: C.white });
      }
      if (wave === 0) text(g, 'DEFEND THE CITIES', w / 2, 240, { size: 16, align: 'center', color: C.yellow });
    },
  };
};

export default shield;
