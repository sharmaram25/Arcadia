import { soundManager } from '@/lib/SoundManager';

export type Point = { x: number; y: number };
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

// 0: Empty/Path, 1: Wall, 2: Orb, 3: Power Orb (optional, using 2 for now)
const MAP_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 1, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 1, 2, 2, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class MazeEngine {
  gridSize: number;
  cols: number;
  rows: number;
  map: number[][];
  
  player: {
    pos: Point; // Grid coordinates (float for smooth movement)
    dir: Direction;
    nextDir: Direction;
    speed: number;
  };

  enemies: {
    pos: Point;
    dir: Direction;
    speed: number;
    color: string;
  }[];

  score: number;
  gameOver: boolean;
  won: boolean;
  
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
    this.rows = MAP_LAYOUT.length;
    this.cols = MAP_LAYOUT[0].length;
    this.map = JSON.parse(JSON.stringify(MAP_LAYOUT)); // Deep copy
    
    this.player = {
      pos: { x: 1, y: 1 },
      dir: 'NONE',
      nextDir: 'NONE',
      speed: 0.15,
    };

    this.enemies = [
      { pos: { x: 9, y: 8 }, dir: 'UP', speed: 0.1, color: '#FF4444' },
      { pos: { x: 10, y: 8 }, dir: 'UP', speed: 0.1, color: '#FF8844' },
      { pos: { x: 9, y: 9 }, dir: 'UP', speed: 0.08, color: '#44FF88' },
    ];

    this.score = 0;
    this.gameOver = false;
    this.won = false;
  }

  init() {
    this.map = JSON.parse(JSON.stringify(MAP_LAYOUT));
    this.player = {
      pos: { x: 1, y: 1 },
      dir: 'NONE',
      nextDir: 'NONE',
      speed: 0.15,
    };
    this.enemies = [
      { pos: { x: 9, y: 8 }, dir: 'UP', speed: 0.1, color: '#FF4444' },
      { pos: { x: 10, y: 8 }, dir: 'UP', speed: 0.1, color: '#FF8844' },
      { pos: { x: 9, y: 9 }, dir: 'UP', speed: 0.08, color: '#44FF88' },
    ];
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    if (this.onScoreChange) this.onScoreChange(0);
  }

  handleInput(key: string) {
    if (this.gameOver || this.won) return;
    
    let requested: Direction = 'NONE';
    switch (key) {
      case 'ArrowUp': requested = 'UP'; break;
      case 'ArrowDown': requested = 'DOWN'; break;
      case 'ArrowLeft': requested = 'LEFT'; break;
      case 'ArrowRight': requested = 'RIGHT'; break;
    }

    if (requested !== 'NONE') {
      this.player.nextDir = requested;
      
      const opposites: Record<Direction, Direction> = {
        'UP': 'DOWN', 'DOWN': 'UP',
        'LEFT': 'RIGHT', 'RIGHT': 'LEFT',
        'NONE': 'NONE'
      };
      
      if (opposites[this.player.dir] === requested) {
        this.player.dir = requested;
        this.player.nextDir = 'NONE';
      }
    }
  }

  update() {
    if (this.gameOver || this.won) return;

    this.moveCharacter(this.player, true);
    
    this.enemies.forEach(enemy => {
      this.moveEnemy(enemy);
      
      // Collision with player
      const dist = Math.sqrt(
        Math.pow(this.player.pos.x - enemy.pos.x, 2) + 
        Math.pow(this.player.pos.y - enemy.pos.y, 2)
      );
      
      if (dist < 0.5) {
        this.gameOver = true;
        soundManager.playGameOver();
        if (this.onGameOver) this.onGameOver();
      }
    });

    // Check win condition (no orbs left)
    let hasOrbs = false;
    for (let row of this.map) {
      if (row.includes(2)) {
        hasOrbs = true;
        break;
      }
    }
    
    if (!hasOrbs) {
      this.won = true;
      // You could trigger next level or win screen here
      if (this.onGameOver) this.onGameOver(); // Reusing game over for now
    }
  }

  moveCharacter(char: typeof this.player, isPlayer: boolean) {
    // Snap to grid center if close enough
    const centerSnap = 0.08;
    const onCenter = Math.abs(char.pos.x - Math.round(char.pos.x)) < centerSnap &&
                     Math.abs(char.pos.y - Math.round(char.pos.y)) < centerSnap;

    if (onCenter) {
      // Snap exactly to center to avoid drift
      char.pos.x = Math.round(char.pos.x);
      char.pos.y = Math.round(char.pos.y);

      if (isPlayer && char.nextDir !== 'NONE') {
        if (this.canMove(char.pos, char.nextDir)) {
          char.dir = char.nextDir;
          char.nextDir = 'NONE';
        }
      }

      if (!this.canMove(char.pos, char.dir)) {
        char.dir = 'NONE';
      }
      
      // Collect Orb
      if (isPlayer) {
        const tileX = Math.round(char.pos.x);
        const tileY = Math.round(char.pos.y);
        if (this.map[tileY][tileX] === 2) {
          this.map[tileY][tileX] = 0;
          this.score += 10;
          soundManager.playCollect();
          if (this.onScoreChange) this.onScoreChange(this.score);
        }
      }
    }

    // Apply movement
    switch (char.dir) {
      case 'UP': char.pos.y -= char.speed; break;
      case 'DOWN': char.pos.y += char.speed; break;
      case 'LEFT': char.pos.x -= char.speed; break;
      case 'RIGHT': char.pos.x += char.speed; break;
    }
    
    // Wrap around (Teleport)
    if (char.pos.x < 0) char.pos.x = this.cols - 1;
    if (char.pos.x >= this.cols) char.pos.x = 0;
  }

  moveEnemy(enemy: typeof this.enemies[0]) {
    const centerSnap = 0.08;
    const onCenter = Math.abs(enemy.pos.x - Math.round(enemy.pos.x)) < centerSnap &&
                     Math.abs(enemy.pos.y - Math.round(enemy.pos.y)) < centerSnap;

    if (onCenter) {
      enemy.pos.x = Math.round(enemy.pos.x);
      enemy.pos.y = Math.round(enemy.pos.y);

      // Simple AI: Random valid direction, prefer not reversing
      const validDirs: Direction[] = [];
      const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      
      dirs.forEach(d => {
        if (this.canMove(enemy.pos, d)) {
          // Don't reverse immediately unless dead end
          if (d === 'UP' && enemy.dir === 'DOWN') return;
          if (d === 'DOWN' && enemy.dir === 'UP') return;
          if (d === 'LEFT' && enemy.dir === 'RIGHT') return;
          if (d === 'RIGHT' && enemy.dir === 'LEFT') return;
          validDirs.push(d);
        }
      });

      if (validDirs.length > 0) {
        // Simple chase logic: if player is in line of sight or just biased random
        // For now, just random
        enemy.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
      } else {
        // Dead end, reverse
        if (enemy.dir === 'UP') enemy.dir = 'DOWN';
        else if (enemy.dir === 'DOWN') enemy.dir = 'UP';
        else if (enemy.dir === 'LEFT') enemy.dir = 'RIGHT';
        else if (enemy.dir === 'RIGHT') enemy.dir = 'LEFT';
      }
    }

    switch (enemy.dir) {
      case 'UP': enemy.pos.y -= enemy.speed; break;
      case 'DOWN': enemy.pos.y += enemy.speed; break;
      case 'LEFT': enemy.pos.x -= enemy.speed; break;
      case 'RIGHT': enemy.pos.x += enemy.speed; break;
    }
    
    if (enemy.pos.x < 0) enemy.pos.x = this.cols - 1;
    if (enemy.pos.x >= this.cols) enemy.pos.x = 0;
  }

  canMove(pos: Point, dir: Direction): boolean {
    let tx = Math.round(pos.x);
    let ty = Math.round(pos.y);

    switch (dir) {
      case 'UP': ty--; break;
      case 'DOWN': ty++; break;
      case 'LEFT': tx--; break;
      case 'RIGHT': tx++; break;
    }

    // Check bounds (except for warp tunnel)
    if (ty < 0 || ty >= this.rows) return false;
    if (tx < 0 || tx >= this.cols) return true; // Allow warp

    return this.map[ty][tx] !== 1;
  }
}
