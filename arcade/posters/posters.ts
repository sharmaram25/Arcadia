// One hand-composed flyer per cabinet. 600x800 logical units, painted once and cached.
import {
  type G, burst, floorGrid, frame, glow, halftone, label, mountains, rays, rng, rrect, sky, sprite, stars, sun, title, vector,
} from './kit';

export const PW = 600, PH = 800;
type Painter = (g: G) => void;

const T1 = 655;              // single-line title baseline
const T2a = 590, T2b = 660;  // two-line title baselines

// ── Sprites ──────────────────────────────────────────────────────
const RUNNER = [
  '....oooo....',
  '...owwwwo...',
  '...owkwko...',
  '...owwwwo...',
  '....oooo....',
  '..oocccco...',
  '.occccccco..',
  'oc.occcco.co',
  '...occcco...',
  '...oo..oo...',
  '..oo....oo..',
  '.oo......oo.',
];
const CRITTER = [
  '..gg....gg..',
  '.gwkg..gwkg.',
  '.gggggggggg.',
  'gggggggggggg',
  'g.gggggggg.g',
  '..gyyyyyyg..',
  '.gg.gggg.gg.',
  'gg........gg',
];
const CLIMBER = [
  '...rrrr...',
  '..rrrrrr..',
  '..ssksks..',
  '..ssssss..',
  '...bbbb...',
  '.sbbbbbbs.',
  '.s.bbbb.s.',
  '...bbbb...',
  '..bb..bb..',
  '.kk....kk.',
];
const INVADER_A = [
  '...p....p...',
  '....p..p....',
  '...pppppp...',
  '..pp.pp.pp..',
  '.pppppppppp.',
  '.p.pppppp.p.',
  '.p.p....p.p.',
  '....pp.pp...',
];
const INVADER_B = [
  '....gggg....',
  '.gggggggggg.',
  'ggg.gggg.ggg',
  'gggggggggggg',
  '..gg.gg.gg..',
  '.gg..gg..gg.',
  'g..........g',
];
const CANNON = [
  '.....cc.....',
  '....cccc....',
  '.cccccccccc.',
  'cccccccccccc',
  'cccccccccccc',
];
const SHIP_SIDE = [
  '..cc..........',
  '..ccc.........',
  '.cccccc.......',
  'ccccccccccwww.',
  'cccccccccccccc',
  '.pppppppppp...',
  '..pp..........',
];
const ENEMY_SIDE = [
  '....rrrr..',
  '..rrrrrrrr',
  'yrrrkkrrrr',
  '..rrrrrrrr',
  '....rrrr..',
];

