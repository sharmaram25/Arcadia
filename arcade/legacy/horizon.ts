import { HorizonEngine } from '@/games/horizon-defender/HorizonEngine';
import { HorizonRenderer } from '@/games/horizon-defender/HorizonRenderer';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
let r: HorizonRenderer;
export default legacy(
  (api) => { const e = new HorizonEngine(api.w, api.h); r = new HorizonRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api) => { e.handleInput(heldKeys(api.input, keys)); e.update(); },
  () => r.draw(),
);
