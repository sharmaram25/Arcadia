export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  timestamp?: number;
  gameId?: string; // Optional: associate with a specific game
}

export interface HighScore {
  gameId: string;
  score: number;
  timestamp: number;
}

export interface PlayerProfile {
  name: string;
  gamesPlayed: number;
  totalScore: number;
  playTime: number; // in seconds
  favoriteGame: string;
  highScores: Record<string, number>;
  playCounts: Record<string, number>; // Track plays per game
  achievements: string[]; // List of unlocked achievement IDs
  medals: Record<string, MedalType[]>; // gameId -> list of medals
}

export type MedalType = 'bronze' | 'silver' | 'gold';

export interface GameStats {
  gameId: string;
  bestScore: number;
  gamesPlayed: number;
  playTime: number;
}

export const MEDAL_THRESHOLDS: Record<string, { bronze: number; silver: number; gold: number }> = {
  snake: { bronze: 50, silver: 100, gold: 200 },
  asteroids: { bronze: 1000, silver: 2500, gold: 5000 },
  maze: { bronze: 50, silver: 100, gold: 150 },
  defender: { bronze: 500, silver: 1000, gold: 2000 },
  tower: { bronze: 50, silver: 100, gold: 200 },
  river: { bronze: 50, silver: 100, gold: 200 },
  swarm: { bronze: 1000, silver: 2500, gold: 5000 },
  horizon: { bronze: 1000, silver: 2500, gold: 5000 },
  prismbreak: { bronze: 500, silver: 1500, gold: 3000 },
  voidchomp: { bronze: 500, silver: 1500, gold: 3000 },
  stackpanic: { bronze: 1000, silver: 3000, gold: 6000 },
  bounceblitz: { bronze: 3, silver: 6, gold: 10 },
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_play', title: 'First Play', description: 'Play any game for the first time', unlocked: false },
  { id: 'snake_master', title: 'Snake Master', description: 'Score 200+ in Neon Snake', unlocked: false, gameId: 'snake' },
  { id: 'asteroid_hunter', title: 'Asteroid Hunter', description: 'Score 5000+ in Asteroid Blaster', unlocked: false, gameId: 'asteroids' },
  { id: 'arcade_explorer', title: 'Arcade Explorer', description: 'Play all available games', unlocked: false },
  { id: 'untouchable', title: 'Untouchable', description: 'Score 5000+ in Horizon Defender', unlocked: false, gameId: 'horizon' },
  { id: 'maze_runner', title: 'Maze Runner', description: 'Score 150+ in Maze Runner', unlocked: false, gameId: 'maze' },
  { id: 'star_defender', title: 'Star Defender', description: 'Score 2000+ in Star Defender', unlocked: false, gameId: 'defender' },
  { id: 'tower_climber', title: 'Tower Climber', description: 'Score 200+ in Tower Escape', unlocked: false, gameId: 'tower' },
  { id: 'river_crosser', title: 'River Crosser', description: 'Score 200+ in River Dash', unlocked: false, gameId: 'river' },
  { id: 'swarm_survivor', title: 'Swarm Survivor', description: 'Score 5000+ in Neon Swarm', unlocked: false, gameId: 'swarm' },
  { id: 'prism_breaker', title: 'Prism Breaker', description: 'Score 2500+ in Prism Break', unlocked: false, gameId: 'prismbreak' },
  { id: 'pac_master', title: 'Void Master', description: 'Score 2500+ in Void Chomp', unlocked: false, gameId: 'voidchomp' },
  { id: 'tetris_god', title: 'Stack God', description: 'Score 5000+ in Stack Panic', unlocked: false, gameId: 'stackpanic' },
  { id: 'pong_champ', title: 'Bounce Champ', description: 'Beat the AI in Bounce Blitz', unlocked: false, gameId: 'bounceblitz' },
];
