import { VoidChompEngine } from '@/games/void-chomp/VoidChompEngine';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
export default legacy(
  (api) => new VoidChompEngine(api.w, api.h),
  (e, api, dt) => { e.handleInput(heldKeys(api.input, keys)); e.update(dt); },
  (e, g) => e.draw(g),
);
