import type { Input } from './input';
import type { Sfx } from './audio';

export interface EndInfo {
  win?: boolean;
  /** Short line shown on the game-over card, e.g. "Wave 7" or "Solved in 1:42". */
  message?: string;
  /** Optional spoiler-free share text (e.g. a result grid) appended to the share card. */
  share?: string;
}

/** Everything a game is allowed to touch. Games never see React or the DOM. */
export interface GameAPI {
  readonly w: number;
  readonly h: number;
  readonly ctx: CanvasRenderingContext2D;
  readonly input: Input;
  readonly sfx: Sfx;
  /** Seeded RNG: identical sequence for everyone on daily-challenge runs. */
  rnd(): number;
  rndInt(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  readonly score: number;
  setScore(n: number): void;
  addScore(n: number): void;
  /** Previous personal best for this game (0 if none). */
  readonly best: number;
  readonly daily: boolean;
  /** Seconds of un-paused play so far. */
  readonly time: number;
  gameOver(info?: EndInfo): void;
  /** Trigger screen shake (host applies it to the render transform). */
  shake(intensity: number): void;
}

export interface Game {
  /** Fixed step, dt = 1/60 s. */
  update(dt: number): void;
  render(g: CanvasRenderingContext2D): void;
  destroy?(): void;
}

export type GameFactory = (api: GameAPI) => Game;
export interface GameModule { default: GameFactory }
