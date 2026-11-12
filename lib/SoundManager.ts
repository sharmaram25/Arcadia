// Legacy shim: delegates to the shared arcade audio engine so every game
// respects the global mute and shares one lazily-created AudioContext.
import { sfx, tone } from '@/arcade/core/audio';

class SoundManager {
  playTone(freq: number, type: OscillatorType, duration: number) { tone(freq, duration, { type, vol: 0.2 }); }
  playCollect() { sfx.coin(); }
  playShoot() { sfx.shoot(); }
  playExplosion() { sfx.boom(); }
  playGameOver() { sfx.lose(); }
}

export const soundManager = new SoundManager();
