import { PrismBreakEngine } from '@/games/prism-break/PrismBreakEngine';
import { heldKeys, legacy } from './adapter';

const keys = new Set<string>();
export default legacy(
  (api) => new PrismBreakEngine(api.w, api.h),
  (e, api) => { e.handleInput(heldKeys(api.input, keys)); e.update(); },
  (e, g) => e.draw(g),
);
