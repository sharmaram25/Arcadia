import { BounceBlitzEngine } from '@/games/bounce-blitz/BounceBlitzEngine';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
export default legacy(
  (api) => new BounceBlitzEngine(api.w, api.h),
  (e, api) => { e.handleInput(heldKeys(api.input, keys)); e.update(); },
  (e, g) => e.draw(g),
);
