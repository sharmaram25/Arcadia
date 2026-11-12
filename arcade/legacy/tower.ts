import { TowerEngine } from '@/games/tower-escape/TowerEngine';
import { TowerRenderer } from '@/games/tower-escape/TowerRenderer';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
let r: TowerRenderer;
export default legacy(
  (api) => { const e = new TowerEngine(api.w, api.h); r = new TowerRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api) => { e.handleInput(heldKeys(api.input, keys)); e.update(); },
  () => r.draw(),
);
