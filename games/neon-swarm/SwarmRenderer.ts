import { SwarmEngine } from './SwarmEngine';

export class SwarmRenderer {
  ctx: CanvasRenderingContext2D;
  engine: SwarmEngine;
  width: number;
  height: number;

  constructor(ctx: CanvasRenderingContext2D, engine: SwarmEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
  }

  draw() {
    // Clear
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Grid (Faint)
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth = 1;
    const gridSize = this.engine.gridSize;
    
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Draw Obstacles
    this.ctx.fillStyle = '#FF00FF';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#FF00FF';
    
    this.engine.obstacles.forEach(obs => {
      const size = gridSize - 4;
      const alpha = obs.health / 3;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(obs.pos.x - size/2, obs.pos.y - size/2, size, size);
      this.ctx.globalAlpha = 1;
    });

    // Draw Swarm
    this.ctx.fillStyle = '#00FF00';
    this.ctx.shadowColor = '#00FF00';
    
    this.engine.segments.forEach(seg => {
      const size = gridSize - 2;
      this.ctx.beginPath();
      this.ctx.arc(seg.pos.x, seg.pos.y, size/2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Eyes if head
      if (seg.type === 'head') {
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(seg.pos.x - 2, seg.pos.y - 2, 4, 4);
        this.ctx.fillStyle = '#00FF00';
      }
    });

    // Draw Player
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.shadowColor = '#00FFFF';
    const p = this.engine.player;
    
    this.ctx.beginPath();
    this.ctx.moveTo(p.pos.x, p.pos.y - 10);
    this.ctx.lineTo(p.pos.x - 10, p.pos.y + 10);
    this.ctx.lineTo(p.pos.x + 10, p.pos.y + 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw Bullets
    this.ctx.fillStyle = '#FFF';
    this.ctx.shadowColor = '#FFF';
    this.engine.bullets.forEach(b => {
      this.ctx.fillRect(b.pos.x - 2, b.pos.y - 5, 4, 10);
    });

    // Draw Particles
    this.engine.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.globalAlpha = p.life / 30;
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    });
    
    this.ctx.shadowBlur = 0;
  }
}
