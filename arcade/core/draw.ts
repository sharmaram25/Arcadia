// Tiny drawing toolkit shared by all games. Avoids shadowBlur in hot paths
// (it is the single most expensive canvas op) — glow is faked with layered alpha.

let pixelFamily = '';
function pixel() {
  if (!pixelFamily && typeof document !== 'undefined') {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--font-pixel').trim();
    pixelFamily = v || 'monospace';
  }
  return pixelFamily || 'monospace';
}

export const C = {
  bg: '#07080f',
  cyan: '#5ef2ff',
  pink: '#ff4fa3',
  yellow: '#ffd23f',
  green: '#4dff8a',
  purple: '#a78bfa',
  orange: '#ff8a3d',
  red: '#ff4757',
  white: '#f2f4ff',
  dim: '#5a6080',
};

interface TextOpts {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  font?: 'pixel' | 'mono' | 'sans';
  alpha?: number;
  weight?: string;
}

export function text(g: CanvasRenderingContext2D, s: string | number, x: number, y: number, o: TextOpts = {}) {
  const size = o.size ?? 12;
  const fam = o.font === 'mono' ? 'ui-monospace, Menlo, Consolas, monospace'
    : o.font === 'sans' ? 'system-ui, sans-serif' : pixel();
  g.font = `${o.weight ?? ''} ${size}px ${fam}`;
  g.textAlign = o.align ?? 'left';
  g.textBaseline = o.baseline ?? 'top';
  g.fillStyle = o.color ?? C.white;
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  g.fillText(String(s), x, y);
  if (o.alpha !== undefined) g.globalAlpha = 1;
}

export function clear(g: CanvasRenderingContext2D, w: number, h: number, color = C.bg) {
  g.fillStyle = color;
  g.fillRect(0, 0, w, h);
}

/** Cheap glow: draws a soft halo by stacking translucent strokes. */
export function glowRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  g.fillStyle = color;
  g.globalAlpha = 0.18;
  g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.globalAlpha = 1;
  g.fillRect(x, y, w, h);
}

export function glowCircle(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.fillStyle = color;
  g.globalAlpha = 0.2;
  g.beginPath(); g.arc(x, y, r * 1.8, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Static starfield / grid backdrop rendered once to an offscreen canvas. */
export function makeBackdrop(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  draw(g);
  return (target: CanvasRenderingContext2D) => target.drawImage(c, 0, 0, w, h);
}

export function stars(g: CanvasRenderingContext2D, w: number, h: number, n: number, rnd = Math.random) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.6})`;
    const s = rnd() < 0.1 ? 2 : 1;
    g.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

// ── Pooled particles: fixed-size typed arrays, zero allocation per frame ──
export class Particles {
  private x: Float32Array; private y: Float32Array;
  private vx: Float32Array; private vy: Float32Array;
  private life: Float32Array; private max: Float32Array;
  private col: string[];
  private size: Float32Array;
  private n = 0;
  constructor(private cap = 400, private gravity = 0) {
    this.x = new Float32Array(cap); this.y = new Float32Array(cap);
    this.vx = new Float32Array(cap); this.vy = new Float32Array(cap);
    this.life = new Float32Array(cap); this.max = new Float32Array(cap);
    this.size = new Float32Array(cap);
    this.col = new Array(cap).fill('#fff');
  }
  burst(x: number, y: number, count: number, color: string, speed = 120, life = 0.6, size = 2) {
    for (let i = 0; i < count; i++) {
      const k = this.n < this.cap ? this.n++ : Math.floor(Math.random() * this.cap);
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.x[k] = x; this.y[k] = y;
      this.vx[k] = Math.cos(a) * s; this.vy[k] = Math.sin(a) * s;
      this.life[k] = this.max[k] = life * (0.6 + Math.random() * 0.4);
      this.size[k] = size;
      this.col[k] = color;
    }
  }
  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        const j = --this.n; // swap-remove
        this.x[i] = this.x[j]; this.y[i] = this.y[j];
        this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j];
        this.life[i] = this.life[j]; this.max[i] = this.max[j];
        this.size[i] = this.size[j]; this.col[i] = this.col[j];
        i--; continue;
      }
      this.vy[i] += this.gravity * dt;
      this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt;
    }
  }
  render(g: CanvasRenderingContext2D) {
    for (let i = 0; i < this.n; i++) {
      g.globalAlpha = this.life[i] / this.max[i];
      g.fillStyle = this.col[i];
      const s = this.size[i];
      g.fillRect(this.x[i] - s / 2, this.y[i] - s / 2, s, s);
    }
    g.globalAlpha = 1;
  }
  clear() { this.n = 0; }
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist2 = (ax: number, ay: number, bx: number, by: number) => (ax - bx) ** 2 + (ay - by) ** 2;
export const rectsOverlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Standard "dead" fade overlay games can call while the host card animates in. */
export function vignette(g: CanvasRenderingContext2D, w: number, h: number, a = 0.5) {
  g.fillStyle = `rgba(0,0,0,${a})`;
  g.fillRect(0, 0, w, h);
}
