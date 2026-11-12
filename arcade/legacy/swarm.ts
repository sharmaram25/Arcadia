import { SwarmEngine } from '@/games/neon-swarm/SwarmEngine';
import { SwarmRenderer } from '@/games/neon-swarm/SwarmRenderer';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
let r: SwarmRenderer;
export default legacy(
  (api) => { const e = new SwarmEngine(api.w, api.h); r = new SwarmRenderer(api.ctx, e, api.w, api.h); return e; },
  (e, api) => { e.handleInput(heldKeys(api.input, keys)); e.update(); },
  () => r.draw(),
);
