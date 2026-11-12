// Legacy shim: delegates to the shared arcade audio engine (global mute, lazy context).
import { isMuted, setMuted, sfx } from '@/arcade/core/audio';

type Legacy = 'laser' | 'explosion' | 'coin' | 'achievement' | 'click' | 'gameover';

export class SoundManager {
  play(type: Legacy) {
    switch (type) {
      case 'laser': sfx.shoot(); break;
      case 'explosion': sfx.boom(); break;
      case 'coin': sfx.coin(); break;
      case 'achievement': sfx.power(); break;
      case 'click': sfx.bounce(); break;
      case 'gameover': sfx.lose(); break;
    }
  }
  toggleMute() { setMuted(!isMuted()); }
}

export const soundManager = new SoundManager();
