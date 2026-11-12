import { soundManager } from '@/lib/SoundManager';

export type Rect = { x: number; y: number; w: number; h: number };

export interface LevelDef {
  platforms: Rect[];
  ladders: Rect[];
  barrelSpawnX: number;
  barrelSpawnY: number;
  goalPlatIndex: number;   // index in platforms that is the goal
  theme: { platform: string; bg: string; glow: string };
}

export class TowerEngine {
  width: number;
  height: number;

  player: {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    isGrounded: boolean;
    isClimbing: boolean;
    facingRight: boolean;
  };

  platforms: Rect[];
  ladders: Rect[];
  barrels: { x: number; y: number; r: number; vx: number; vy: number; onGround: boolean; angle: number }[];

  score: number;
  gameOver: boolean;
  won: boolean;
  level: number;
  barrelTimer: number;
  barrelInterval: number;  // frames between spawns (decreases each level)

  currentLevelDef: LevelDef | null = null;

  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.level = 1;
    this.barrelTimer = 0;
    this.barrelInterval = 200;

    this.player = {
      x: 50, y: height - 50,
      w: 20, h: 30,
      vx: 0, vy: 0,
      isGrounded: true,
      isClimbing: false,
      facingRight: true,
    };

    this.platforms = [];
    this.ladders = [];
    this.barrels = [];

