export class InputManager {
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set(); // For key down/up detection
  
  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  update() {
    // Copy current keys to previous keys for next frame comparison
    // This should be called at the END of the frame
    this.previousKeys = new Set(this.keys);
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key) && !this.previousKeys.has(key);
  }

  isKeyUp(key: string): boolean {
    return !this.keys.has(key) && this.previousKeys.has(key);
  }
  
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
    this.keys.clear();
    this.previousKeys.clear();
  }
}
