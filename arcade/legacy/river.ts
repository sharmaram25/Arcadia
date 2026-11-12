import { RiverEngine } from '@/games/river-dash/RiverEngine';
import { RiverRenderer } from '@/games/river-dash/RiverRenderer';
import { legacy, pressedKeys } from './adapter';

let r: RiverRenderer;
export default legacy(
  (api) => { const e = new RiverEngine(api.w, api.h); r = new RiverRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api) => { for (const k of pressedKeys(api.input)) e.handleInput(k); e.update(); },
  () => r.draw(),
);
