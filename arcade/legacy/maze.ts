import { MazeEngine } from '@/games/maze-runner/MazeEngine';
import { MazeRenderer } from '@/games/maze-runner/MazeRenderer';
import { legacy, pressedKeys } from './adapter';

let r: MazeRenderer;
export default legacy(
  (api) => { const e = new MazeEngine(30); e.init(); r = new MazeRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api) => { for (const k of pressedKeys(api.input)) e.handleInput(k); e.update(); },
  () => r.draw(),
);