    this.initLevel();
  }

  // ── Level definitions ────────────────────────────────────────────────
  buildLevel(lvl: number): LevelDef {
    const fH = 20;
    const W = this.width;
    const H = this.height;

    const themes = [
      { platform: '#7c3aed', bg: '#0B0F19', glow: '#a78bfa' }, // purple
      { platform: '#0e7490', bg: '#030f1a', glow: '#22d3ee' }, // teal
      { platform: '#b45309', bg: '#120800', glow: '#f59e0b' }, // amber
      { platform: '#065f46', bg: '#001208', glow: '#34d399' }, // emerald
      { platform: '#9f1239', bg: '#120009', glow: '#fb7185' }, // rose
    ];

    const theme = themes[(lvl - 1) % themes.length];

    switch (lvl % 5 === 0 ? 5 : lvl % 5) {
      case 1: {
        // Classic zigzag — same as original but tighter
        const gap = 95;
        const plats: Rect[] = [
          { x: 0, y: H - fH, w: W, h: fH },                        // ground
          { x: 0, y: H - fH - gap, w: W - 60, h: fH },             // L1
          { x: 60, y: H - fH - gap * 2, w: W - 60, h: fH },        // L2
          { x: 0, y: H - fH - gap * 3, w: W - 60, h: fH },         // L3
          { x: 60, y: H - fH - gap * 4, w: W - 60, h: fH },        // L4
          { x: W / 2 - 50, y: H - fH - gap * 5, w: 100, h: fH },   // goal
        ];
        const lads: Rect[] = [
          { x: W - 90, y: H - fH - gap, w: 28, h: gap },
          { x: 70, y: H - fH - gap * 2, w: 28, h: gap },
          { x: W - 90, y: H - fH - gap * 3, w: 28, h: gap },
          { x: 70, y: H - fH - gap * 4, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 5, w: 28, h: gap },
        ];
        return { platforms: plats, ladders: lads, barrelSpawnX: 20, barrelSpawnY: 80, goalPlatIndex: 5, theme };
      }
      case 2: {
        // Center-climbing tower — platforms stagger left-right less, more height
        const gap = 80;
        const plats: Rect[] = [
          { x: 0, y: H - fH, w: W, h: fH },
          { x: 20, y: H - fH - gap, w: W - 40, h: fH },
          { x: 0, y: H - fH - gap * 2, w: W / 2 + 20, h: fH },
          { x: W / 2 - 20, y: H - fH - gap * 3, w: W / 2 + 20, h: fH },
          { x: 0, y: H - fH - gap * 4, w: W / 2, h: fH },
          { x: W / 4, y: H - fH - gap * 5, w: W / 2, h: fH },
          { x: W / 2 - 45, y: H - fH - gap * 6, w: 90, h: fH },
        ];
        const lads: Rect[] = [
          { x: W / 2 - 14, y: H - fH - gap, w: 28, h: gap },
          { x: W / 2 - 80, y: H - fH - gap * 2, w: 28, h: gap },
          { x: W / 2 + 52, y: H - fH - gap * 3, w: 28, h: gap },
          { x: W / 2 - 80, y: H - fH - gap * 4, w: 28, h: gap },
          { x: W / 2 + 52, y: H - fH - gap * 5, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 6, w: 28, h: gap },
        ];
        return { platforms: plats, ladders: lads, barrelSpawnX: W - 30, barrelSpawnY: 60, goalPlatIndex: 6, theme };
      }
      case 3: {
        // Wide open with floating islands
        const gap = 85;
        const plats: Rect[] = [
          { x: 0, y: H - fH, w: W, h: fH },
          { x: 0, y: H - fH - gap, w: W / 3 + 20, h: fH },
          { x: W / 3 + 30, y: H - fH - gap * 1.5, w: W / 3, h: fH },
          { x: W * 2 / 3 + 10, y: H - fH - gap * 2, w: W / 3 - 10, h: fH },
          { x: 0, y: H - fH - gap * 2.5, w: W / 3, h: fH },
          { x: W / 3 + 20, y: H - fH - gap * 3.5, w: W / 3 + 20, h: fH },
          { x: W * 2 / 3, y: H - fH - gap * 4.5, w: W / 3, h: fH },
          { x: W / 3, y: H - fH - gap * 5.5, w: W / 3, h: fH },   // goal
        ];
        const lads: Rect[] = [
          { x: W / 3 - 28, y: H - fH - gap, w: 28, h: gap },
          { x: W * 2 / 3 - 14, y: H - fH - gap * 1.5, w: 28, h: gap },
          { x: W * 2 / 3 + 10, y: H - fH - gap * 2, w: 28, h: gap * 0.5 },
          { x: 10, y: H - fH - gap * 2.5, w: 28, h: gap * 0.5 },
          { x: W / 3 + 30, y: H - fH - gap * 3.5, w: 28, h: gap },
          { x: W * 2 / 3, y: H - fH - gap * 4.5, w: 28, h: gap },
          { x: W / 3 + 20, y: H - fH - gap * 5.5, w: 28, h: gap },
        ];
        return { platforms: plats, ladders: lads, barrelSpawnX: 20, barrelSpawnY: 70, goalPlatIndex: 7, theme };
      }
      case 4: {
        // Serpentine — extra platforms, narrower
        const gap = 75;
        const plats: Rect[] = [
          { x: 0, y: H - fH, w: W, h: fH },
          { x: W - 120, y: H - fH - gap, w: 120, h: fH },
          { x: W / 2 - 60, y: H - fH - gap * 2, w: 120, h: fH },
          { x: 0, y: H - fH - gap * 3, w: 120, h: fH },
          { x: W / 2 - 60, y: H - fH - gap * 4, w: 120, h: fH },
          { x: W - 120, y: H - fH - gap * 5, w: 120, h: fH },
          { x: W / 2 - 50, y: H - fH - gap * 6, w: 100, h: fH },  // goal
        ];
        const lads: Rect[] = [
          { x: W - 100, y: H - fH - gap, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 2, w: 28, h: gap },
          { x: 0, y: H - fH - gap * 3, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 4, w: 28, h: gap },
          { x: W - 100, y: H - fH - gap * 5, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 6, w: 28, h: gap },
        ];
        return { platforms: plats, ladders: lads, barrelSpawnX: 20, barrelSpawnY: 60, goalPlatIndex: 6, theme };
      }
      default: { // case 5: hardest — maze-like
        const gap = 70;
        const plats: Rect[] = [
          { x: 0, y: H - fH, w: W, h: fH },
          { x: 0, y: H - fH - gap, w: W - 80, h: fH },
          { x: 80, y: H - fH - gap * 2, w: W - 80, h: fH },
          { x: 0, y: H - fH - gap * 3, w: W - 80, h: fH },
          { x: 80, y: H - fH - gap * 4, w: W - 80, h: fH },
          { x: 0, y: H - fH - gap * 5, w: W - 80, h: fH },
          { x: 80, y: H - fH - gap * 6, w: W - 80, h: fH },
          { x: W / 2 - 45, y: H - fH - gap * 7, w: 90, h: fH },   // goal
        ];
        const lads: Rect[] = [
          { x: W - 108, y: H - fH - gap, w: 28, h: gap },
          { x: 80, y: H - fH - gap * 2, w: 28, h: gap },
          { x: W - 108, y: H - fH - gap * 3, w: 28, h: gap },
          { x: 80, y: H - fH - gap * 4, w: 28, h: gap },
          { x: W - 108, y: H - fH - gap * 5, w: 28, h: gap },
          { x: 80, y: H - fH - gap * 6, w: 28, h: gap },
          { x: W / 2 - 14, y: H - fH - gap * 7, w: 28, h: gap },
        ];
        return { platforms: plats, ladders: lads, barrelSpawnX: 20, barrelSpawnY: 50, goalPlatIndex: 7, theme };
      }
    }
  }

  initLevel() {
    const def = this.buildLevel(this.level);
    this.currentLevelDef = def;
    this.platforms = def.platforms;
    this.ladders = def.ladders;
    this.barrels = [];
    this.barrelTimer = 0;
    // Barrel interval decreases with level (min 90 frames)
    this.barrelInterval = Math.max(90, 200 - (this.level - 1) * 18);

    this.player = {
      x: 50, y: this.height - 50,
      w: 20, h: 30,
      vx: 0, vy: 0,
      isGrounded: true,
      isClimbing: false,
      facingRight: true,
    };
  }

  init() {
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.level = 1;
    this.initLevel();
    if (this.onScoreChange) this.onScoreChange(0);
  }

  handleInput(keys: Set<string>) {
    if (this.gameOver || this.won) return;

    const speed = 4;
    const jumpForce = -10;
    const climbSpeed = 3;

    if (keys.has('ArrowLeft')) {
      this.player.vx = -speed;
      this.player.facingRight = false;
    } else if (keys.has('ArrowRight')) {
      this.player.vx = speed;
      this.player.facingRight = true;
    } else {
      this.player.vx = 0;
    }

    if (this.checkLadder()) {
      if (keys.has('ArrowUp')) {
        this.player.isClimbing = true;
        this.player.vy = -climbSpeed;
        this.player.x = this.getLadderCenter();
      } else if (keys.has('ArrowDown')) {
        this.player.isClimbing = true;
        this.player.vy = climbSpeed;
        this.player.x = this.getLadderCenter();
      } else if (this.player.isClimbing) {
        this.player.vy = 0;
      }
    } else {
      this.player.isClimbing = false;
    }

    if (keys.has(' ') && this.player.isGrounded && !this.player.isClimbing) {
      this.player.vy = jumpForce;
      this.player.isGrounded = false;
    }
  }

  update() {
    if (this.gameOver || this.won) return;

    const gravity = 0.5;
    this.player.x += this.player.vx;
    if (!this.player.isClimbing) this.player.vy += gravity;
    this.player.y += this.player.vy;

    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > this.width - this.player.w) this.player.x = this.width - this.player.w;

    // Platform collisions
    this.player.isGrounded = false;
    if (!this.player.isClimbing) {
      for (const plat of this.platforms) {
        if (
          this.player.vy >= 0 &&
          this.player.y + this.player.h <= plat.y + plat.h &&
          this.player.y + this.player.h + this.player.vy >= plat.y &&
          this.player.x + this.player.w > plat.x &&
          this.player.x < plat.x + plat.w
        ) {
          this.player.y = plat.y - this.player.h;
          this.player.vy = 0;
          this.player.isGrounded = true;
        }
      }
    }

    // Win condition
    const def = this.currentLevelDef!;
    const goalPlat = this.platforms[def.goalPlatIndex];
    if (goalPlat &&
      this.player.y + this.player.h <= goalPlat.y + 4 &&
      this.player.x + this.player.w > goalPlat.x + 5 &&
      this.player.x < goalPlat.x + goalPlat.w - 5 &&
      this.player.y + this.player.h > goalPlat.y - 30
    ) {
      this.won = true;
      this.score += 1000 + (this.level * 200);
      if (this.onScoreChange) this.onScoreChange(this.score);
      soundManager.playCollect();
      // Advance to next level after a short delay (handled by game loop)
      setTimeout(() => {
        if (!this.gameOver) {
          this.level++;
          this.won = false;
          this.initLevel();
        }
      }, 1500);
    }

    // Barrel spawning
    this.barrelTimer++;
    if (this.barrelTimer > this.barrelInterval) {
      this.spawnBarrel();
      this.barrelTimer = 0;
    }

    // Barrel update
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      b.vy += gravity;
      b.x += b.vx;
      b.y += b.vy;
      b.angle += b.vx * 0.08;

      let onPlat = false;
      for (const plat of this.platforms) {
        if (
          b.vy >= 0 &&
          b.y + b.r <= plat.y + plat.h &&
          b.y + b.r + b.vy >= plat.y &&
          b.x > plat.x &&
          b.x < plat.x + plat.w
        ) {
          b.y = plat.y - b.r;
          b.vy = -b.vy * 0.3; // small bounce
          if (Math.abs(b.vy) < 0.5) b.vy = 0;
          onPlat = true;
        }
      }
      if (onPlat && b.vx === 0) b.vx = (3 + this.level * 0.3) * (Math.random() > 0.5 ? 1 : -1);
      if (b.x < 0 || b.x > this.width) b.vx *= -1;
      if (b.y > this.height + 50) {
        this.barrels.splice(i, 1);
        this.score += 50;
        if (this.onScoreChange) this.onScoreChange(this.score);
        continue;
      }

      // Player collision
      const dx = (this.player.x + this.player.w / 2) - b.x;
      const dy = (this.player.y + this.player.h / 2) - b.y;
      if (Math.sqrt(dx * dx + dy * dy) < b.r + this.player.w / 2 - 2) {
        this.gameOver = true;
        soundManager.playGameOver();
        if (this.onGameOver) this.onGameOver();
      }
    }
  }

  spawnBarrel() {
    const def = this.currentLevelDef!;
    const speed = 2.5 + this.level * 0.4;
    this.barrels.push({
      x: def.barrelSpawnX,
      y: def.barrelSpawnY,
      r: 13,
      vx: speed,
      vy: 0,
      onGround: false,
      angle: 0,
    });
  }

  checkLadder(): boolean {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h;
    for (const lad of this.ladders) {
      if (px >= lad.x && px <= lad.x + lad.w && py >= lad.y && py <= lad.y + lad.h + 10) return true;
    }
    return false;
  }

  getLadderCenter(): number {
    const px = this.player.x + this.player.w / 2;
    let closest = this.ladders[0];
    let minDist = 9999;
    for (const lad of this.ladders) {
      const d = Math.abs((lad.x + lad.w / 2) - px);
      if (d < minDist) { minDist = d; closest = lad; }
    }
    return closest.x + closest.w / 2 - this.player.w / 2;
  }
}
