// Single source of truth for all game metadata used across the app.
// Icons chosen to reflect the actual game mechanic, not generic UI icons.

import {
  Waves,         // Snake — sinuous wave = snake body
  Rocket,        // Asteroid Blaster — ship
  Grid3x3,       // Maze Runner — grid of cells
  Crosshair,     // Star Defender — targeting reticle
  ArrowUp,       // Tower Escape — climbing up
  Fish,          // River Dash — river-crossing creature
  Bug,           // Neon Swarm — insect swarm
  Plane,         // Horizon Defender — aircraft
  Layers,        // Prism Break — brick layers
  Circle,        // Void Chomp — round chomper
  LayoutGrid,    // Stack Panic — grid of blocks
  Dumbbell       // Bounce Blitz — two paddles look like a dumbbell
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface GameMeta {
  id: string;
  title: string;
  description: string;   // short tagline (used on landing page cards)
  fullDesc: string;       // longer description (used on arcade page cards)
  genre: string;
  controls: string;
  color: string;
  icon: LucideIcon;
}

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'snake',
    title: 'Neon Snake',
    description: 'Grid logic, reactive audio, particle trails.',
    fullDesc: 'A glowing modern take on the classic snake game. Eat food, grow longer, and avoid the walls.',
    genre: 'GRID',
    controls: 'KEYBOARD',
    color: '#6EE7FF',
    icon: Waves,
  },
  {
    id: 'asteroids',
    title: 'Asteroid Blaster',
    description: 'Newtonian physics. Polygon collision. Weapon heat.',
    fullDesc: 'Pilot your ship through a field of asteroids. Blast them before they crash into you.',
    genre: 'PHYSICS',
    controls: 'KEYBOARD',
    color: '#A78BFA',
    icon: Rocket,
  },
  {
    id: 'maze',
    title: 'Maze Runner',
    description: 'Procedural generation. Time pressure. Orb collection.',
    fullDesc: 'Navigate the neon maze, collect energy orbs, and avoid the patrolling sentinels.',
    genre: 'PUZZLE',
    controls: 'KEYBOARD',
    color: '#FACC15',
    icon: Grid3x3,
  },
  {
    id: 'defender',
    title: 'Star Defender',
    description: 'Wave-based shooter. Dynamic difficulty AI.',
    fullDesc: 'Defend the galaxy against waves of alien invaders in this classic space shooter.',
    genre: 'SHOOTER',
    controls: 'KEYBOARD',
    color: '#FF4444',
    icon: Crosshair,
  },
  {
    id: 'tower',
    title: 'Tower Escape',
    description: 'Vertical platforming. Rolling hazards. Rising floor.',
    fullDesc: 'Climb the neon tower, jump over rolling hazards, and reach the top platform.',
    genre: 'PLATFORMER',
    controls: 'KEYBOARD',
    color: '#22C55E',
    icon: ArrowUp,
  },
  {
    id: 'river',
    title: 'River Dash',
    description: 'Momentum-based hops. Dynamic obstacles. No friction.',
    fullDesc: 'Cross the cyber-highway and neon river. Hop between logs and avoid traffic.',
    genre: 'REFLEX',
    controls: 'KEYBOARD',
    color: '#EC4899',
    icon: Fish,
  },
  {
    id: 'swarm',
    title: 'Neon Swarm',
    description: 'Flocking AI. Overwhelming numbers. Split-second windows.',
    fullDesc: 'Defend against the descending neon swarm. Destroy segments and avoid obstacles.',
    genre: 'SURVIVAL',
    controls: 'KEYBOARD',
    color: '#4ADE80',
    icon: Bug,
  },
  {
    id: 'horizon',
    title: 'Horizon Defender',
    description: 'Lateral shoot-em-up. Enemy ships. Sustained fire.',
    fullDesc: 'Fly across the alien horizon, destroy enemy ships, and survive the onslaught.',
    genre: 'SHOOTER',
    controls: 'KEYBOARD',
    color: '#22D3EE',
    icon: Plane,
  },
  {
    id: 'prismbreak',
    title: 'Prism Break',
    description: 'Paddle reflection. Colored bricks. Angle control.',
    fullDesc: 'Shatter the neon brick wall with your paddle and glowing ball. Every level grows harder.',
    genre: 'ARCADE',
    controls: 'KEYBOARD',
    color: '#F472B6',
    icon: Layers,
  },
  {
    id: 'voidchomp',
    title: 'Void Chomp',
    description: 'Dot collection. Drone evasion. Grid navigation.',
    fullDesc: 'Navigate the grid, devour neon dots, and evade the seeking drones in this classic chase.',
    genre: 'MAZE',
    controls: 'KEYBOARD',
    color: '#FACC15',
    icon: Circle,
  },
  {
    id: 'stackpanic',
    title: 'Stack Panic',
    description: 'Falling blocks. Line clears. Ghost previews.',
    fullDesc: 'Rotate and place falling tetromino blocks. Clear lines to score points and survive the rising speed.',
    genre: 'PUZZLE',
    controls: 'KEYBOARD',
    color: '#6EE7FF',
    icon: LayoutGrid,
  },
  {
    id: 'bounceblitz',
    title: 'Bounce Blitz',
    description: '1v1 Paddle duel. Smart AI. Accelerating ball.',
    fullDesc: 'Face off against the AI in a high-speed paddle bouncing duel. First to 10 points wins the match.',
    genre: 'SPORTS',
    controls: 'KEYBOARD',
    color: '#A78BFA',
    icon: Dumbbell,
  },
];