// ── Posters ──────────────────────────────────────────────────────
const P: Record<string, Painter> = {
  snake(g) {
    sky(g, PW, PH, [[0, '#020a06'], [0.45, '#06301c'], [0.62, '#0f5a35']]);
    stars(g, PW, PH, 140, 11, 380);
    sun(g, 300, 420, 120, '#c9ff6b', '#1ea05a');
    mountains(g, PW, 440, 90, '#04170d', 4, 10, '#2cff8a55');
    floorGrid(g, PW, PH, 440, '#2cff8a', { fill: '#03140b' });
    // giant coiling snake made of segments along a curve
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      pts.push([120 + t * 360 + Math.sin(t * 9) * 40, 610 - t * 330 + Math.cos(t * 7) * 30]);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const [x, y] = pts[i], s = 12 + (i / pts.length) * 22;
      glow(g, '#2cff8a', 14, () => { g.fillStyle = i % 2 ? '#1fd873' : '#46ff9c'; g.fillRect(x - s / 2, y - s / 2, s, s); });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - s / 2, y - s / 2, s, s * 0.22);
    }
    const [hx, hy] = pts[pts.length - 1];
    g.fillStyle = '#d8ffe6'; g.fillRect(hx - 22, hy - 22, 44, 44);
    g.fillStyle = '#04170d'; g.fillRect(hx - 12, hy - 10, 8, 8); g.fillRect(hx + 6, hy - 10, 8, 8);
    g.fillStyle = '#ff4757'; g.fillRect(hx + 18, hy + 4, 18, 4); g.fillRect(hx + 34, hy, 4, 4); g.fillRect(hx + 34, hy + 8, 4, 4);
    glow(g, '#ffd23f', 30, () => { g.fillStyle = '#ffd23f'; g.fillRect(470, 210, 34, 34); });
    title(g, 'NEON', 300, T2a, { size: 66, top: '#f4fff0', mid: '#a6ff9e', bot: '#0f8a48', glowColor: '#2cff8a', outline: '#021007', maxWidth: 540 });
    title(g, 'SNAKE', 300, T2b, { size: 76, top: '#f4fff0', mid: '#a6ff9e', bot: '#0f8a48', glowColor: '#2cff8a', outline: '#021007', maxWidth: 540 });
    frame(g, PW, PH, { accent: '#2cff8a', accent2: '#ffd23f', accent3: '#0f8a48', tagline: 'Eat. Grow. Never look back.', genre: 'GRID ACTION', year: 1981 }, 1);
  },

  fuse(g) {
    sky(g, PW, PH, [[0, '#1c1000'], [0.6, '#4a2a00'], [1, '#120800']]);
    rays(g, 300, 330, '#ffd23f', 22, 900, 0.1);
    const tiles: [number, number, number, number, number][] = [[2, 110, 170, 74, -0.2], [4, 420, 140, 80, 0.15], [8, 160, 330, 96, 0.1], [16, 390, 300, 104, -0.12], [64, 250, 420, 120, 0.06], [2048, 300, 250, 170, 0]];
    const pal: Record<number, [string, string]> = { 2: ['#2b3045', '#dfe4f7'], 4: ['#3a4160', '#ffffff'], 8: ['#c26a12', '#fff2d8'], 16: ['#d4521a', '#fff2d8'], 64: ['#d61f45', '#ffe0e8'], 2048: ['#ffd23f', '#2a1800'] };
    for (const [v, x, y, s, rot] of tiles) {
      g.save(); g.translate(x, y); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,0.5)'; rrect(g, -s / 2 + 8, -s / 2 + 12, s, s, s * 0.12); g.fill();
      glow(g, pal[v][0], v === 2048 ? 50 : 16, () => { g.fillStyle = pal[v][0]; rrect(g, -s / 2, -s / 2, s, s, s * 0.12); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,0.25)'; rrect(g, -s / 2 + 4, -s / 2 + 4, s - 8, s * 0.3, s * 0.08); g.fill();
      label(g, String(v), 0, s * 0.16, v > 999 ? s * 0.22 : s * 0.36, pal[v][1]);
      g.restore();
    }
    halftone(g, 0, 470, PW, 200, 'rgba(255,210,63,0.18)', 8, false);
    title(g, 'FUSE', 300, T2a, { size: 84, top: '#fffbe8', mid: '#ffd23f', bot: '#b35a00', glowColor: '#ffb000', outline: '#1a0b00', depthColor: '#3a1c00' });
    title(g, '2048', 300, T2b, { size: 64, top: '#fffbe8', mid: '#ffd23f', bot: '#b35a00', outline: '#1a0b00', depthColor: '#3a1c00' });
    frame(g, PW, PH, { accent: '#ffd23f', accent2: '#ff8a3d', accent3: '#d61f45', tagline: 'Slide it. Merge it. Make history.', genre: 'PUZZLE', year: 1984, isNew: true }, 2);
  },

  glide(g) {
    sky(g, PW, PH, [[0, '#04030f'], [0.55, '#1d0b3d'], [0.75, '#5a1460']]);
    stars(g, PW, PH, 160, 3, 420);
    sun(g, 300, 470, 140, '#ff9de0', '#7a1fff', 9);
    // skyline
    const r = rng(9);
    for (let i = 0; i < 18; i++) {
      const x = i * 36 - 10, bh = 60 + r() * 150;
      g.fillStyle = '#0c0620'; g.fillRect(x, 520 - bh, 32, bh);
      g.fillStyle = '#ffcf4a';
      for (let k = 0; k < 10; k++) if (r() > 0.6) g.fillRect(x + 4 + (k % 3) * 9, 525 - bh + 10 + Math.floor(k / 3) * 14, 4, 5);
    }
    floorGrid(g, PW, PH, 520, '#ff4fa3', { fill: '#140525' });
    // gates
    for (const [x, gy] of [[90, 260], [430, 330]] as const) {
      g.fillStyle = '#071a26'; g.fillRect(x, 36, 70, gy - 90 - 36); g.fillRect(x, gy + 90, 70, 520 - gy - 90);
      glow(g, '#5ef2ff', 18, () => { g.fillStyle = '#5ef2ff'; g.fillRect(x, gy - 96, 70, 8); g.fillRect(x, gy + 88, 70, 8); });
    }
    // ship with swoosh trail
    vector(g, '#5ef2ff', 4, () => { g.beginPath(); g.moveTo(40, 420); g.bezierCurveTo(160, 470, 220, 220, 300, 270); g.stroke(); });
    g.save(); g.translate(310, 266); g.rotate(-0.35);
    glow(g, '#5ef2ff', 30, () => { g.fillStyle = '#5ef2ff'; g.beginPath(); g.moveTo(46, 0); g.lineTo(-30, -30); g.lineTo(-14, 0); g.lineTo(-30, 30); g.closePath(); g.fill(); });
    g.fillStyle = '#fff'; g.fillRect(4, -6, 12, 12);
    g.restore();
    title(g, 'NEON', 300, T2a, { size: 64, top: '#ffffff', mid: '#9ffcff', bot: '#ff4fa3', glowColor: '#5ef2ff', outline: '#10001f', skew: -0.12 });
    title(g, 'GLIDE', 300, T2b, { size: 80, top: '#ffffff', mid: '#9ffcff', bot: '#ff4fa3', glowColor: '#ff4fa3', outline: '#10001f', skew: -0.12 });
    frame(g, PW, PH, { accent: '#5ef2ff', accent2: '#ff4fa3', accent3: '#7a1fff', tagline: 'One button. No mercy.', genre: 'ONE-BUTTON', year: 1985, isNew: true }, 3);
  },

  sweeper(g) {
    sky(g, PW, PH, [[0, '#070a12'], [1, '#1a2238']]);
    // tilted minefield board
    g.save(); g.translate(300, 330); g.transform(1, 0, 0, 0.55, 0, 0); g.rotate(Math.PI / 4);
    const N = 9, S = 44, o = -N * S / 2;
    const r = rng(5);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const open = r() > 0.45;
      g.fillStyle = open ? '#121726' : '#39425f'; g.fillRect(o + x * S, o + y * S, S - 3, S - 3);
      if (!open) { g.fillStyle = '#4c5880'; g.fillRect(o + x * S, o + y * S, S - 3, 5); }
      else if (r() > 0.6) { const n = 1 + Math.floor(r() * 3); label(g, String(n), o + x * S + S / 2 - 1, o + y * S + S / 2 + 8, 18, ['#5ea8ff', '#4dff8a', '#ff5a5f'][n - 1]); }
    }
    g.restore();
    // explosion
    rays(g, 330, 300, '#ffb000', 16, 260, 0.25);
    glow(g, '#ff5a5f', 60, () => { g.fillStyle = '#ffb000'; g.beginPath(); g.arc(330, 300, 46, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(330, 300, 22, 0, Math.PI * 2); g.fill();
    // mine
    g.fillStyle = '#111'; g.beginPath(); g.arc(180, 250, 26, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillRect(180 + Math.cos(a) * 30 - 4, 250 + Math.sin(a) * 30 - 4, 8, 8); }
    g.fillStyle = '#fff'; g.fillRect(170, 240, 6, 6);
    // flags
    for (const [x, y] of [[420, 180], [460, 420], [130, 420]] as const) {
      g.fillStyle = '#d0d4e4'; g.fillRect(x, y, 4, 46);
      glow(g, '#ffcf4a', 14, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 34, y + 12); g.lineTo(x + 4, y + 24); g.fill(); });
    }
    title(g, 'SWEEPER', 300, T1, { size: 70, top: '#ffffff', mid: '#c9d3f5', bot: '#4c5880', glowColor: '#5ea8ff', outline: '#05070d', depthColor: '#1a2238' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#ff5a5f', accent3: '#5ea8ff', tagline: 'Think twice. Click once.', genre: 'LOGIC', year: 1983, isNew: true }, 4);
  },

  typestorm(g) {
    sky(g, PW, PH, [[0, '#0b0414'], [0.5, '#2a0b3a'], [1, '#0b0414']]);
    // storm clouds
    const r = rng(7);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(60,30,90,${0.4 + r() * 0.4})`; g.beginPath(); g.arc(r() * PW, 60 + r() * 120, 30 + r() * 50, 0, Math.PI * 2); g.fill(); }
    // lightning
    vector(g, '#ff9de0', 4, () => { g.beginPath(); g.moveTo(420, 120); g.lineTo(380, 220); g.lineTo(410, 220); g.lineTo(350, 360); g.stroke(); });
    // falling words
    const words = ['SYNTAX', 'KERNEL', 'PIXEL', 'DEADLINE', 'ZAP', 'BYTE', 'VECTOR'];
    const spots: [number, number][] = [[40, 230], [380, 210], [210, 300], [60, 400], [420, 330], [250, 440], [420, 450]];
    words.forEach((wd, i) => {
      const [x, y] = spots[i];
      g.font = '600 24px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'left';
      g.fillStyle = 'rgba(255,79,163,0.25)'; g.fillRect(x - 6, y - 22, g.measureText(wd).width + 12, 30);
      g.fillStyle = i === 3 ? '#ff4fa3' : '#e9e3ff'; g.fillText(wd, x, y);
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x + 10, y - 60, 2, 30);
    });
    // turret + beam
    g.fillStyle = '#ff4fa3'; g.fillRect(270, 520, 60, 16); g.fillRect(292, 496, 16, 26);
    vector(g, '#ff4fa3', 5, () => { g.beginPath(); g.moveTo(300, 496); g.lineTo(140, 290); g.stroke(); });
    glow(g, '#ffcf4a', 40, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(140, 290, 18, 0, Math.PI * 2); g.fill(); });
    halftone(g, 0, 470, PW, 120, 'rgba(255,79,163,0.2)', 7, false);
    title(g, 'TYPE', 300, T2a, { size: 72, top: '#ffffff', mid: '#ffc2e4', bot: '#ff2f8a', glowColor: '#ff4fa3', outline: '#14001a', skew: -0.1 });
    title(g, 'STORM', 300, T2b, { size: 78, top: '#ffffff', mid: '#ffc2e4', bot: '#ff2f8a', glowColor: '#ff4fa3', outline: '#14001a', skew: -0.1 });
    frame(g, PW, PH, { accent: '#ff4fa3', accent2: '#ffcf4a', accent3: '#7a1fff', tagline: 'Your keyboard is the last line of defence.', genre: 'TYPING', year: 1986, isNew: true }, 5);
  },

  solitaire(g) {
    sky(g, PW, PH, [[0, '#04170e'], [1, '#0d3a26']]);
    const spot = g.createRadialGradient(300, 320, 20, 300, 320, 420);
    spot.addColorStop(0, 'rgba(255,240,200,0.25)'); spot.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = spot; g.fillRect(0, 0, PW, PH);
    const SUITS = ['♠', '♥', '♦', '♣'], RK = ['A', 'K', 'Q', 'J', '10'];
    for (let i = 0; i < 5; i++) {
      g.save(); g.translate(300, 470); g.rotate(-0.6 + i * 0.3); g.translate(0, -230);
      g.fillStyle = 'rgba(0,0,0,0.5)'; rrect(g, -76, -104, 160, 224, 14); g.fill();
      g.fillStyle = '#f6f2e6'; rrect(g, -80, -110, 160, 224, 14); g.fill();
      const red = i % 4 === 1 || i % 4 === 2, col = red ? '#c8323a' : '#15161c';
      g.fillStyle = col; g.font = '700 30px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText(RK[i], -66, -70);
      g.font = '26px system-ui, sans-serif'; g.fillText(SUITS[i % 4], -66, -40);
      g.font = '96px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(SUITS[i % 4], 0, 50);
      g.restore();
    }
    // card back peeking
    g.save(); g.translate(90, 200); g.rotate(-0.3);
    g.fillStyle = '#20263b'; rrect(g, -60, -84, 120, 168, 12); g.fill();
    g.strokeStyle = '#ffcf4a'; g.lineWidth = 2; rrect(g, -50, -74, 100, 148, 8); g.stroke();
    g.restore();
    title(g, 'SOLITAIRE', 300, T1, { size: 62, top: '#fffdf2', mid: '#ffe8a3', bot: '#b8841f', glowColor: '#ffcf4a', outline: '#02100a', depthColor: '#062818' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#c8323a', accent3: '#f6f2e6', tagline: 'The patience game, dealt fresh.', genre: 'CARDS', year: 1990, isNew: true }, 6);
  },

  asteroids(g) {
    sky(g, PW, PH, [[0, '#000'], [1, '#07041a']]);
    stars(g, PW, PH, 260, 12);
    const rock = (cx: number, cy: number, r: number, seed: number) => {
      const rr = rng(seed);
      const pts: [number, number][] = [];
      for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2, d = r * (0.7 + rr() * 0.35); pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]); }
      vector(g, '#c4b5fd', 2.5, () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke(); });
    };
    rock(130, 170, 90, 1); rock(470, 250, 70, 2); rock(420, 480, 110, 3); rock(110, 470, 40, 4); rock(250, 110, 30, 5);
    // ship + thrust + shots
    g.save(); g.translate(270, 360); g.rotate(-0.7);
    vector(g, '#ffffff', 3, () => { g.beginPath(); g.moveTo(0, -40); g.lineTo(26, 30); g.lineTo(0, 18); g.lineTo(-26, 30); g.closePath(); g.stroke(); });
    vector(g, '#ff8a3d', 3, () => { g.beginPath(); g.moveTo(-12, 26); g.lineTo(0, 62); g.lineTo(12, 26); g.stroke(); });
    g.restore();
    for (let i = 0; i < 4; i++) vector(g, '#ffffff', 3, () => { g.beginPath(); const x = 310 + i * 34, y = 316 - i * 36; g.moveTo(x, y); g.lineTo(x + 6, y - 6); g.stroke(); });
    // explosion shards
    for (let i = 0; i < 10; i++) { const a = i * 0.63; vector(g, '#a78bfa', 2, () => { g.beginPath(); g.moveTo(440 + Math.cos(a) * 20, 160 + Math.sin(a) * 20); g.lineTo(440 + Math.cos(a) * 40, 160 + Math.sin(a) * 40); g.stroke(); }); }
    title(g, 'ASTEROID', 300, T2a, { size: 60, top: '#ffffff', mid: '#ddd6fe', bot: '#6d28d9', glowColor: '#a78bfa', outline: '#05000f' });
    title(g, 'BLASTER', 300, T2b, { size: 66, top: '#ffffff', mid: '#ddd6fe', bot: '#6d28d9', glowColor: '#a78bfa', outline: '#05000f' });
    frame(g, PW, PH, { accent: '#a78bfa', accent2: '#ffffff', accent3: '#ff8a3d', tagline: 'Rocks. Inertia. Panic.', genre: 'VECTOR SHOOTER', year: 1979 }, 7);
  },

  dash(g) {
    sky(g, PW, PH, [[0, '#120313'], [0.45, '#5a0f2e'], [0.6, '#ff6a3d']]);
    stars(g, PW, PH, 80, 8, 260);
    sun(g, 300, 400, 150, '#ffe066', '#ff2f6d', 8);
    mountains(g, PW, 430, 110, '#2a0820', 6, 8);
    floorGrid(g, PW, PH, 430, '#ff8a3d', { fill: '#1a0410' });
    // obstacles on ground
    for (const [x, s] of [[110, 54], [490, 70]] as const) {
      glow(g, '#ff2f6d', 20, () => { g.fillStyle = '#ff2f6d'; g.fillRect(x - s / 2, 470 - s, s, s); });
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x - s / 2, 470 - s, s, 6);
    }
    // speed lines
    g.fillStyle = 'rgba(255,224,102,0.6)';
    for (let i = 0; i < 9; i++) g.fillRect(20 + (i * 53) % 200, 280 + i * 22, 90 + (i * 31) % 80, 3);
    sprite(g, RUNNER, { o: '#1a0410', w: '#ffe0c2', k: '#1a0410', c: '#ff8a3d' }, 230, 220, 12);
    title(g, 'PIXEL', 300, T2a, { size: 66, top: '#fff6d8', mid: '#ffe066', bot: '#ff2f6d', glowColor: '#ff8a3d', outline: '#1a0005', skew: -0.15 });
    title(g, 'DASH', 300, T2b, { size: 86, top: '#fff6d8', mid: '#ffe066', bot: '#ff2f6d', glowColor: '#ff8a3d', outline: '#1a0005', skew: -0.15 });
    frame(g, PW, PH, { accent: '#ff8a3d', accent2: '#ffe066', accent3: '#ff2f6d', tagline: 'It only gets faster.', genre: 'RUNNER', year: 1986, isNew: true }, 8);
  },

  hexspin(g) {
    sky(g, PW, PH, [[0, '#0a0003'], [1, '#2a0008']]);
    const cx = 300, cy = 330;
    g.save(); g.translate(cx, cy);
    for (let i = 12; i >= 1; i--) {
      const r = i * i * 4.2, rot = i * 0.12;
      g.save(); g.rotate(rot);
      const col = i % 2 ? '#ff4757' : '#ff9a9f';
      g.globalAlpha = Math.min(1, 0.25 + i / 12);
      vector(g, col, i > 8 ? 6 : 3, () => {
        g.beginPath();
        for (let k = 0; k <= 6; k++) {
          if (k === (i % 6)) { g.moveTo(Math.cos((k + 1) * Math.PI / 3) * r, Math.sin((k + 1) * Math.PI / 3) * r); continue; } // the gap
          const a = k * Math.PI / 3; const p = [Math.cos(a) * r, Math.sin(a) * r];
          if (k === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]);
        }
        g.stroke();
      });
      g.restore();
    }
    g.globalAlpha = 1;
    glow(g, '#ffffff', 30, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -34); g.lineTo(10, -20); g.lineTo(-10, -20); g.closePath(); g.fill(); });
    g.fillStyle = '#ff4757'; g.beginPath(); for (let k = 0; k < 6; k++) g.lineTo(Math.cos(k * Math.PI / 3) * 14, Math.sin(k * Math.PI / 3) * 14); g.fill();
    g.restore();
    title(g, 'HEX SPIN', 300, T1, { size: 70, top: '#ffffff', mid: '#ffc2c6', bot: '#c4001a', glowColor: '#ff4757', outline: '#0a0003', depthColor: '#3a0008' });
    frame(g, PW, PH, { accent: '#ff4757', accent2: '#ffffff', accent3: '#ff9a9f', tagline: 'The walls are closing in.', genre: 'REFLEX', year: 1983, isNew: true }, 9);
  },

  skystack(g) {
    sky(g, PW, PH, [[0, '#0b2a5a'], [0.6, '#3b8fd1'], [1, '#bfe9ff']]);
    const r = rng(4);
    for (let i = 0; i < 9; i++) { // pixel clouds
      const x = r() * PW, y = 80 + r() * 380, s = 8;
      g.fillStyle = 'rgba(255,255,255,0.85)';
      [[0, 1, 6], [1, 0, 4], [-1, 2, 8]].forEach(([dx, dy, n]) => g.fillRect(x + dx * s * 2, y + dy * s, n * s * 2, s));
    }
    let y = 600, x = 220, wdt = 170;
    const hues = ['#5ef2ff', '#4dd2ff', '#4db0ff', '#6b8cff', '#8f7bff', '#b66bff', '#e05bff', '#ff4fa3', '#ff6a6a', '#ff9a4d', '#ffcf4a'];
    for (let i = 0; i < 11; i++) {
      const c = hues[i];
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 8, y - 34 + 8, wdt, 34);
      g.fillStyle = c; g.fillRect(x, y - 34, wdt, 34);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y - 34, wdt, 6);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + wdt - 10, y - 34, 10, 34);
      y -= 34; x += (r() - 0.5) * 22; wdt -= 6;
    }
    // falling slice
    g.save(); g.translate(430, 230); g.rotate(0.5); g.fillStyle = '#ffcf4a'; g.fillRect(0, 0, 40, 34); g.restore();
    title(g, 'SKY STACK', 300, T1, { size: 64, top: '#ffffff', mid: '#fff3b0', bot: '#ff8a3d', glowColor: '#ffffff', outline: '#08203f', depthColor: '#0b2a5a' });
    frame(g, PW, PH, { accent: '#5ef2ff', accent2: '#ffcf4a', accent3: '#ff4fa3', tagline: 'Drop it perfect.', genre: 'ONE-BUTTON', year: 1984, isNew: true }, 10);
  },

  gemswap(g) {
    sky(g, PW, PH, [[0, '#14001a'], [1, '#3a0a3f']]);
    rays(g, 300, 330, '#ff4fa3', 24, 800, 0.08);
    const gem = (cx: number, cy: number, r: number, c: string, c2: string) => {
      g.save(); g.translate(cx, cy);
      glow(g, c, 30, () => { g.fillStyle = c; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.9, -r * 0.3); g.lineTo(r * 0.55, r); g.lineTo(-r * 0.55, r); g.lineTo(-r * 0.9, -r * 0.3); g.closePath(); g.fill(); });
      g.fillStyle = c2; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.45, -r * 0.3); g.lineTo(-r * 0.45, -r * 0.3); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.moveTo(r * 0.9, -r * 0.3); g.lineTo(r * 0.55, r); g.lineTo(0, -r * 0.3); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-r * 0.3, -r * 0.6, r * 0.18, r * 0.18);
      g.restore();
    };
    gem(300, 300, 110, '#ff4fa3', '#ffc2e4');
    gem(130, 200, 54, '#5ef2ff', '#d6fcff'); gem(480, 190, 60, '#4dff8a', '#d4ffe4');
    gem(140, 450, 48, '#ffcf4a', '#fff3c4'); gem(470, 440, 56, '#a78bfa', '#e9e2ff');
    // sparkles
    const r = rng(2);
    for (let i = 0; i < 24; i++) { const x = r() * PW, y = 80 + r() * 460; g.fillStyle = '#fff'; g.fillRect(x - 6, y, 13, 1); g.fillRect(x, y - 6, 1, 13); }
    title(g, 'GEM SWAP', 300, T1, { size: 70, top: '#ffffff', mid: '#ffc2e4', bot: '#c2006b', glowColor: '#ff4fa3', outline: '#14001a', depthColor: '#3a0a3f' });
    frame(g, PW, PH, { accent: '#ff4fa3', accent2: '#5ef2ff', accent3: '#ffcf4a', tagline: 'Match three. Chain everything.', genre: 'PUZZLE', year: 1988, isNew: true }, 11);
  },

  shield(g) {
    sky(g, PW, PH, [[0, '#020210'], [0.7, '#1a0a3a'], [1, '#3a1040']]);
    stars(g, PW, PH, 150, 13, 420);
    // incoming missile trails
    const trails: [number, number, number, number][] = [[40, 36, 210, 400], [300, 36, 120, 470], [560, 36, 420, 430], [450, 36, 330, 300], [150, 36, 470, 520]];
    for (const [x0, y0, x1, y1] of trails) {
      vector(g, '#ff5a5f', 2, () => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); });
      g.fillStyle = '#fff'; g.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
    // interceptor blooms
    for (const [x, y, r] of [[330, 300, 60], [120, 250, 40], [460, 200, 50]] as const) {
      glow(g, '#ffcf4a', 50, () => { g.fillStyle = 'rgba(255,207,74,0.85)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(x, y, r * 0.45, 0, Math.PI * 2); g.fill();
    }
    vector(g, '#5ef2ff', 2, () => { g.beginPath(); g.moveTo(300, 560); g.lineTo(330, 300); g.stroke(); });
    // city skyline
    const r = rng(6);
    g.fillStyle = '#0a0a1a'; g.fillRect(0, 560, PW, 240);
    for (let i = 0; i < 6; i++) {
      const cx = 50 + i * 100;
      for (let k = 0; k < 4; k++) {
        const bh = 20 + r() * 50;
        g.fillStyle = '#5ef2ff'; g.fillRect(cx - 30 + k * 15, 560 - bh, 12, bh);
        g.fillStyle = '#062a33'; for (let z = 0; z < bh - 6; z += 8) g.fillRect(cx - 27 + k * 15, 563 - bh + z, 6, 3);
      }
    }
    g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(270, 560); g.lineTo(300, 520); g.lineTo(330, 560); g.fill();
    title(g, 'CITY', 300, T2a, { size: 72, top: '#ffffff', mid: '#ffe8a3', bot: '#ff5a1f', glowColor: '#ffcf4a', outline: '#0a0010' });
    title(g, 'SHIELD', 300, T2b, { size: 78, top: '#ffffff', mid: '#ffe8a3', bot: '#ff5a1f', glowColor: '#ffcf4a', outline: '#0a0010' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#ff5a5f', accent3: '#5ef2ff', tagline: 'Six cities. One trigger finger.', genre: 'DEFENCE', year: 1980, isNew: true }, 12);
  },

  echo(g) {
    sky(g, PW, PH, [[0, '#07031a'], [1, '#1d0b3d']]);
    const cx = 300, cy = 320, R = 200;
    const cols = ['#4dff8a', '#ff4757', '#ffcf4a', '#5ea8ff'];
    for (let i = 0; i < 4; i++) {
      const a0 = i * Math.PI / 2 + 0.06, a1 = (i + 1) * Math.PI / 2 - 0.06, lit = i === 1;
      g.save();
      if (lit) { g.shadowColor = cols[i]; g.shadowBlur = 70; }
      g.fillStyle = lit ? cols[i] : cols[i] + '55';
      g.beginPath(); g.arc(cx, cy, R, a0, a1); g.arc(cx, cy, 70, a1, a0, true); g.closePath(); g.fill();
      g.restore();
      if (lit) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx, cy, R - 10, a0 + 0.1, a1 - 0.6); g.arc(cx, cy, R - 40, a1 - 0.6, a0 + 0.1, true); g.fill(); }
    }
    g.fillStyle = '#0b0618'; g.beginPath(); g.arc(cx, cy, 62, 0, Math.PI * 2); g.fill();
    label(g, 'ECHO', cx, cy + 8, 18, '#a78bfa');
    // sound rings
    for (let i = 1; i <= 3; i++) { g.strokeStyle = `rgba(167,139,250,${0.4 / i})`; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + i * 26, 0, Math.PI * 2); g.stroke(); }
    title(g, 'ECHO', 300, T1, { size: 92, top: '#ffffff', mid: '#e1d6ff', bot: '#6d28d9', glowColor: '#a78bfa', outline: '#07031a', depthColor: '#1d0b3d' });
    frame(g, PW, PH, { accent: '#a78bfa', accent2: '#4dff8a', accent3: '#ff4757', tagline: 'Watch. Remember. Repeat.', genre: 'MEMORY', year: 1978, isNew: true }, 13);
  },

  lander(g) {
    sky(g, PW, PH, [[0, '#000'], [1, '#05060c']]);
    stars(g, PW, PH, 240, 14, 460);
    // earthrise
    glow(g, '#5ea8ff', 40, () => { g.fillStyle = '#1d4fa8'; g.beginPath(); g.arc(470, 140, 54, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#3cb371'; g.beginPath(); g.arc(455, 130, 22, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(490, 160, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(490, 130, 54, 0, Math.PI * 2); g.fill();
    // terrain (vector)
    const pts: [number, number][] = [[0, 520], [60, 470], [110, 500], [150, 430], [200, 520], [330, 520], [370, 460], [420, 490], [470, 410], [530, 470], [600, 440]];
    g.fillStyle = '#07080f'; g.beginPath(); g.moveTo(0, PH); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(PW, PH); g.fill();
    vector(g, '#f2f4ff', 2.5, () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); });
    vector(g, '#4dff8a', 4, () => { g.beginPath(); g.moveTo(200, 520); g.lineTo(330, 520); g.stroke(); });
    label(g, 'x2', 265, 548, 12, '#4dff8a');
    // lander
    g.save(); g.translate(265, 330); g.rotate(0.12);
    vector(g, '#ffffff', 2.5, () => {
      g.beginPath();
      g.rect(-22, -40, 44, 30); g.moveTo(-30, -10); g.lineTo(30, -10); g.lineTo(22, 10); g.lineTo(-22, 10); g.closePath();
      g.moveTo(-18, 10); g.lineTo(-34, 40); g.moveTo(18, 10); g.lineTo(34, 40); g.moveTo(-40, 40); g.lineTo(-28, 40); g.moveTo(28, 40); g.lineTo(40, 40);
    });
    vector(g, '#ff8a3d', 3, () => { g.beginPath(); g.moveTo(-10, 12); g.lineTo(0, 64); g.lineTo(10, 12); g.stroke(); });
    g.restore();
    title(g, 'LUNAR', 300, T2a, { size: 66, top: '#ffffff', mid: '#e6e8f5', bot: '#5a6080', glowColor: '#ffffff', outline: '#000' });
    title(g, 'DROP', 300, T2b, { size: 84, top: '#ffffff', mid: '#e6e8f5', bot: '#5a6080', glowColor: '#ffffff', outline: '#000' });
    frame(g, PW, PH, { accent: '#f2f4ff', accent2: '#4dff8a', accent3: '#ff8a3d', tagline: 'Gentle hands. Low fuel.', genre: 'VECTOR SIM', year: 1979, isNew: true }, 14);
  },

  trails(g) {
    sky(g, PW, PH, [[0, '#000208'], [0.5, '#001a2a'], [0.56, '#003a5a']]);
    stars(g, PW, PH, 90, 15, 300);
    floorGrid(g, PW, PH, 330, '#1aa7c9', { fill: '#000a12', lines: 18 });
    // light walls in perspective
    const wall = (pts: [number, number][], c: string) => {
      g.save(); g.shadowColor = c; g.shadowBlur = 24;
      g.fillStyle = c + '66';
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const h0 = (y0 - 330) * 0.18 + 4, h1 = (y1 - 330) * 0.18 + 4;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 - h1); g.lineTo(x0, y0 - h0); g.closePath(); g.fill();
      }
      g.restore();
      vector(g, c, 3, () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); });
    };
    wall([[60, 780], [180, 520], [380, 520], [420, 420]], '#5ef2ff');
    wall([[560, 760], [470, 600], [230, 600], [270, 440]], '#ff8a3d');
    // bikes
    glow(g, '#5ef2ff', 30, () => { g.fillStyle = '#d6fcff'; g.fillRect(410, 400, 22, 26); });
    glow(g, '#ff8a3d', 30, () => { g.fillStyle = '#ffe2c8'; g.fillRect(260, 420, 22, 26); });
    title(g, 'LIGHT', 300, T2a, { size: 70, top: '#ffffff', mid: '#b8f8ff', bot: '#0a7ea8', glowColor: '#5ef2ff', outline: '#000208' });
    title(g, 'TRAILS', 300, T2b, { size: 76, top: '#ffffff', mid: '#b8f8ff', bot: '#0a7ea8', glowColor: '#5ef2ff', outline: '#000208' });
    frame(g, PW, PH, { accent: '#5ef2ff', accent2: '#ff8a3d', accent3: '#1aa7c9', tagline: 'Leave them nowhere to turn.', players: '1P VS CPU', genre: 'DUEL', year: 1982, isNew: true }, 15);
  },

  dodge(g) {
    sky(g, PW, PH, [[0, '#0a0012'], [1, '#22002e']]);
    stars(g, PW, PH, 120, 16);
    const cx = 300, cy = 260;
    const cols = ['#ff4fa3', '#ffcf4a', '#5ef2ff', '#a78bfa'];
    for (let ring = 0; ring < 7; ring++) {
      const n = 14 + ring * 4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.3 + Math.sin(i * 0.6) * 0.1;
        const d = 50 + ring * 46;
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.95;
        const c = cols[ring % 4], r = 6 + (ring % 3) * 2;
        g.fillStyle = c; g.globalAlpha = 0.25; g.beginPath(); g.arc(x, y, r * 2, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.45, 0, Math.PI * 2); g.fill();
      }
    }
    // player ship below
    glow(g, '#ffffff', 26, () => { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(300, 470); g.lineTo(318, 510); g.lineTo(300, 500); g.lineTo(282, 510); g.closePath(); g.fill(); });
    g.fillStyle = '#ff4fa3'; g.beginPath(); g.arc(300, 495, 4, 0, Math.PI * 2); g.fill();
    title(g, 'BULLET', 300, T2a, { size: 66, top: '#ffffff', mid: '#ffc2e4', bot: '#a8006a', glowColor: '#ff4fa3', outline: '#0a0012' });
    title(g, 'WALTZ', 300, T2b, { size: 76, top: '#ffffff', mid: '#ffc2e4', bot: '#a8006a', glowColor: '#ff4fa3', outline: '#0a0012' });
    frame(g, PW, PH, { accent: '#ff4fa3', accent2: '#ffcf4a', accent3: '#5ef2ff', tagline: 'Dance between a thousand bullets.', genre: 'SURVIVAL', year: 1995, isNew: true }, 16);
  },

  reflex(g) {
    sky(g, PW, PH, [[0, '#0d0204'], [1, '#2a060c']]);
    halftone(g, 0, 40, PW, 560, 'rgba(255,71,87,0.12)', 9, true);
    const target = (x: number, y: number, r: number) => {
      for (let i = 4; i >= 1; i--) { g.fillStyle = i % 2 ? '#ff4757' : '#fff2f2'; g.beginPath(); g.arc(x, y, (r * i) / 4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(x + r * 0.15, y + r * 0.15, r, 0, Math.PI * 2); g.globalCompositeOperation = 'destination-over'; g.fill(); g.globalCompositeOperation = 'source-over';
    };
    target(140, 180, 50); target(470, 230, 70); target(200, 430, 38); target(430, 470, 46);
    target(300, 320, 110);
    // crosshair
    vector(g, '#ffffff', 3, () => { g.beginPath(); g.arc(320, 300, 60, 0, Math.PI * 2); g.moveTo(320, 220); g.lineTo(320, 270); g.moveTo(320, 330); g.lineTo(320, 380); g.moveTo(240, 300); g.lineTo(290, 300); g.moveTo(350, 300); g.lineTo(400, 300); });
    burst(g, 130, 520, 46, '#ffcf4a', '+300');
    title(g, 'REFLEX', 300, T1, { size: 84, top: '#ffffff', mid: '#ffd0d4', bot: '#c4001a', glowColor: '#ff4757', outline: '#0d0204', depthColor: '#3a0008', skew: -0.1 });
    frame(g, PW, PH, { accent: '#ff4757', accent2: '#ffffff', accent3: '#ffcf4a', tagline: 'How fast are your hands, really?', genre: 'AIM', year: 1987, isNew: true }, 17);
  },

  lexicon(g) {
    sky(g, PW, PH, [[0, '#040d08'], [1, '#0f2a1a']]);
    const rows = [['C', 'R', 'A', 'N', 'E'], ['P', 'I', 'X', 'E', 'L'], ['A', 'R', 'C', 'A', 'D'], ['A', 'R', 'C', 'A', 'D']];
    const states = [['x', 'y', 'g', 'x', 'x'], ['x', 'x', 'x', 'x', 'x'], ['g', 'g', 'g', 'g', 'y'], ['g', 'g', 'g', 'g', 'g']];
    const fill = { g: '#2fbf63', y: '#e2b322', x: '#2a3140' } as const;
    const word = ['A', 'R', 'C', 'A', 'DE'];
    void word;
    const S = 82, gx = 300 - (S * 5 + 12 * 4) / 2;
    rows.forEach((row, j) => row.forEach((ch, i) => {
      const x = gx + i * (S + 12), y = 100 + j * (S + 12);
      const st = states[j][i] as keyof typeof fill;
      g.save(); if (j === 3) { g.shadowColor = '#4dff8a'; g.shadowBlur = 24; }
      g.fillStyle = fill[st]; rrect(g, x, y, S, S, 8); g.fill(); g.restore();
      g.fillStyle = 'rgba(255,255,255,0.18)'; rrect(g, x + 4, y + 4, S - 8, 12, 4); g.fill();
      label(g, j === 3 && i === 4 ? 'E' : ch, x + S / 2, y + S / 2 + 14, 34, '#ffffff');
    }));
    title(g, 'LEXICON', 300, T1, { size: 74, top: '#ffffff', mid: '#c8ffd9', bot: '#13804a', glowColor: '#4dff8a', outline: '#020a05', depthColor: '#0f2a1a' });
    frame(g, PW, PH, { accent: '#4dff8a', accent2: '#e2b322', accent3: '#2a3140', tagline: 'Six guesses. Five letters.', genre: 'WORD', year: 1987, isNew: true }, 18);
  },

  fourup(g) {
    sky(g, PW, PH, [[0, '#0a0f2a'], [1, '#1a2a6a']]);
    rays(g, 300, 260, '#ffcf4a', 16, 700, 0.07);
    g.save(); g.translate(300, 340); g.transform(1, 0, -0.18, 0.92, 0, 0);
    const C = 7, R = 6, S = 62, x0 = -C * S / 2, y0 = -R * S / 2;
    g.fillStyle = 'rgba(0,0,0,0.5)'; rrect(g, x0 - 6, y0 + 10, C * S + 24, R * S + 24, 18); g.fill();
    g.fillStyle = '#2350d8'; rrect(g, x0 - 12, y0 - 12, C * S + 24, R * S + 24, 18); g.fill();
    const board = ['.......', '...y...', '..ry...', '..yry..', '.ryyrr.', 'rryrry.'];
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const ch = board[j][i], x = x0 + i * S + S / 2, y = y0 + j * S + S / 2;
      g.fillStyle = ch === 'r' ? '#ff4757' : ch === 'y' ? '#ffcf4a' : '#0a1440';
      g.beginPath(); g.arc(x, y, S * 0.38, 0, Math.PI * 2); g.fill();
      if (ch !== '.') { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - 6, y - 6, S * 0.12, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    // falling disc
    glow(g, '#ffcf4a', 30, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(360, 90, 26, 0, Math.PI * 2); g.fill(); });
    title(g, 'FOUR UP', 300, T1, { size: 76, top: '#ffffff', mid: '#fff0b0', bot: '#e0a000', glowColor: '#ffcf4a', outline: '#050a20', depthColor: '#0a0f2a' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#ff4757', accent3: '#2350d8', tagline: 'Four in a row. Beat the bot.', players: '1P VS CPU', genre: 'STRATEGY', year: 1982, isNew: true }, 19);
  },

  stackpanic(g) {
    sky(g, PW, PH, [[0, '#020a14'], [1, '#062a40']]);
    stars(g, PW, PH, 80, 20);
    const S = 38, ox = 300 - 5 * S, oy = 560;
    const well = ['..........', '..........', '..........', '....tt....', '..s.tt..j.', '.ss.ll.jjj', 'zsoollliii', 'zzoo.liiii', 'ozzooooolo', 'oooo.ooooo'];
    const col: Record<string, string> = { t: '#ffcf4a', s: '#4dff8a', j: '#5ea8ff', l: '#ff8a3d', z: '#ff4757', o: '#5ef2ff', i: '#a78bfa' };
    g.fillStyle = '#04121e'; g.fillRect(ox - 6, oy - 10 * S - 6, 10 * S + 12, 10 * S + 12);
    well.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const x = ox + i * S, y = oy - (10 - j) * S;
      g.fillStyle = col[ch]; g.fillRect(x, y, S - 2, S - 2);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, S - 2, 5); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y + S - 7, S - 2, 5);
    }));
    // falling T piece with motion streaks
    const piece: [number, number][] = [[0, 0], [1, 0], [2, 0], [1, 1]];
    piece.forEach(([i, j]) => {
      const x = 250 + i * S, y = 90 + j * S;
      g.fillStyle = 'rgba(167,139,250,0.2)'; g.fillRect(x, y - 60, S - 2, 60);
      glow(g, '#a78bfa', 18, () => { g.fillStyle = '#a78bfa'; g.fillRect(x, y, S - 2, S - 2); });
    });
    title(g, 'STACK', 300, T2a, { size: 70, top: '#ffffff', mid: '#b8f8ff', bot: '#0a6ea8', glowColor: '#5ef2ff', outline: '#020a14' });
    title(g, 'PANIC', 300, T2b, { size: 76, top: '#ffffff', mid: '#b8f8ff', bot: '#0a6ea8', glowColor: '#5ef2ff', outline: '#020a14' });
    frame(g, PW, PH, { accent: '#5ef2ff', accent2: '#a78bfa', accent3: '#ffcf4a', tagline: 'Clear the lines before they clear you.', genre: 'PUZZLE', year: 1985 }, 20);
  },

  prismbreak(g) {
    sky(g, PW, PH, [[0, '#0a0010'], [1, '#1a0020']]);
    const hues = ['#ff4466', '#ff7744', '#ffcf4a', '#44ff88', '#5ef2ff', '#a78bfa'];
    for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) {
      if ((j === 4 && i > 2 && i < 6) || (j === 5 && i > 1 && i < 7)) continue;
      const x = 24 + i * 62, y = 70 + j * 32;
      g.fillStyle = hues[j]; g.fillRect(x, y, 58, 26);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, 58, 5); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + 21, 58, 5);
    }
    // shattering brick
    for (let k = 0; k < 8; k++) { g.fillStyle = hues[4]; g.save(); g.translate(300 + k * 9 - 30, 250 + (k % 3) * 14); g.rotate(k); g.fillRect(-6, -4, 12, 8); g.restore(); }
    // ball trail and ball
    vector(g, '#ff9de0', 3, () => { g.beginPath(); g.moveTo(340, 520); g.lineTo(240, 330); g.lineTo(300, 240); g.stroke(); });
    glow(g, '#ffffff', 30, () => { g.fillStyle = '#fff'; g.beginPath(); g.arc(300, 240, 12, 0, Math.PI * 2); g.fill(); });
    // paddle
    glow(g, '#ff4fa3', 24, () => { g.fillStyle = '#ff4fa3'; rrect(g, 260, 520, 160, 18, 9); g.fill(); });
    title(g, 'PRISM', 300, T2a, { size: 72, top: '#ffffff', mid: '#ffc2e4', bot: '#a8006a', glowColor: '#ff4fa3', outline: '#0a0010' });
    title(g, 'BREAK', 300, T2b, { size: 76, top: '#ffffff', mid: '#ffc2e4', bot: '#a8006a', glowColor: '#ff4fa3', outline: '#0a0010' });
    frame(g, PW, PH, { accent: '#ff4fa3', accent2: '#ffcf4a', accent3: '#5ef2ff', tagline: 'Paddle. Ball. A wall of light.', genre: 'BRICK BREAKER', year: 1976 }, 21);
  },

  voidchomp(g) {
    sky(g, PW, PH, [[0, '#02020a'], [1, '#0a0a24']]);
    // maze walls in neon double-line
    const walls: [number, number, number, number][] = [[40, 60, 520, 0], [40, 560, 520, 0], [40, 60, 0, 500], [560, 60, 0, 500], [120, 140, 140, 0], [340, 140, 140, 0], [120, 140, 0, 120], [480, 140, 0, 120], [220, 260, 160, 0], [120, 380, 120, 0], [360, 380, 120, 0], [300, 380, 0, 100], [120, 480, 360, 0]];
    for (const [x, y, w, h] of walls) {
      vector(g, '#3b5bff', 2.5, () => { g.beginPath(); g.rect(x, y, w || 8, h || 8); g.stroke(); });
    }
    // dots
    for (let i = 0; i < 12; i++) { g.fillStyle = '#ffd9a0'; g.fillRect(70 + i * 40, 100, 6, 6); g.fillRect(70 + i * 40, 520, 6, 6); }
    glow(g, '#ffcf4a', 20, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.arc(80, 320, 10, 0, Math.PI * 2); g.fill(); });
    // chomper (void orb with a wedge)
    glow(g, '#ffcf4a', 40, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(300, 320); g.arc(300, 320, 64, 0.6, Math.PI * 2 - 0.6); g.closePath(); g.fill(); });
    g.fillStyle = '#1a1000'; g.fillRect(298, 280, 12, 12);
    // drones (diamond sentries)
    const drone = (x: number, y: number, c: string) => {
      glow(g, c, 24, () => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + 30, y); g.lineTo(x, y + 34); g.lineTo(x - 30, y); g.closePath(); g.fill(); });
      g.fillStyle = '#fff'; g.fillRect(x - 14, y - 6, 10, 10); g.fillRect(x + 4, y - 6, 10, 10);
      g.fillStyle = '#000'; g.fillRect(x - 10, y - 2, 4, 4); g.fillRect(x + 8, y - 2, 4, 4);
    };
    drone(460, 320, '#ff4757'); drone(410, 440, '#5ef2ff'); drone(180, 200, '#ff9de0');
    title(g, 'VOID', 300, T2a, { size: 74, top: '#ffffff', mid: '#fff0b0', bot: '#e08a00', glowColor: '#ffcf4a', outline: '#02020a' });
    title(g, 'CHOMP', 300, T2b, { size: 76, top: '#ffffff', mid: '#fff0b0', bot: '#e08a00', glowColor: '#ffcf4a', outline: '#02020a' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#3b5bff', accent3: '#ff4757', tagline: 'Eat the dots. Outrun the drones.', genre: 'MAZE CHASE', year: 1980 }, 22);
  },

  defender(g) {
    sky(g, PW, PH, [[0, '#000'], [1, '#0a0618']]);
    stars(g, PW, PH, 220, 23);
    // planet horizon
    const pl = g.createRadialGradient(300, 1200, 400, 300, 1200, 760);
    pl.addColorStop(0, '#3a0a1a'); pl.addColorStop(0.96, '#ff4757'); pl.addColorStop(1, 'rgba(255,71,87,0)');
    g.fillStyle = pl; g.beginPath(); g.arc(300, 1200, 760, 0, Math.PI * 2); g.fill();
    for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) {
      const map = j % 2 ? INVADER_B : INVADER_A;
      sprite(g, map, { p: '#ff6b81', g: '#ffcf4a' }, 70 + i * 80, 70 + j * 62, 5);
    }
    // shots + explosion
    vector(g, '#5ef2ff', 3, () => { g.beginPath(); g.moveTo(300, 470); g.lineTo(300, 330); g.stroke(); });
    rays(g, 300, 312, '#ffcf4a', 12, 50, 0.6);
    sprite(g, CANNON, { c: '#5ef2ff' }, 300 - 36, 480, 6);
    title(g, 'STAR', 300, T2a, { size: 74, top: '#ffffff', mid: '#ffd0d4', bot: '#c4001a', glowColor: '#ff4757', outline: '#000' });
    title(g, 'DEFENDER', 300, T2b, { size: 64, top: '#ffffff', mid: '#ffd0d4', bot: '#c4001a', glowColor: '#ff4757', outline: '#000' });
    frame(g, PW, PH, { accent: '#ff4757', accent2: '#5ef2ff', accent3: '#ffcf4a', tagline: 'Hold the line. Every wave faster.', genre: 'SHOOTER', year: 1978 }, 23);
  },

  bounceblitz(g) {
    sky(g, PW, PH, [[0, '#06031a'], [1, '#1d0b3d']]);
    // court in perspective
    g.save(); g.translate(300, 330); g.transform(1, 0, 0, 0.6, 0, 0);
    g.fillStyle = '#0d0828'; g.fillRect(-240, -300, 480, 600);
    g.strokeStyle = '#a78bfa'; g.lineWidth = 3; g.shadowColor = '#a78bfa'; g.shadowBlur = 16; g.strokeRect(-240, -300, 480, 600);
    g.setLineDash([16, 14]); g.beginPath(); g.moveTo(-240, 0); g.lineTo(240, 0); g.stroke(); g.setLineDash([]);
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff'; g.shadowColor = '#ffffff'; g.shadowBlur = 24; g.fillRect(-60, 260, 120, 18);
    g.fillStyle = '#ff4fa3'; g.shadowColor = '#ff4fa3'; g.fillRect(40, -280, 120, 18);
    g.restore();
    vector(g, '#ffffff', 2, () => { g.beginPath(); g.moveTo(300, 480); g.lineTo(200, 380); g.lineTo(330, 230); g.stroke(); });
    glow(g, '#ffffff', 30, () => { g.fillStyle = '#fff'; g.fillRect(320, 222, 18, 18); });
    label(g, '07', 150, 200, 44, 'rgba(167,139,250,0.6)'); label(g, '09', 450, 460, 44, 'rgba(167,139,250,0.6)');
    title(g, 'BOUNCE', 300, T2a, { size: 70, top: '#ffffff', mid: '#e1d6ff', bot: '#6d28d9', glowColor: '#a78bfa', outline: '#06031a' });
    title(g, 'BLITZ', 300, T2b, { size: 80, top: '#ffffff', mid: '#e1d6ff', bot: '#6d28d9', glowColor: '#a78bfa', outline: '#06031a' });
    frame(g, PW, PH, { accent: '#a78bfa', accent2: '#ff4fa3', accent3: '#ffffff', tagline: 'First to ten takes the table.', players: '1P VS CPU', genre: 'PADDLE', year: 1972 }, 24);
  },

  river(g) {
    sky(g, PW, PH, [[0, '#02060e'], [1, '#02060e']]);
    // road lanes (bottom) and river (top) bands
    g.fillStyle = '#0d2a5a'; g.fillRect(0, 60, PW, 250);
    g.fillStyle = '#1a1a24'; g.fillRect(0, 340, PW, 230);
    g.fillStyle = '#3a1b4a'; g.fillRect(0, 310, PW, 30); g.fillRect(0, 570, PW, 30);
    for (let y = 400; y < 560; y += 56) for (let x = 0; x < PW; x += 60) { g.fillStyle = '#ffcf4a'; g.fillRect(x, y, 30, 3); }
    // water ripples
    g.fillStyle = 'rgba(94,242,255,0.25)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % PW, 70 + (i * 37) % 230, 18, 2);
    // logs
    for (const [x, y, w] of [[40, 100, 220], [340, 100, 200], [160, 180, 260], [60, 250, 180], [380, 250, 180]] as const) {
      g.fillStyle = '#7a4a22'; rrect(g, x, y, w, 40, 18); g.fill(); g.fillStyle = '#a0682f'; g.fillRect(x + 12, y + 6, w - 24, 6);
    }
    // cars
    const car = (x: number, y: number, c: string, dir: number) => {
      glow(g, c, 18, () => { g.fillStyle = c; rrect(g, x, y, 90, 40, 8); g.fill(); });
      g.fillStyle = '#0a0a14'; g.fillRect(x + 24, y + 6, 40, 12);
      g.fillStyle = dir > 0 ? '#fff6d0' : '#ff4757'; g.fillRect(dir > 0 ? x + 84 : x, y + 6, 6, 8); g.fillRect(dir > 0 ? x + 84 : x, y + 26, 6, 8);
    };
    car(60, 360, '#ff4fa3', 1); car(380, 420, '#5ef2ff', -1); car(200, 480, '#ffcf4a', 1); car(470, 530, '#a78bfa', -1);
    sprite(g, CRITTER, { g: '#4dff8a', w: '#fff', k: '#000', y: '#ffcf4a' }, 300 - 48, 300, 8);
    title(g, 'RIVER', 300, T2a, { size: 72, top: '#ffffff', mid: '#ffc2e4', bot: '#c2006b', glowColor: '#ff4fa3', outline: '#02060e' });
    title(g, 'DASH', 300, T2b, { size: 84, top: '#ffffff', mid: '#ffc2e4', bot: '#c2006b', glowColor: '#ff4fa3', outline: '#02060e' });
    frame(g, PW, PH, { accent: '#ff4fa3', accent2: '#4dff8a', accent3: '#ffcf4a', tagline: 'Cross the road. Ride the logs. Get home.', genre: 'CROSSING', year: 1981 }, 25);
  },

  tower(g) {
    sky(g, PW, PH, [[0, '#020a04'], [1, '#08200e']]);
    stars(g, PW, PH, 80, 26, 200);
    // zig-zag neon girders
    const girders: [number, number, number, number][] = [[40, 540, 560, 520], [40, 420, 520, 440], [80, 320, 560, 300], [40, 200, 480, 220]];
    girders.forEach(([x0, y0, x1, y1]) => {
      g.save(); g.shadowColor = '#4dff8a'; g.shadowBlur = 16;
      g.fillStyle = '#1a6a34'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 + 16); g.lineTo(x0, y0 + 16); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = '#4dff8a'; g.lineWidth = 2;
      for (let k = 0; k < 14; k++) { const t = k / 14, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(x, y + 16); g.lineTo(x + 18, y); g.stroke(); }
    });
    // ladders
    for (const [x, y0, y1] of [[480, 440, 520], [140, 320, 420], [420, 220, 300]] as const) {
      g.strokeStyle = '#5ef2ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.moveTo(x + 26, y0); g.lineTo(x + 26, y1); g.stroke();
      for (let y = y0 + 10; y < y1; y += 14) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y); g.stroke(); }
    }
    // rolling hazard orbs
    for (const [x, y] of [[300, 390], [200, 276], [380, 500]] as const) glow(g, '#ff8a3d', 24, () => { g.fillStyle = '#ff8a3d'; g.beginPath(); g.arc(x, y, 18, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffe0c2'; g.fillRect(x - 6, y - 10, 6, 6); });
    sprite(g, CLIMBER, { r: '#ff4757', s: '#ffd0a8', k: '#000', b: '#5ea8ff' }, 220, 452, 7);
    // goal at top
    glow(g, '#ffcf4a', 30, () => { g.fillStyle = '#ffcf4a'; g.fillRect(90, 150, 40, 40); });
    title(g, 'TOWER', 300, T2a, { size: 72, top: '#ffffff', mid: '#c8ffd9', bot: '#13804a', glowColor: '#4dff8a', outline: '#020a04' });
    title(g, 'ESCAPE', 300, T2b, { size: 74, top: '#ffffff', mid: '#c8ffd9', bot: '#13804a', glowColor: '#4dff8a', outline: '#020a04' });
    frame(g, PW, PH, { accent: '#4dff8a', accent2: '#ff8a3d', accent3: '#5ef2ff', tagline: 'Climb. Leap. Don’t look down.', genre: 'PLATFORM', year: 1981 }, 26);
  },

  maze(g) {
    sky(g, PW, PH, [[0, '#0a0800'], [1, '#2a2000']]);
    // maze seen in perspective
    g.save(); g.translate(300, 300); g.transform(1, 0, 0, 0.58, 0, 0); g.rotate(Math.PI / 4);
    const N = 11, S = 40, o = -N * S / 2;
    const r = rng(27);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const wall = x === 0 || y === 0 || x === N - 1 || y === N - 1 || (x % 2 === 0 && y % 2 === 0) || (r() > 0.72 && (x + y) % 2 === 1);
      if (wall) {
        g.fillStyle = '#ffcf4a'; g.shadowColor = '#ffcf4a'; g.shadowBlur = 10; g.fillRect(o + x * S, o + y * S, S - 2, S - 2);
        g.shadowBlur = 0; g.fillStyle = '#4a3a00'; g.fillRect(o + x * S + 6, o + y * S + 6, S - 14, S - 14);
      } else if (r() > 0.6) { g.fillStyle = '#5ef2ff'; g.beginPath(); g.arc(o + x * S + S / 2, o + y * S + S / 2, 5, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    // runner + sentinel eyes
    glow(g, '#4dff8a', 30, () => { g.fillStyle = '#4dff8a'; g.beginPath(); g.arc(250, 330, 18, 0, Math.PI * 2); g.fill(); });
    for (const [x, y] of [[380, 240], [420, 380]] as const) { glow(g, '#ff4757', 30, () => { g.fillStyle = '#ff4757'; g.fillRect(x - 18, y - 18, 36, 36); }); g.fillStyle = '#fff'; g.fillRect(x - 12, y - 8, 9, 9); g.fillRect(x + 3, y - 8, 9, 9); }
    title(g, 'MAZE', 300, T2a, { size: 74, top: '#ffffff', mid: '#fff0b0', bot: '#c08000', glowColor: '#ffcf4a', outline: '#0a0800' });
    title(g, 'RUNNER', 300, T2b, { size: 74, top: '#ffffff', mid: '#fff0b0', bot: '#c08000', glowColor: '#ffcf4a', outline: '#0a0800' });
    frame(g, PW, PH, { accent: '#ffcf4a', accent2: '#5ef2ff', accent3: '#ff4757', tagline: 'Collect every orb. Trust no corner.', genre: 'MAZE', year: 1982 }, 27);
  },

  swarm(g) {
    sky(g, PW, PH, [[0, '#010a04'], [1, '#062010']]);
    stars(g, PW, PH, 60, 28);
    // crystal obstacles
    const r = rng(29);
    for (let i = 0; i < 16; i++) {
      const x = 40 + r() * 520, y = 80 + r() * 420;
      g.fillStyle = '#a78bfa'; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x + 10, y); g.lineTo(x, y + 14); g.lineTo(x - 10, y); g.fill();
    }
    // segmented swarm snaking down
    for (let i = 0; i < 16; i++) {
      const t = i / 16;
      const x = 100 + Math.sin(t * Math.PI * 2.2) * 180 + 200 * t, y = 120 + t * 360;
      const s = i === 0 ? 30 : 22;
      glow(g, '#4dff8a', 18, () => { g.fillStyle = i === 0 ? '#c8ffd9' : '#4dff8a'; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#062010'; g.beginPath(); g.arc(x, y, s * 0.45, 0, Math.PI * 2); g.fill();
      if (i === 0) { g.fillStyle = '#ff4757'; g.fillRect(x - 12, y - 6, 8, 8); g.fillRect(x + 4, y - 6, 8, 8); }
    }
    // gunner + shots
    vector(g, '#ffcf4a', 3, () => { g.beginPath(); g.moveTo(300, 540); g.lineTo(300, 440); g.moveTo(300, 420); g.lineTo(300, 380); g.stroke(); });
    glow(g, '#ffcf4a', 20, () => { g.fillStyle = '#ffcf4a'; g.beginPath(); g.moveTo(300, 540); g.lineTo(324, 580); g.lineTo(276, 580); g.closePath(); g.fill(); });
    title(g, 'NEON', 300, T2a, { size: 70, top: '#ffffff', mid: '#c8ffd9', bot: '#13804a', glowColor: '#4dff8a', outline: '#010a04' });
    title(g, 'SWARM', 300, T2b, { size: 78, top: '#ffffff', mid: '#c8ffd9', bot: '#13804a', glowColor: '#4dff8a', outline: '#010a04' });
    frame(g, PW, PH, { accent: '#4dff8a', accent2: '#a78bfa', accent3: '#ffcf4a', tagline: 'It splits. It descends. It never stops.', genre: 'SHOOTER', year: 1980 }, 28);
  },

  horizon(g) {
    sky(g, PW, PH, [[0, '#02000a'], [0.5, '#1a0b3d'], [0.66, '#ff2f6d']]);
    stars(g, PW, PH, 140, 30, 360);
    sun(g, 420, 420, 110, '#ffe066', '#ff2f6d', 8);
    mountains(g, PW, 470, 120, '#12062a', 31, 12, '#5ef2ff66');
    floorGrid(g, PW, PH, 470, '#5ef2ff', { fill: '#05021a' });
    sprite(g, SHIP_SIDE, { c: '#5ef2ff', w: '#ffffff', p: '#ff4fa3' }, 90, 280, 9);
    vector(g, '#ffcf4a', 3, () => { g.beginPath(); g.moveTo(230, 312); g.lineTo(330, 312); g.moveTo(350, 312); g.lineTo(420, 312); g.stroke(); });
    sprite(g, ENEMY_SIDE, { r: '#ff4757', y: '#ffcf4a', k: '#000' }, 460, 290, 8);
    sprite(g, ENEMY_SIDE, { r: '#ff4757', y: '#ffcf4a', k: '#000' }, 420, 190, 6);
    rays(g, 470, 310, '#ffcf4a', 10, 40, 0.6);
    title(g, 'HORIZON', 300, T2a, { size: 64, top: '#ffffff', mid: '#b8f8ff', bot: '#0a7ea8', glowColor: '#5ef2ff', outline: '#02000a', skew: -0.12 });
    title(g, 'DEFENDER', 300, T2b, { size: 62, top: '#ffffff', mid: '#b8f8ff', bot: '#0a7ea8', glowColor: '#5ef2ff', outline: '#02000a', skew: -0.12 });
    frame(g, PW, PH, { accent: '#5ef2ff', accent2: '#ff2f6d', accent3: '#ffe066', tagline: 'Fly fast. Fire faster.', genre: 'SCROLLING SHOOTER', year: 1981 }, 29);
  },
};

export function paintPoster(id: string, g: G) {
  const p = P[id];
  if (!p) { g.fillStyle = '#111'; g.fillRect(0, 0, PW, PH); return; }
  g.save();
  p(g);
  g.restore();
}
