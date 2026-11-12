// Poster painting toolkit: 80s arcade-flyer vocabulary (sunsets, perspective
// grids, chrome logos, halftone, print grain) as composable canvas primitives.
// Posters are painted once into a cached canvas, so we can afford shadowBlur here.

export type G = CanvasRenderingContext2D;

export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) / 4294967296; };
}

let pixelFont = '';
export function pixelFamily() {
  if (!pixelFont) pixelFont = getComputedStyle(document.documentElement).getPropertyValue('--font-pixel').trim() || 'monospace';
  return pixelFont;
}

export function sky(g: G, w: number, h: number, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}

export function stars(g: G, w: number, h: number, n: number, seed = 1, maxY = h) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * maxY, s = r();
    g.fillStyle = `rgba(255,255,255,${0.25 + s * 0.75})`;
    if (s > 0.97) { // twinkle cross
      g.fillRect(x - 3, y, 7, 1); g.fillRect(x, y - 3, 1, 7);
    } else g.fillRect(x, y, s > 0.8 ? 2 : 1, s > 0.8 ? 2 : 1);
  }
}

/** Striped retro sun. */
export function sun(g: G, cx: number, cy: number, r: number, top: string, bot: string, stripes = 7) {
  g.save();
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  const gr = g.createLinearGradient(0, cy - r, 0, cy + r);
  gr.addColorStop(0, top); gr.addColorStop(1, bot);
  g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < stripes; i++) {
    const t = i / stripes;
    const y = cy + r * 0.05 + t * r * 0.95;
    g.fillRect(cx - r, y, r * 2, 2 + t * 9);
  }
  g.restore();
  g.save();
  g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.2);
  halo.addColorStop(0, top + '55'); halo.addColorStop(1, top + '00');
  g.fillStyle = halo; g.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  g.restore();
}

/** Perspective floor grid from horizon to bottom. */
export function floorGrid(g: G, w: number, h: number, horizon: number, color: string, opts: { fill?: string; lines?: number; spread?: number; offset?: number } = {}) {
  const { fill = '#000', lines = 14, spread = 3.2, offset = 0 } = opts;
  const gr = g.createLinearGradient(0, horizon, 0, h);
  gr.addColorStop(0, fill); gr.addColorStop(1, '#000');
  g.fillStyle = gr; g.fillRect(0, horizon, w, h - horizon);
  g.save();
  g.strokeStyle = color; g.lineWidth = 1.5;
  g.shadowColor = color; g.shadowBlur = 8;
  const cx = w / 2;
  for (let i = -lines; i <= lines; i++) {
    g.beginPath(); g.moveTo(cx + i * 6, horizon); g.lineTo(cx + i * (w / lines) * spread, h); g.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const t = ((i + offset) / 16) ** 2.2;
    const y = horizon + t * (h - horizon);
    g.globalAlpha = 0.3 + t * 0.7;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  g.restore();
  g.fillStyle = color; g.globalAlpha = 0.9; g.fillRect(0, horizon - 1, w, 2); g.globalAlpha = 1;
}

export function mountains(g: G, w: number, base: number, height: number, color: string, seed: number, jag = 9, edge?: string) {
  const r = rng(seed);
  g.beginPath(); g.moveTo(0, base);
  const step = w / jag;
  for (let i = 0; i <= jag; i++) g.lineTo(i * step + (r() - 0.5) * step * 0.5, base - height * (0.35 + r() * 0.65));
  g.lineTo(w, base); g.closePath();
  g.fillStyle = color; g.fill();
  if (edge) { g.strokeStyle = edge; g.lineWidth = 1.5; g.stroke(); }
}

export function rays(g: G, cx: number, cy: number, color: string, n = 18, len = 900, alpha = 0.12) {
  g.save(); g.globalAlpha = alpha; g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = a + Math.PI / n;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.lineTo(cx + Math.cos(b) * len, cy + Math.sin(b) * len);
    g.closePath(); g.fill();
  }
  g.restore();
}

export function glow(g: G, color: string, blur: number, draw: () => void) {
  g.save(); g.shadowColor = color; g.shadowBlur = blur; draw(); g.restore();
}

/** Vector-monitor stroke: thick soft glow + bright core, like a 1979 XY display. */
export function vector(g: G, color: string, width: number, path: () => void) {
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = color; g.shadowColor = color;
  g.shadowBlur = 22; g.lineWidth = width * 2.4; g.globalAlpha = 0.35; path(); g.stroke();
  g.shadowBlur = 10; g.lineWidth = width; g.globalAlpha = 1; path(); g.stroke();
  g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, width * 0.35); g.globalAlpha = 0.85; path(); g.stroke();
  g.restore();
}

/**
 * Multi-colour pixel sprite. `map` rows use palette keys; '.' is transparent.
 * Draws a 1px darker outline-shadow for that hand-pixelled flyer look.
 */
export function sprite(g: G, map: string[], pal: Record<string, string>, x: number, y: number, s: number, shadow = true) {
  if (shadow) {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    map.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') g.fillRect(x + (i + 0.5) * s, y + (j + 0.5) * s, s, s); });
  }
  map.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = pal[row[i]];
      if (!c) continue;
      g.fillStyle = c; g.fillRect(Math.round(x + i * s), Math.round(y + j * s), Math.ceil(s), Math.ceil(s));
    }
  });
}

export interface TitleOpts {
  size: number;
  top?: string; mid?: string; bot?: string; // chrome gradient
  depth?: number; depthColor?: string;
  outline?: string;
  glowColor?: string;
  skew?: number;
  maxWidth?: number;
  align?: 'center' | 'left';
}

