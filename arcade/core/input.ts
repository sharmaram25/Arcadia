// Unified input: keyboard, on-screen touch pad and pointer all feed the same
// virtual buttons, so every game gets touch support for free.
// "pressed" is edge-triggered and survives until the next fixed update step,
// so taps are never lost on high-refresh displays or slow frames.

export type Btn = 'left' | 'right' | 'up' | 'down' | 'a' | 'b';

const KEYMAP: Record<string, Btn> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
  Space: 'a', KeyZ: 'a', KeyJ: 'a', Enter: 'a',
  KeyX: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b',
};
// In text mode letters are text, so only non-letter keys map to buttons.
const TEXT_SAFE = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter']);

export interface Pointer {
  x: number; y: number;
  down: boolean; pressed: boolean; released: boolean;
  rightPressed: boolean;
  active: boolean; // pointer has been used at least once
}

export class Input {
  textMode = false;
  private codes = new Set<string>();
  private virtual = new Set<Btn>();
  private count: Record<Btn, number> = { left: 0, right: 0, up: 0, down: 0, a: 0, b: 0 };
  private pressedSet = new Set<Btn>();
  private releasedSet = new Set<Btn>();
  /** Printable characters typed since last step (text-mode games). */
  typed: string[] = [];
  /** Raw key codes pressed since last step. */
  codesPressed: string[] = [];
  pointer: Pointer = { x: -1, y: -1, down: false, pressed: false, released: false, rightPressed: false, active: false };

  down(b: Btn) { return this.count[b] > 0; }
  pressed(b: Btn) { return this.pressedSet.has(b); }
  released(b: Btn) { return this.releasedSet.has(b); }
  axisX() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); }
  axisY() { return (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0); }
  /** Any "action" this step: A, or a pointer press. */
  action() { return this.pressed('a') || this.pointer.pressed; }

  private inc(b: Btn) {
    if (this.count[b]++ === 0) this.pressedSet.add(b);
  }
  private dec(b: Btn) {
    if (this.count[b] > 0 && --this.count[b] === 0) this.releasedSet.add(b);
  }

  /** Returns true if the key is meaningful to the game (caller should preventDefault). */
  keyDown(code: string, key: string): boolean {
    let used = false;
    if (this.textMode && key.length === 1 && /[a-zA-Z]/.test(key)) {
      this.typed.push(key.toLowerCase());
      used = true;
    }
    if (this.textMode && (code === 'Backspace' || code === 'Enter' || code === 'Space' || code === 'Quote' || code === 'Slash')) used = true;
    if (!this.codes.has(code)) {
      this.codes.add(code);
      this.codesPressed.push(code);
      const b = KEYMAP[code];
      if (b && (!this.textMode || TEXT_SAFE.has(code))) { this.inc(b); used = true; }
      if (/^Digit[1-9]$/.test(code)) used = true;
    } else if (KEYMAP[code]) {
      used = true; // key repeat: still swallow to stop page scrolling
    }
    return used;
  }

  keyUp(code: string) {
    if (!this.codes.delete(code)) return;
    const b = KEYMAP[code];
    if (b && (!this.textMode || TEXT_SAFE.has(code))) this.dec(b);
  }

  virtualDown(b: Btn) { if (!this.virtual.has(b)) { this.virtual.add(b); this.inc(b); } }
  virtualUp(b: Btn) { if (this.virtual.delete(b)) this.dec(b); }

  pointerMove(x: number, y: number) { this.pointer.x = x; this.pointer.y = y; this.pointer.active = true; }
  pointerDown(x: number, y: number, right: boolean) {
    this.pointerMove(x, y);
    if (right) { this.pointer.rightPressed = true; return; }
    this.pointer.down = true; this.pointer.pressed = true;
  }
  pointerUp() { if (this.pointer.down) { this.pointer.down = false; this.pointer.released = true; } }

  /** Called after every fixed update step. */
  endStep() {
    this.pressedSet.clear();
    this.releasedSet.clear();
    this.typed.length = 0;
    this.codesPressed.length = 0;
    this.pointer.pressed = false;
    this.pointer.released = false;
    this.pointer.rightPressed = false;
  }

  /** Drop everything held (on pause / blur) so keys never get "stuck". */
  reset() {
    this.codes.clear();
    this.virtual.clear();
    (Object.keys(this.count) as Btn[]).forEach(k => { this.count[k] = 0; });
    this.pointer.down = false;
    this.endStep();
  }
}
