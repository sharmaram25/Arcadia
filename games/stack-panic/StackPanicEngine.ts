import { DifficultyManager } from '../../engine/DifficultyManager';
import { soundManager } from '../../engine/SoundManager';

const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const CELL = 26;

type TetrominoShape = number[][];

const TETROMINOES: { shape: TetrominoShape; color: string }[] = [
  { shape: [[1,1,1,1]],                             color: '#6EE7FF' }, // I
  { shape: [[1,1],[1,1]],                            color: '#FACC15' }, // O
  { shape: [[0,1,0],[1,1,1]],                        color: '#A78BFA' }, // T
  { shape: [[1,0,0],[1,1,1]],                        color: '#FF7744' }, // J
  { shape: [[0,0,1],[1,1,1]],                        color: '#22C55E' }, // L
  { shape: [[0,1,1],[1,1,0]],                        color: '#FF4466' }, // S
  { shape: [[1,1,0],[0,1,1]],                        color: '#EC4899' }, // Z
];

function rotate(shape: TetrominoShape): TetrominoShape {
  const rows = shape.length, cols = shape[0].length;
  const result: TetrominoShape = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

interface ActivePiece { shape: TetrominoShape; color: string; col: number; row: number; }

export class StackPanicEngine {
  width: number; height: number;
  board: (string | null)[][] = [];
  active: ActivePiece | null = null;
  nextPiece: { shape: TetrominoShape; color: string } | null = null;
  score = 0; lines = 0; level = 1;
  isGameOver = false;
  private difficulty: DifficultyManager;
  private fallTimer = 0;
  private lockTimer = 0;
  private isLocking = false;
  private keyRepeat = new Map<string, number>();
  onScoreChange?: (s: number) => void;
  onGameOver?: () => void;

  readonly boardX: number; readonly boardY: number;

  constructor(w: number, h: number) {
    this.width = w; this.height = h;
    this.difficulty = new DifficultyManager();
    this.boardX = (w - BOARD_COLS * CELL) / 2;
    this.boardY = 40;
    this.resetBoard();
    this.nextPiece = this.randomPiece();
    this.spawnPiece();
  }

  private resetBoard() {
    this.board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
  }

  private randomPiece() {
    return { ...TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)] };
  }

  private spawnPiece() {
    const p = this.nextPiece!;
    this.nextPiece = this.randomPiece();
    this.active = {
      shape: p.shape, color: p.color,
      col: Math.floor(BOARD_COLS / 2) - Math.floor(p.shape[0].length / 2),
      row: 0,
    };
    if (!this.isValid(this.active.shape, this.active.row, this.active.col)) {
      this.isGameOver = true;
      soundManager.play('gameover');
      this.onGameOver?.();
    }
  }

  private isValid(shape: TetrominoShape, row: number, col: number): boolean {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          const br = row + r, bc = col + c;
          if (br < 0 || br >= BOARD_ROWS || bc < 0 || bc >= BOARD_COLS) return false;
          if (this.board[br][bc]) return false;
        }
    return true;
  }

  private lock() {
    const a = this.active!;
    for (let r = 0; r < a.shape.length; r++)
      for (let c = 0; c < a.shape[r].length; c++)
        if (a.shape[r][c])
          this.board[a.row + r][a.col + c] = a.color;
    this.clearLines();
    this.spawnPiece();
    this.isLocking = false; this.lockTimer = 0;
    soundManager.play('click');
  }

  private clearLines() {
    let cleared = 0;
    for (let r = BOARD_ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== null)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(BOARD_COLS).fill(null));
        cleared++; r++;
      }
    }
    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800][Math.min(cleared, 4)] * this.level;
      this.score += pts;
      this.lines += cleared;
      this.level = Math.floor(this.lines / 10) + 1;
      this.onScoreChange?.(this.score);
      soundManager.play(cleared >= 4 ? 'achievement' : 'coin');
    }
  }

  handleInput(keys: Set<string>) {
    if (!this.active || this.isGameOver) return;
    const repeat = (key: string, delay: number) => {
      const t = this.keyRepeat.get(key) ?? 0;
      if (keys.has(key)) {
        if (t === 0 || t > delay) { this.keyRepeat.set(key, 1); return true; }
        this.keyRepeat.set(key, t + 1);
      } else { this.keyRepeat.delete(key); }
      return false;
    };
    if (repeat('ArrowLeft', 8) && this.isValid(this.active.shape, this.active.row, this.active.col - 1)) {
      this.active.col--;
    }
    if (repeat('ArrowRight', 8) && this.isValid(this.active.shape, this.active.row, this.active.col + 1)) {
      this.active.col++;
    }
    if (repeat('ArrowDown', 2)) {
      if (this.isValid(this.active.shape, this.active.row + 1, this.active.col)) {
        this.active.row++;
        this.score += 1;
        this.onScoreChange?.(this.score);
      }
    }
  }

  handleKeyDown(key: string) {
    if (!this.active || this.isGameOver) return;
    if (key === 'ArrowUp') {
      const rotated = rotate(this.active.shape);
      if (this.isValid(rotated, this.active.row, this.active.col)) {
        this.active.shape = rotated; soundManager.play('click');
      } else if (this.isValid(rotated, this.active.row, this.active.col - 1)) {
        this.active.shape = rotated; this.active.col--;
      } else if (this.isValid(rotated, this.active.row, this.active.col + 1)) {
        this.active.shape = rotated; this.active.col++;
      }
    }
    if (key === ' ') {
      while (this.active && this.isValid(this.active.shape, this.active.row + 1, this.active.col))
        this.active.row++;
      if (this.active) this.lock();
    }
  }

  update(dt: number) {
    if (this.isGameOver || !this.active) return;
    const speedMult = this.difficulty.getSpeedMultiplier(this.score);
    const fallInterval = Math.max(0.05, (0.8 - (this.level - 1) * 0.07)) / speedMult;
    this.fallTimer += dt;
    if (this.fallTimer >= fallInterval) {
      this.fallTimer = 0;
      if (this.isValid(this.active.shape, this.active.row + 1, this.active.col)) {
        this.active.row++;
        this.isLocking = false; this.lockTimer = 0;
      } else {
        this.isLocking = true;
        this.lockTimer += fallInterval;
        if (this.lockTimer >= 0.5) this.lock();
      }
    }
  }

  private ghostRow(): number {
    if (!this.active) return 0;
    let row = this.active.row;
    while (this.isValid(this.active.shape, row + 1, this.active.col)) row++;
    return row;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, this.width, this.height);

    const bx = this.boardX, by = this.boardY;

    // Board border
    ctx.strokeStyle = 'rgba(110,231,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 2, by - 2, BOARD_COLS * CELL + 4, BOARD_ROWS * CELL + 4);

    // Grid lines
    ctx.strokeStyle = 'rgba(110,231,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= BOARD_COLS; c++) { ctx.beginPath(); ctx.moveTo(bx + c * CELL, by); ctx.lineTo(bx + c * CELL, by + BOARD_ROWS * CELL); ctx.stroke(); }
    for (let r = 0; r <= BOARD_ROWS; r++) { ctx.beginPath(); ctx.moveTo(bx, by + r * CELL); ctx.lineTo(bx + BOARD_COLS * CELL, by + r * CELL); ctx.stroke(); }

    // Locked cells
    for (let r = 0; r < BOARD_ROWS; r++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (this.board[r][c]) {
          ctx.save();
          ctx.fillStyle = this.board[r][c]! + '33';
          ctx.strokeStyle = this.board[r][c]!;
          ctx.shadowColor = this.board[r][c]!; ctx.shadowBlur = 6;
          ctx.lineWidth = 1.5;
          ctx.fillRect(bx + c * CELL + 1, by + r * CELL + 1, CELL - 2, CELL - 2);
          ctx.strokeRect(bx + c * CELL + 1.5, by + r * CELL + 1.5, CELL - 3, CELL - 3);
          ctx.restore();
        }

    // Ghost piece
    if (this.active) {
      const gr = this.ghostRow();
      for (let r = 0; r < this.active.shape.length; r++)
        for (let c = 0; c < this.active.shape[r].length; c++)
          if (this.active.shape[r][c]) {
            ctx.strokeStyle = this.active.color + '40';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + (this.active.col + c) * CELL + 1, by + (gr + r) * CELL + 1, CELL - 2, CELL - 2);
          }

      // Active piece
      for (let r = 0; r < this.active.shape.length; r++)
        for (let c = 0; c < this.active.shape[r].length; c++)
          if (this.active.shape[r][c]) {
            ctx.save();
            ctx.fillStyle = this.active.color + '55';
            ctx.strokeStyle = this.active.color;
            ctx.shadowColor = this.active.color; ctx.shadowBlur = 12;
            ctx.lineWidth = 2;
            ctx.fillRect(bx + (this.active.col + c) * CELL + 1, by + (this.active.row + r) * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeRect(bx + (this.active.col + c) * CELL + 1.5, by + (this.active.row + r) * CELL + 1.5, CELL - 3, CELL - 3);
            ctx.restore();
          }
    }

    // Side panel — next piece preview + stats
    const pnx = bx + BOARD_COLS * CELL + 20;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT', pnx, by + 16);
    if (this.nextPiece) {
      for (let r = 0; r < this.nextPiece.shape.length; r++)
        for (let c = 0; c < this.nextPiece.shape[r].length; c++)
          if (this.nextPiece.shape[r][c]) {
            ctx.save();
            ctx.fillStyle = this.nextPiece.color + '55';
            ctx.strokeStyle = this.nextPiece.color;
            ctx.shadowColor = this.nextPiece.color; ctx.shadowBlur = 8;
            ctx.lineWidth = 1.5;
            ctx.fillRect(pnx + c * 22, by + 24 + r * 22, 20, 20);
            ctx.strokeRect(pnx + c * 22 + 1, by + 24 + r * 22 + 1, 18, 18);
            ctx.restore();
          }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px monospace';
    ctx.fillText(`SCORE`, pnx, by + 120);
    ctx.fillStyle = '#6EE7FF'; ctx.font = 'bold 16px monospace';
    ctx.fillText(`${this.score}`, pnx, by + 140);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px monospace';
    ctx.fillText(`LINES`, pnx, by + 165);
    ctx.fillStyle = '#FACC15'; ctx.font = 'bold 16px monospace';
    ctx.fillText(`${this.lines}`, pnx, by + 185);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px monospace';
    ctx.fillText(`LEVEL`, pnx, by + 210);
    ctx.fillStyle = '#A78BFA'; ctx.font = 'bold 16px monospace';
    ctx.fillText(`${this.level}`, pnx, by + 230);

    // Controls hint
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('← → MOVE  ↑ ROTATE  ↓ SOFT DROP  SPACE HARD DROP', this.width / 2, this.height - 10);
  }
}
