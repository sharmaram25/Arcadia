import { DefenderEngine } from '@/games/star-defender/DefenderEngine';
import { DefenderRenderer } from '@/games/star-defender/DefenderRenderer';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
let r: DefenderRenderer;
export default legacy(
  (api) => { const e = new DefenderEngine(api.w, api.h); r = new DefenderRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api, dt) => { e.handleInput(heldKeys(api.input, keys), dt); e.update(dt); },
  () => r.draw(1 / 60),
);
