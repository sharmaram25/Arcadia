// Adapts the original v2 engines to the unified runtime. Engines keep their
// own logic; the runtime supplies a fixed 60 Hz step, pause, touch and scoring.
import type { Input } from '../core/input';
import type { Game, GameAPI, GameFactory } from '../core/types';

/** Emulates the `keys` Set the old wrappers built from window key events. */
export function heldKeys(input: Input, out: Set<string>) {
  out.clear();
  if (input.down('left')) out.add('ArrowLeft');
  if (input.down('right')) out.add('ArrowRight');
  if (input.down('up')) out.add('ArrowUp');
  if (input.down('down')) out.add('ArrowDown');
  if (input.down('a')) { out.add(' '); out.add('Space'); }
  return out;
}

/** Edge-triggered key names this step, for engines with handleInput(key). */
export function pressedKeys(input: Input): string[] {
  const k: string[] = [];
  if (input.pressed('left')) k.push('ArrowLeft');
  if (input.pressed('right')) k.push('ArrowRight');
  if (input.pressed('up')) k.push('ArrowUp');
  if (input.pressed('down')) k.push('ArrowDown');
  if (input.pressed('a')) k.push(' ');
  return k;
}

interface LegacyEngine {
  score?: number;
  onScoreChange?: (s: number) => void;
  onGameOver?: () => void;
  won?: boolean;
  isWin?: boolean;
}

export function legacy<E extends LegacyEngine>(
  make: (api: GameAPI) => E,
  step: (e: E, api: GameAPI, dt: number) => void,
  render: (e: E, g: CanvasRenderingContext2D) => void,
  message?: (e: E) => string | undefined,
): GameFactory {
  return (api) => {
    const e = make(api);
    e.onScoreChange = (s) => api.setScore(s);
    e.onGameOver = () => {
      // defer so the engine finishes its own state transition first
      queueMicrotask(() => api.gameOver({ win: !!(e.won || e.isWin), message: message?.(e) }));
    };
    let over = false;
    const game: Game = {
      update(dt) {
        if (over) return;
        step(e, api, dt);
      },
      render(g) { render(e, g); },
    };
    const end = e.onGameOver;
    e.onGameOver = () => { over = true; end(); };
    return game;
  };
}
