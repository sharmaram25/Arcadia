import { Input } from './input';
import { sfx } from './audio';
import type { EndInfo, Game, GameAPI, GameFactory } from './types';

const STEP = 1 / 60;
const MAX_STEPS = 5; // avoid spiral-of-death after long frames

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RunnerOpts {
  w: number;
  h: number;
  seed: number;
  best: number;
  daily: boolean;
  textInput?: boolean;
  onScore: (score: number) => void;
  onEnd: (score: number, info: EndInfo, seconds: number) => void;
}

/**
 * Drives a single game: fixed-timestep simulation, interpolation-free rendering,
 * DPR-aware canvas, input routing and pause semantics. When paused the rAF loop
 * is fully stopped, so an idle tab costs zero CPU.
 */
export class Runner {
  readonly input = new Input();
  private game: Game | null = null;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private time = 0;
  private score = 0;
  private ended = false;
  private paused = false;
  private shakeAmt = 0;
  private k = 1; // backing pixels per game unit
  private displayScale = 1;
  private rnd: () => number;
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement, private factory: GameFactory, private opts: RunnerOpts) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    this.rnd = mulberry32(opts.seed);
    this.input.textMode = !!opts.textInput;
    this.resize();
    this.bind();
    this.boot();
  }

  private boot() {
    this.score = 0; this.time = 0; this.ended = false; this.acc = 0; this.shakeAmt = 0;
    this.rnd = mulberry32(this.opts.seed);
    this.input.reset();
    const self = this;
    const api: GameAPI = {
      w: this.opts.w, h: this.opts.h, ctx: this.ctx, input: this.input, sfx,
      rnd: () => self.rnd(),
      rndInt: (a, b) => a + Math.floor(self.rnd() * (b - a + 1)),
      pick: arr => arr[Math.floor(self.rnd() * arr.length)],
      get score() { return self.score; },
      setScore(n) { n = Math.max(0, Math.floor(n)); if (n !== self.score) { self.score = n; self.opts.onScore(n); } },
      addScore(n) { api.setScore(self.score + n); },
      best: this.opts.best,
      daily: this.opts.daily,
      get time() { return self.time; },
      gameOver(info = {}) {
        if (self.ended) return;
        self.ended = true;
        self.opts.onEnd(self.score, info, self.time);
      },
      shake(i) { self.shakeAmt = Math.max(self.shakeAmt, i); },
    };
    this.game?.destroy?.();
    this.game = this.factory(api);
    this.opts.onScore(0);
  }

  restart(best?: number) {
    if (best !== undefined) this.opts.best = best;
    this.boot();
    this.resume();
  }

  /**
   * Render at the true on-screen resolution (not a blurry upscale), capped so a
   * 4K fullscreen canvas never exceeds ~4.5M pixels of fill per frame.
   */
  resize(displayScale = this.displayScale) {
    this.displayScale = displayScale;
    const dpr = window.devicePixelRatio || 1;
    const maxK = Math.sqrt(4_500_000 / (this.opts.w * this.opts.h));
    const k = Math.max(0.5, Math.min(displayScale * dpr, maxK));
    const cw = Math.round(this.opts.w * k), ch = Math.round(this.opts.h * k);
    if (cw === this.canvas.width && ch === this.canvas.height) return;
    this.k = k;
    this.canvas.width = cw;
    this.canvas.height = ch;
    if (this.game) this.draw();
  }

  start() { this.paused = false; this.kick(); }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.input.reset();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.draw(); // keep last frame visible
  }

  resume() {
    this.paused = false;
    this.kick();
  }

  get isPaused() { return this.paused; }
  get isEnded() { return this.ended; }

  private kick() {
    if (this.raf || this.disposed) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.paused || this.disposed) return;
    this.acc += Math.min((now - this.last) / 1000, 0.25);
    this.last = now;
    let steps = 0;
    // After game over we keep simulating briefly so explosions finish, but
    // the game is told nothing new; games should ignore input once ended.
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.game!.update(STEP);
      this.input.endStep();
      if (!this.ended) this.time += STEP;
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    const g = this.ctx;
    let ox = 0, oy = 0;
    if (this.shakeAmt > 0.2 && !this.paused) {
      ox = (Math.random() - 0.5) * this.shakeAmt;
      oy = (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt *= 0.88;
    } else this.shakeAmt = 0;
    g.setTransform(this.k, 0, 0, this.k, ox * this.k, oy * this.k);
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    this.game!.render(g);
  }

  // ── DOM wiring ────────────────────────────────────────────────
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (this.input.keyDown(e.code, e.key)) e.preventDefault();
  };
  private onKeyUp = (e: KeyboardEvent) => this.input.keyUp(e.code);
  private toGame(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * this.opts.w, ((e.clientY - r.top) / r.height) * this.opts.h] as const;
  }
  private onPDown = (e: PointerEvent) => {
    if (this.paused) return;
    const [x, y] = this.toGame(e);
    this.input.pointerDown(x, y, e.button === 2);
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    e.preventDefault();
  };
  private onPMove = (e: PointerEvent) => { const [x, y] = this.toGame(e); this.input.pointerMove(x, y); };
  private onPUp = () => this.input.pointerUp();
  private onCtx = (e: Event) => e.preventDefault();
  private onBlur = () => this.input.reset();

  private bind() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.canvas.addEventListener('pointerdown', this.onPDown);
    this.canvas.addEventListener('pointermove', this.onPMove);
    this.canvas.addEventListener('pointerup', this.onPUp);
    this.canvas.addEventListener('pointercancel', this.onPUp);
    this.canvas.addEventListener('contextmenu', this.onCtx);
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.canvas.removeEventListener('pointerdown', this.onPDown);
    this.canvas.removeEventListener('pointermove', this.onPMove);
    this.canvas.removeEventListener('pointerup', this.onPUp);
    this.canvas.removeEventListener('pointercancel', this.onPUp);
    this.canvas.removeEventListener('contextmenu', this.onCtx);
    this.game?.destroy?.();
    this.game = null;
  }
}
