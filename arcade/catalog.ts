// Single source of truth for every cabinet in the arcade.
// Each game's code is a separate chunk loaded on demand via `load()`, so the
// landing page ships only this metadata (a few KB), not 29 games.
import type { GameModule } from './core/types';

export type Tag = 'action' | 'puzzle' | 'classic' | 'one-button' | 'mouse' | 'brain' | 'versus' | 'typing' | 'cards' | 'chill';
export type TouchLayout = 'dpad' | 'dpad-a' | 'lr-a' | 'lr' | 'a' | 'none';

export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  how: string;          // one-line instructions shown on the start card
  keys: [string, string][]; // [key, action] pairs for the controls strip
  color: string;
  tags: Tag[];
  w: number; h: number;
  touch: TouchLayout;
  /** Game reads letters (typing / word games): host shortcuts use Esc only. */
  textInput?: boolean;
  /** Approximate minutes for a typical run — powers the "Coffee break" filter. */
  mins: number;
  medals: [number, number, number];
  icon: string[]; // 8x8 pixel art, '#' = lit
  isNew?: boolean;
  load: () => Promise<GameModule>;
}

const P = (...rows: string[]) => rows;

export const GAMES: GameMeta[] = [
  {
    id: 'snake', title: 'Neon Snake', tagline: 'Eat. Grow. Don\'t bite yourself.',
    how: 'Steer into the food. Every bite speeds you up.',
    keys: [['Arrows', 'Steer']], color: '#4dff8a', tags: ['classic', 'action'],
    w: 600, h: 600, touch: 'dpad', mins: 2, medals: [100, 300, 600],
    icon: P('........', '.####...', '.#..#...', '.#..###.', '.#....#.', '.####.#.', '....#...', '..#.....'),
    load: () => import('./games/snake'),
  },
  {
    id: 'fuse', title: 'Fuse 2048', tagline: 'Slide, merge, reach 2048.',
    how: 'Slide every tile at once. Equal tiles fuse into one.',
    keys: [['Arrows', 'Slide'], ['Swipe', 'Slide']], color: '#ffd23f', tags: ['puzzle', 'brain', 'chill'],
    w: 480, h: 560, touch: 'none', mins: 6, medals: [2000, 8000, 20000], isNew: true,
    icon: P('###.###.', '#.#.#.#.', '###.###.', '........', '###.###.', '#.#.#.#.', '###.###.', '........'),
    load: () => import('./games/fuse'),
  },
  {
    id: 'glide', title: 'Neon Glide', tagline: 'One button. Infinite gates.',
    how: 'Tap to flap. Slip through the gaps.',
    keys: [['Space / Click', 'Flap']], color: '#5ef2ff', tags: ['one-button', 'action'],
    w: 480, h: 640, touch: 'a', mins: 1, medals: [10, 25, 50], isNew: true,
    icon: P('......##', '......##', '..##....', '.####...', '######..', '.####...', '......##', '......##'),
    load: () => import('./games/glide'),
  },
  {
    id: 'sweeper', title: 'Sweeper', tagline: 'The office classic, sharpened.',
    how: 'Click to reveal, right-click to flag. Numbers count adjacent mines. First click is always safe.',
    keys: [['Click', 'Reveal'], ['R-Click / X', 'Flag'], ['Arrows+Space', 'Keyboard']], color: '#a0a8c8', tags: ['puzzle', 'brain', 'mouse', 'classic'],
    w: 480, h: 520, touch: 'none', mins: 4, medals: [300, 600, 900], isNew: true,
    icon: P('...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....', '........'),
    load: () => import('./games/sweeper'),
  },
  {
    id: 'typestorm', title: 'Type Storm', tagline: 'Your typing speed is your weapon.',
    how: 'Words fall from the sky. Type them before they land.',
    keys: [['Type', 'Target & zap'], ['Backspace', 'Retarget']], color: '#ff4fa3', tags: ['typing', 'action'],
    w: 800, h: 500, touch: 'none', textInput: true, mins: 3, medals: [1500, 4000, 9000], isNew: true,
    icon: P('########', '#......#', '#.#.#..#', '#......#', '#.####.#', '#......#', '########', '........'),
    load: () => import('./games/typestorm'),
  },
  {
    id: 'solitaire', title: 'Solitaire', tagline: 'Klondike, the way you remember it.',
    how: 'Build down in alternating colours. Move all cards to the foundations. Double-click to auto-move.',
    keys: [['Drag', 'Move'], ['Dbl-click', 'Send home'], ['Click deck', 'Draw']], color: '#4dff8a', tags: ['cards', 'chill', 'mouse', 'classic'],
    w: 840, h: 620, touch: 'none', mins: 8, medals: [300, 600, 1000], isNew: true,
    icon: P('.#####..', '.#...#..', '.#.#.###', '.#...#.#', '.#####.#', '...#...#', '...#####', '........'),
    load: () => import('./games/solitaire'),
  },
  {
    id: 'asteroids', title: 'Asteroid Blaster', tagline: 'Vector rocks. Newtonian panic.',
    how: 'Rotate, thrust and shoot. Big rocks split into smaller rocks.',
    keys: [['←→', 'Rotate'], ['↑', 'Thrust'], ['Space', 'Fire']], color: '#a78bfa', tags: ['classic', 'action'],
    w: 800, h: 600, touch: 'dpad-a', mins: 4, medals: [3000, 8000, 15000],
    icon: P('...#....', '...#....', '..#.#...', '..#.#...', '.#...#..', '.#.#.#..', '##...##.', '........'),
    load: () => import('./games/asteroids'),
  },
  {
    id: 'dash', title: 'Pixel Dash', tagline: 'Run forever. Jump everything.',
    how: 'Jump the blocks, duck the drones. It only gets faster.',
    keys: [['Space / ↑', 'Jump'], ['↓', 'Duck']], color: '#ff8a3d', tags: ['one-button', 'action'],
    w: 800, h: 360, touch: 'dpad-a', mins: 2, medals: [500, 1500, 3000], isNew: true,
    icon: P('...##...', '...##...', '..####..', '.#.##.#.', '...##...', '..#..#..', '.#....#.', '########'),
    load: () => import('./games/dash'),
  },
  {
    id: 'hexspin', title: 'Hex Spin', tagline: 'The walls are closing in. Spin.',
    how: 'Rotate around the core and slip through the gaps in the incoming walls.',
    keys: [['←→', 'Rotate']], color: '#ff4757', tags: ['action'],
    w: 600, h: 600, touch: 'lr', mins: 1, medals: [20, 45, 90], isNew: true,
    icon: P('..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#..#.#', '#..##..#', '.#....#.', '..####..'),
    load: () => import('./games/hexspin'),
  },
  {
    id: 'skystack', title: 'Sky Stack', tagline: 'Drop it perfect. Build to the clouds.',
    how: 'Drop the sliding block on the tower. Overhang gets sliced off.',
    keys: [['Space / Click', 'Drop']], color: '#5ef2ff', tags: ['one-button', 'chill'],
    w: 480, h: 720, touch: 'a', mins: 2, medals: [15, 35, 60], isNew: true,
    icon: P('........', '..####..', '..####..', '.#####..', '.#####..', '..#####.', '..#####.', '########'),
    load: () => import('./games/skystack'),
  },
  {
    id: 'gemswap', title: 'Gem Swap', tagline: 'Match three. Chain reactions. 90 seconds.',
    how: 'Swap neighbouring gems to line up three or more. Cascades multiply.',
    keys: [['Click two', 'Swap'], ['Arrows+Space', 'Keyboard']], color: '#ff4fa3', tags: ['puzzle', 'mouse', 'chill'],
    w: 480, h: 540, touch: 'none', mins: 2, medals: [3000, 7000, 12000], isNew: true,
    icon: P('...##...', '..####..', '.######.', '########', '.######.', '..####..', '...##...', '........'),
    load: () => import('./games/gemswap'),
  },
  {
    id: 'shield', title: 'City Shield', tagline: 'Hold the line. Protect the cities.',
    how: 'Click to detonate interceptors in the sky. Save as many cities as you can.',
    keys: [['Click', 'Fire'], ['Arrows+Space', 'Keyboard']], color: '#ffd23f', tags: ['classic', 'mouse', 'action'],
    w: 800, h: 600, touch: 'none', mins: 4, medals: [3000, 9000, 20000], isNew: true,
    icon: P('#......#', '.#....#.', '..#..#..', '...##...', '...##...', '........', '#.##.##.', '########'),
    load: () => import('./games/shield'),
  },
  {
    id: 'echo', title: 'Echo', tagline: 'Watch. Remember. Repeat.',
    how: 'Repeat the growing sequence of lights. One slip and it\'s over.',
    keys: [['Arrows', 'Pads'], ['Click', 'Pads']], color: '#a78bfa', tags: ['brain', 'chill', 'mouse'],
    w: 480, h: 480, touch: 'dpad', mins: 2, medals: [8, 14, 20], isNew: true,
    icon: P('###..###', '###..###', '###..###', '........', '........', '###..###', '###..###', '###..###'),
    load: () => import('./games/echo'),
  },
  {
    id: 'lander', title: 'Lunar Drop', tagline: 'Gentle hands. Low fuel.',
    how: 'Rotate and burn to land softly on a pad. Smaller pads pay more.',
    keys: [['←→', 'Rotate'], ['↑ / Space', 'Thrust']], color: '#f2f4ff', tags: ['classic', 'action'],
    w: 800, h: 600, touch: 'dpad-a', mins: 3, medals: [1000, 3000, 6000], isNew: true,
    icon: P('...##...', '..####..', '..####..', '.######.', '.#....#.', '#......#', '........', '##.##.##'),
    load: () => import('./games/lander'),
  },
  {
    id: 'trails', title: 'Light Trails', tagline: 'Outlast three rival riders.',
    how: 'Your bike leaves a wall of light. Make the rivals crash first.',
    keys: [['Arrows', 'Turn']], color: '#5ef2ff', tags: ['versus', 'action'],
    w: 640, h: 480, touch: 'dpad', mins: 2, medals: [3, 6, 10], isNew: true,
    icon: P('########', '#.......', '#.####..', '#.#..#..', '#.#..###', '#.#.....', '#.######', '........'),
    load: () => import('./games/trails'),
  },
  {
    id: 'dodge', title: 'Bullet Waltz', tagline: 'Survive the pattern storm.',
    how: 'Weave through the bullet patterns. Graze bullets for bonus points.',
    keys: [['Arrows', 'Move'], ['Shift / X', 'Focus (slow)']], color: '#ff4fa3', tags: ['action'],
    w: 600, h: 600, touch: 'dpad-a', mins: 2, medals: [1500, 4000, 8000], isNew: true,
    icon: P('#..#..#.', '........', '.#..#..#', '........', '#..##..#', '...##...', '.#....#.', '........'),
    load: () => import('./games/dodge'),
  },
  {
    id: 'reflex', title: 'Reflex', tagline: 'How fast are your hands, really?',
    how: 'Click the targets before they shrink away. 30 seconds. Streaks multiply.',
    keys: [['Click', 'Hit']], color: '#ff4757', tags: ['mouse', 'action'],
    w: 800, h: 500, touch: 'none', mins: 1, medals: [3000, 6000, 10000], isNew: true,
    icon: P('..####..', '.#....#.', '#..##..#', '#.####.#', '#.####.#', '#..##..#', '.#....#.', '..####..'),
    load: () => import('./games/reflex'),
  },
  {
    id: 'lexicon', title: 'Lexicon', tagline: 'Six tries. Five letters. One word.',
    how: 'Guess the word. Green = right spot, yellow = wrong spot.',
    keys: [['Type', 'Letters'], ['Enter', 'Guess']], color: '#4dff8a', tags: ['brain', 'typing', 'chill'],
    w: 480, h: 620, touch: 'none', textInput: true, mins: 3, medals: [400, 700, 900], isNew: true,
    icon: P('##.##.##', '##.##.##', '........', '##.##.##', '##.##.##', '........', '##.##.##', '##.##.##'),
    load: () => import('./games/lexicon'),
  },
  {
    id: 'fourup', title: 'Four Up', tagline: 'Drop four in a row. Beat the bot.',
    how: 'Drop discs into columns. First to line up four wins. The bot learns no mercy.',
    keys: [['←→', 'Aim'], ['Space / Click', 'Drop']], color: '#ffd23f', tags: ['versus', 'brain', 'chill'],
    w: 560, h: 600, touch: 'lr-a', mins: 3, medals: [1, 3, 6], isNew: true,
    icon: P('........', '#......#', '#......#', '#.....##', '#..#.#.#', '#.##.#.#', '########', '........'),
    load: () => import('./games/fourup'),
  },
  // ── Original v2 cabinets, now running on the unified runtime ──
  {
    id: 'stackpanic', title: 'Stack Panic', tagline: 'Falling blocks. Clear the lines.',
    how: 'Rotate and place the falling pieces. Full lines vanish.',
    keys: [['←→', 'Move'], ['↑', 'Rotate'], ['↓', 'Soft drop'], ['Space', 'Hard drop']], color: '#5ef2ff', tags: ['classic', 'puzzle'],
    w: 400, h: 600, touch: 'dpad-a', mins: 5, medals: [1000, 3000, 6000],
    icon: P('........', '...#....', '..###...', '........', '#.....##', '##...###', '###.####', '########'),
    load: () => import('./legacy/stackpanic'),
  },
  {
    id: 'prismbreak', title: 'Prism Break', tagline: 'Paddle, ball, a wall of neon.',
    how: 'Keep the ball alive and shatter every brick.',
    keys: [['←→', 'Move']], color: '#ff4fa3', tags: ['classic', 'action'],
    w: 600, h: 600, touch: 'lr', mins: 3, medals: [500, 1500, 3000],
    icon: P('########', '########', '##.#####', '........', '....#...', '........', '........', '..####..'),
    load: () => import('./legacy/prismbreak'),
  },
  {
    id: 'voidchomp', title: 'Void Chomp', tagline: 'Eat the dots. Dodge the drones.',
    how: 'Clear the maze of dots while the drones hunt you down.',
    keys: [['Arrows', 'Move']], color: '#ffd23f', tags: ['classic', 'action'],
    w: 600, h: 500, touch: 'dpad', mins: 3, medals: [500, 1500, 3000],
    icon: P('..####..', '.######.', '####....', '###.....', '####....', '.######.', '..####..', '........'),
    load: () => import('./legacy/voidchomp'),
  },
  {
    id: 'defender', title: 'Star Defender', tagline: 'Hold back the invading waves.',
    how: 'Slide and shoot. Don\'t let the formation reach you.',
    keys: [['←→', 'Move'], ['Space', 'Shoot']], color: '#ff4757', tags: ['classic', 'action'],
    w: 600, h: 800, touch: 'lr-a', mins: 4, medals: [500, 1000, 2000],
    icon: P('..#..#..', '...##...', '..####..', '.##..##.', '########', '#.#..#.#', '........', '...##...'),
    load: () => import('./legacy/defender'),
  },
  {
    id: 'bounceblitz', title: 'Bounce Blitz', tagline: 'Paddle duel against the machine.',
    how: 'First to 10 wins. Hit with the paddle edge to angle shots.',
    keys: [['←→', 'Move']], color: '#a78bfa', tags: ['versus', 'classic'],
    w: 600, h: 600, touch: 'lr', mins: 3, medals: [3, 6, 10],
    icon: P('..###...', '........', '........', '....#...', '........', '........', '........', '...###..'),
    load: () => import('./legacy/bounceblitz'),
  },
  {
    id: 'river', title: 'River Dash', tagline: 'Cross the road. Ride the logs.',
    how: 'Hop across traffic and float on logs to reach the far bank.',
    keys: [['Arrows', 'Hop']], color: '#ff4fa3', tags: ['classic', 'action'],
    w: 600, h: 600, touch: 'dpad', mins: 3, medals: [50, 100, 200],
    icon: P('........', '###..###', '........', '...##...', '...##...', '........', '.##...##', '........'),
    load: () => import('./legacy/river'),
  },
  {
    id: 'tower', title: 'Tower Escape', tagline: 'Climb. Jump the rolling hazards.',
    how: 'Climb ladders and leap over hazards to reach the top.',
    keys: [['←→', 'Move'], ['↑↓', 'Climb'], ['Space', 'Jump']], color: '#4dff8a', tags: ['classic', 'action'],
    w: 600, h: 800, touch: 'dpad-a', mins: 4, medals: [50, 100, 200],
    icon: P('#####...', '....#...', '.####...', '.#.....#', '.#######', '......#.', '..#####.', '..#.....'),
    load: () => import('./legacy/tower'),
  },
  {
    id: 'maze', title: 'Maze Runner', tagline: 'Collect every orb. Evade sentinels.',
    how: 'Clear the maze of orbs while sentinels patrol.',
    keys: [['Arrows', 'Move']], color: '#ffd23f', tags: ['classic', 'puzzle'],
    w: 600, h: 600, touch: 'dpad', mins: 3, medals: [50, 100, 150],
    icon: P('########', '#......#', '#.####.#', '#.#..#.#', '#.#.##.#', '#.#....#', '#.######', '#.......'),
    load: () => import('./legacy/maze'),
  },
  {
    id: 'swarm', title: 'Neon Swarm', tagline: 'The swarm descends. Shoot it apart.',
    how: 'Blast the descending swarm segment by segment.',
    keys: [['←→', 'Move'], ['Space', 'Shoot']], color: '#4dff8a', tags: ['classic', 'action'],
    w: 800, h: 600, touch: 'lr-a', mins: 4, medals: [1000, 2500, 5000],
    icon: P('.##.##..', '........', '..##.##.', '........', '.#...#..', '........', '........', '...##...'),
    load: () => import('./legacy/swarm'),
  },
  {
    id: 'horizon', title: 'Horizon Defender', tagline: 'Fly the alien horizon.',
    how: 'Fly, fire, survive the onslaught.',
    keys: [['Arrows', 'Fly'], ['Space', 'Fire']], color: '#5ef2ff', tags: ['action'],
    w: 800, h: 600, touch: 'dpad-a', mins: 4, medals: [1000, 2500, 5000],
    icon: P('........', '##......', '####....', '#######.', '####....', '##......', '........', '##.##.##'),
    load: () => import('./legacy/horizon'),
  },
];

export const GAME_BY_ID: Record<string, GameMeta> = Object.fromEntries(GAMES.map(g => [g.id, g]));

export const TAG_LABEL: Record<Tag, string> = {
  action: 'Action', puzzle: 'Puzzle', classic: 'Classics', 'one-button': 'One button', mouse: 'Mouse only',
  brain: 'Brain', versus: 'Vs CPU', typing: 'Typing', cards: 'Cards', chill: 'Chill',
};

/** Games eligible for the daily challenge: skill-based and deterministic under a seed. */
const DAILY_POOL = ['snake', 'glide', 'dash', 'hexspin', 'skystack', 'gemswap', 'typestorm', 'fuse', 'reflex', 'dodge', 'shield', 'asteroids', 'lander', 'echo'];
export function dailyGameId(seed: number) { return DAILY_POOL[seed % DAILY_POOL.length]; }