/** Extruded chrome arcade logo lettering. Auto-shrinks to maxWidth. */
export function title(g: G, s: string, x: number, y: number, o: TitleOpts) {
  const fam = pixelFamily();
  let size = o.size;
  g.font = `${size}px ${fam}`;
  const mw = o.maxWidth ?? 9999;
  while (g.measureText(s).width > mw && size > 10) { size -= 1; g.font = `${size}px ${fam}`; }
  const tw = g.measureText(s).width;
  const sx = o.align === 'left' ? x : x - tw / 2;
  const depth = o.depth ?? Math.round(size / 6);
  g.save();
  g.translate(sx, y);
  if (o.skew) g.transform(1, 0, o.skew, 1, 0, 0);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  // extrusion
  for (let i = depth; i > 0; i--) {
    g.fillStyle = i === depth ? '#000' : (o.depthColor ?? '#1a0b2e');
    g.fillText(s, i * 0.6, i);
  }
  if (o.glowColor) { g.shadowColor = o.glowColor; g.shadowBlur = size * 0.6; }
  if (o.outline) { g.lineWidth = Math.max(2, size / 9); g.strokeStyle = o.outline; g.lineJoin = 'round'; g.strokeText(s, 0, 0); }
  g.shadowBlur = 0;
  const gr = g.createLinearGradient(0, -size, 0, 0);
  gr.addColorStop(0, o.top ?? '#ffffff');
  gr.addColorStop(0.48, o.mid ?? '#9fe8ff');
  gr.addColorStop(0.52, o.bot ?? '#2a5cff');
  gr.addColorStop(1, o.top ?? '#ffffff');
  g.fillStyle = gr; g.fillText(s, 0, 0);
  // specular glint
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(0, -size * 0.92, tw, Math.max(1, size * 0.08));
  g.restore();
  return size;
}

export function label(g: G, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', font: 'pixel' | 'sans' = 'pixel', letter = 0) {
  g.font = font === 'pixel' ? `${size}px ${pixelFamily()}` : `italic 700 ${size}px system-ui, "Segoe UI", Helvetica, sans-serif`;
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic';
  if (letter && 'letterSpacing' in g) (g as G & { letterSpacing: string }).letterSpacing = `${letter}px`;
  g.fillText(s, x, y);
  if (letter && 'letterSpacing' in g) (g as G & { letterSpacing: string }).letterSpacing = '0px';
}

/** Halftone dot overlay inside a band — printed-flyer texture. */
export function halftone(g: G, x: number, y: number, w: number, h: number, color: string, step = 7, fromTop = true) {
  g.save(); g.fillStyle = color;
  for (let j = 0; j < h; j += step) {
    const t = fromTop ? 1 - j / h : j / h;
    const r = Math.max(0, t * step * 0.48);
    if (r < 0.4) continue;
    for (let i = (j / step) % 2 ? step / 2 : 0; i < w; i += step) {
      g.beginPath(); g.arc(x + i, y + j, r, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
}

export function grain(g: G, w: number, h: number, seed: number, amount = 0.07) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 60; i++) {
    g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${amount * r()})` : `rgba(0,0,0,${amount * 1.5 * r()})`;
    g.fillRect(r() * w, r() * h, 1, 1);
  }
}

export interface Frame {
  accent: string; accent2: string; accent3: string;
  tagline: string; players?: string; genre: string; year: number; isNew?: boolean;
}

/** Flyer furniture: brand strip, NEW burst, credits band with triple stripes, border, grain. */
export function frame(g: G, w: number, h: number, f: Frame, seed: number) {
  // bottom credits band
  const bandY = h - 92;
  const bg = g.createLinearGradient(0, bandY - 60, 0, h);
  bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.35, 'rgba(0,0,0,0.85)'); bg.addColorStop(1, '#000');
  g.fillStyle = bg; g.fillRect(0, bandY - 60, w, h - bandY + 60);
  // triple stripes
  [f.accent, f.accent2, f.accent3].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, bandY + i * 5, w, 3); });
  label(g, f.tagline.toUpperCase(), w / 2, bandY + 36, 14, '#ffffff', 'center', 'sans');
  label(g, `${f.players ?? '1 PLAYER'}  ·  ${f.genre}`, 26, h - 22, 9, f.accent, 'left', 'pixel', 1);
  label(g, `© ${f.year} ARCADIA`, w - 26, h - 22, 9, 'rgba(255,255,255,0.55)', 'right', 'pixel', 1);
  // brand strip
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, w, 34);
  g.fillStyle = f.accent; g.fillRect(0, 34, w, 2);
  label(g, 'ARCADIA', 22, 23, 11, '#ffffff', 'left', 'pixel', 3);
  label(g, 'PRESENTS', w - 22, 23, 9, 'rgba(255,255,255,0.6)', 'right', 'pixel', 2);
  if (f.isNew) burst(g, w - 64, 92, 40, '#ffcf4a', 'NEW!');
  // border + grain
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
  grain(g, w, h, seed);
}

export function burst(g: G, cx: number, cy: number, r: number, color: string, s: string) {
  g.save(); g.translate(cx, cy); g.rotate(-0.22);
  g.beginPath();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2, rr = i % 2 ? r * 0.8 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = '#000'; g.translate(3, 3); g.fill(); g.translate(-3, -3);
  g.fillStyle = color; g.fill();
  g.font = `${Math.round(r * 0.42)}px ${pixelFamily()}`; g.fillStyle = '#1a0b00'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(s, 0, 2);
  g.restore();
}

export function rrect(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
