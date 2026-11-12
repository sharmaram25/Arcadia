import { MazeEngine } from './MazeEngine';

export class MazeRenderer {
  ctx: CanvasRenderingContext2D;
  engine: MazeEngine;
  width: number;
  height: number;
  cellSize: number;

  constructor(ctx: CanvasRenderingContext2D, engine: MazeEngine, width: number, height: number) {
    this.ctx = ctx;
    this.engine = engine;
    this.width = width;
    this.height = height;
    this.cellSize = width / engine.cols;
  }

  draw() {
    // Clear
    this.ctx.fillStyle = '#0B0F19';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Maze
    this.ctx.fillStyle = '#121826';
    // this.ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < this.engine.rows; y++) {
      for (let x = 0; x < this.engine.cols; x++) {
        const cell = this.engine.map[y][x];
        const px = x * this.cellSize;
        const py = y * this.cellSize;

        if (cell === 1) {
          // Wall
          this.ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'; // Faint green fill
          this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
          
          this.ctx.strokeStyle = '#22C55E';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
        } else if (cell === 2) {
          // Orb
          this.ctx.fillStyle = '#A78BFA';
          this.ctx.shadowColor = '#A78BFA';
          this.ctx.shadowBlur = 5;
          this.ctx.beginPath();
          this.ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.shadowBlur = 0;
        }
      }
    }

    // Draw Player
    const p = this.engine.player.pos;
    const px = p.x * this.cellSize + this.cellSize / 2;
    const py = p.y * this.cellSize + this.cellSize / 2;
    
    this.ctx.fillStyle = '#FACC15'; // Yellow
    this.ctx.shadowColor = '#FACC15';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(px, py, this.cellSize / 2 - 2, 0.2 * Math.PI, 1.8 * Math.PI); // Pac-man shape-ish
    this.ctx.lineTo(px, py);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw Enemies
    this.engine.enemies.forEach(e => {
      const ex = e.pos.x * this.cellSize + this.cellSize / 2;
      const ey = e.pos.y * this.cellSize + this.cellSize / 2;
      
      this.ctx.fillStyle = e.color;
      this.ctx.shadowColor = e.color;
      this.ctx.shadowBlur = 10;
      
      // Ghost shape
      this.ctx.beginPath();
      this.ctx.arc(ex, ey - 2, this.cellSize / 2 - 2, Math.PI, 0);
      this.ctx.lineTo(ex + this.cellSize / 2 - 2, ey + this.cellSize / 2 - 2);
      this.ctx.lineTo(ex - this.cellSize / 2 + 2, ey + this.cellSize / 2 - 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });

    // Game Over / Win
    if (this.engine.gameOver || this.engine.won) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 40px "Space Grotesk", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.engine.won ? 'VICTORY' : 'GAME OVER', this.width / 2, this.height / 2);
      
      this.ctx.font = '20px "Inter", sans-serif';
      this.ctx.fillText('Press Restart to play again', this.width / 2, this.height / 2 + 40);
    }
  }
}
