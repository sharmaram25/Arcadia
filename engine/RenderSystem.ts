import { System } from './System';
import { TransformComponent } from './components/TransformComponent';
import { RenderComponent } from './components/RenderComponent';

export class RenderSystem extends System {
  update(deltaTime: number) {
    // Render logic is handled in draw()
  }

  draw() {
    const ctx = this.engine.ctx;
    const canvas = this.engine.canvas;
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get renderable entities and sort by zIndex
    const renderables = Array.from(this.engine.entities.values())
      .filter(e => e.hasComponent(TransformComponent) && e.hasComponent(RenderComponent))
      .map(e => ({
        transform: e.getComponent(TransformComponent)!,
        render: e.getComponent(RenderComponent)!
      }))
      .sort((a, b) => a.render.zIndex - b.render.zIndex);

    for (const { transform, render } of renderables) {
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.rotate(transform.rotation);
      ctx.scale(transform.scale.x, transform.scale.y);

      ctx.fillStyle = render.color;

      if (render.shape === 'rectangle') {
        // Draw centered
        ctx.fillRect(-render.width / 2, -render.height / 2, render.width, render.height);
      } else if (render.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, render.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
