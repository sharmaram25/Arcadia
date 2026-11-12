import { StackPanicEngine } from '@/games/stack-panic/StackPanicEngine';
import { heldKeys, legacy, pressedKeys } from './adapter';

const keys = new Set<string>();
export default legacy(
  (api) => new StackPanicEngine(api.w, api.h),
  (e, api, dt) => {
    for (const k of pressedKeys(api.input)) e.handleKeyDown(k);
    e.handleInput(heldKeys(api.input, keys));
    e.update(dt);
  },
  (e, g) => e.draw(g),
);
