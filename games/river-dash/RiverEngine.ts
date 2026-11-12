import { soundManager } from '@/lib/SoundManager';

export type LaneType = 'ROAD' | 'RIVER' | 'SAFE' | 'GOAL';

export class RiverEngine {
  width: number;
  height: number;
  gridSize: number;

  // Player has a floating sub-x for smooth log riding 
  player: {
    gridX: number;
    gridY: number;
    floatX: number;   // pixel offset within the grid cell from log riding
    isDead: boolean;
    hopOffset: number; // visual hop animation 0→1→0
    hopTimer: number;
  };

  lanes: {
    y: number;
    type: LaneType;
    speed: number;
    objects: { x: number; w: number; type: 'CAR' | 'LOG'; variant: number }[];
  }[];

  score: number;
  gameOver: boolean;
  round: number;

  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.gridSize = 40;
    this.score = 0;
    this.gameOver = false;
    this.round = 1;

    this.player = { gridX: 7, gridY: 14, floatX: 0, isDead: false, hopOffset: 0, hopTimer: 0 };
    this.lanes = [];
    this.initLevel();
  }

  initLevel() {
    this.lanes = [];
    const speedMult = 1 + (this.round - 1) * 0.25; // each round faster

    for (let i = 0; i < 15; i++) {
      let type: LaneType = 'SAFE';
      let speed = 0;

      if (i === 0) {
        type = 'GOAL';
      } else if (i >= 1 && i <= 2) {
        type = 'SAFE';
      } else if (i >= 3 && i <= 7) {
        type = 'RIVER';
        speed = (Math.random() * 1.5 + 1.5) * speedMult * (i % 2 === 0 ? 1 : -1);
      } else if (i === 8) {
        type = 'SAFE';
      } else if (i >= 9 && i <= 13) {
        type = 'ROAD';
        speed = (Math.random() * 2 + 2) * speedMult * (i % 2 === 0 ? 1 : -1);
      } else {
        type = 'SAFE'; // row 14 = start
      }

      const objects: { x: number; w: number; type: 'CAR' | 'LOG'; variant: number }[] = [];

      if (type === 'ROAD') {
        const count = Math.min(2 + Math.floor(Math.random() * 2) + Math.floor(this.round / 2), 5);
        const spacing = this.width / count;
        for (let j = 0; j < count; j++) {
          objects.push({ x: j * spacing + Math.random() * 20, w: 52 + Math.floor(Math.random() * 3) * 14, type: 'CAR', variant: Math.floor(Math.random() * 4) });
        }
      } else if (type === 'RIVER') {
        const count = 2 + Math.floor(Math.random() * 2);
        const spacing = this.width / count;
        for (let j = 0; j < count; j++) {
          objects.push({ x: j * spacing + Math.random() * 30, w: 70 + Math.floor(Math.random() * 3) * 30, type: 'LOG', variant: 0 });
        }
      }

      this.lanes.push({ y: i * this.gridSize, type, speed, objects });
    }
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.round = 1;
    this.player = {
      gridX: Math.floor(this.width / this.gridSize / 2),
      gridY: 14,
      floatX: 0,
      isDead: false,
      hopOffset: 0,
      hopTimer: 0
    };
    this.initLevel();
    if (this.onScoreChange) this.onScoreChange(0);
  }

  handleInput(key: string) {
    if (this.gameOver) return;

    const prev = { ...this.player };
    switch (key) {
      case 'ArrowUp': this.player.gridY--; break;
      case 'ArrowDown': this.player.gridY++; break;
      case 'ArrowLeft': this.player.gridX--; this.player.floatX = 0; break;
      case 'ArrowRight': this.player.gridX++; this.player.floatX = 0; break;
    }

    // Bounds
    if (this.player.gridX < 0) this.player.gridX = 0;
    const maxCols = Math.floor(this.width / this.gridSize);
    if (this.player.gridX >= maxCols) this.player.gridX = maxCols - 1;
    if (this.player.gridY > 14) this.player.gridY = 14;

    // Hop animation
    if (this.player.gridY !== prev.gridY || this.player.gridX !== prev.gridX) {
      this.player.hopTimer = 8; // frames
    }

    // Win — reached goal row
    if (this.player.gridY < 0) {
      this.score += 500 + this.round * 100;
      soundManager.playCollect();
      if (this.onScoreChange) this.onScoreChange(this.score);
      this.round++;
      this.player.gridY = 14;
      this.player.floatX = 0;
      this.initLevel(); // new, faster level layout
    }

    // Score for moving up
    if (this.player.gridY < prev.gridY) {
      this.score += 10;
      if (this.onScoreChange) this.onScoreChange(this.score);
    }
  }

  update() {
    if (this.gameOver) return;

    // Hop animation decay
    if (this.player.hopTimer > 0) this.player.hopTimer--;
    this.player.hopOffset = this.player.hopTimer > 0
      ? Math.sin((this.player.hopTimer / 8) * Math.PI) * 10
      : 0;

    // Move lane objects
    this.lanes.forEach(lane => {
      lane.objects.forEach(obj => {
        obj.x += lane.speed;
        if (lane.speed > 0 && obj.x > this.width) obj.x = -obj.w;
        if (lane.speed < 0 && obj.x < -obj.w) obj.x = this.width;
      });
    });

    const px = this.player.gridX * this.gridSize + this.player.floatX;
    const centerPx = px + this.gridSize / 2;
    const currentLane = this.lanes[this.player.gridY];

    if (!currentLane) return;

    if (currentLane.type === 'ROAD') {
      this.player.floatX = 0; // no drifting on road
      for (const obj of currentLane.objects) {
        if (centerPx > obj.x + 4 && centerPx < obj.x + obj.w - 4) {
          this.die();
          return;
        }
      }
    } else if (currentLane.type === 'RIVER') {
      // Must be on a log — if on one, drift with it
      let onLog = false;
      for (const obj of currentLane.objects) {
        if (centerPx + this.player.floatX > obj.x + 4 && centerPx + this.player.floatX < obj.x + obj.w - 4) {
          onLog = true;
          // Drift player with log speed (fractional)
          this.player.floatX += currentLane.speed;
          // Clamp so player doesn't drift off screen
          const newCenter = this.player.gridX * this.gridSize + this.player.floatX + this.gridSize / 2;
          if (newCenter < 0 || newCenter > this.width) { this.die(); return; }
          break;
        }
      }
      if (!onLog) { this.die(); return; }
    } else {
      this.player.floatX = 0; // reset float on safe/goal
    }
  }

  die() {
    this.gameOver = true;
    soundManager.playGameOver();
    if (this.onGameOver) this.onGameOver();
  }
}
