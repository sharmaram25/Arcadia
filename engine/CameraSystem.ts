import { System } from './System';

export class CameraSystem extends System {
  shakeIntensity: number = 0;
  shakeDecay: number = 0.9;
  offsetX: number = 0;
  offsetY: number = 0;

  shake(intensity: number) {
    this.shakeIntensity = intensity;
  }

  update(deltaTime: number) {
    if (this.shakeIntensity > 0) {
      const angle = Math.random() * Math.PI * 2;
      const offset = Math.random() * this.shakeIntensity;
      
      this.offsetX = Math.cos(angle) * offset;
      this.offsetY = Math.sin(angle) * offset;

      this.shakeIntensity *= this.shakeDecay;

      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.offsetX = 0;
        this.offsetY = 0;
      }
    }
  }
}
