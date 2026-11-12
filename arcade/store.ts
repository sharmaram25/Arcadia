// Local-first persistence: bests, initials tables, favourites, recents, daily streak.
// Exposed to React through useSyncExternalStore (see useArcadeStore).
import { useSyncExternalStore } from 'react';

export interface TableEntry { n: string; s: number; d: number }

export interface ArcadeData {
  v: 3;
  best: Record<string, number>;
  plays: Record<string, number>;
  seconds: Record<string, number>;
  tables: Record<string, TableEntry[]>;
  favs: string[];
  recent: string[];
  initials: string;
  daily: { streak: number; last: string; scores: Record<string, number> };
  crt: boolean;
}

const KEY = 'arcadia.v3';
const EMPTY: ArcadeData = {
  v: 3, best: {}, plays: {}, seconds: {}, tables: {}, favs: [], recent: [], initials: '',
  daily: { streak: 0, last: '', scores: {} }, crt: true,
};

let data: ArcadeData = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* private mode / corrupted: start fresh */ }
}

function commit(next: ArcadeData) {
  data = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota / blocked */ }
  subs.forEach(s => s());
}

export function getData() { load(); return data; }

export function useArcadeStore(): ArcadeData {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => getData(),
    () => EMPTY,
  );
}

// ── Dates (local time; the daily resets at the viewer's midnight) ──
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export interface RunResult { prevBest: number; isBest: boolean; rank: number; dailyBest?: boolean }

/** Records a finished run. rank is the 0-based top-5 slot it qualifies for, or -1. */
export function recordRun(id: string, score: number, seconds: number, daily: boolean): RunResult {
  const d = getData();
  const prevBest = d.best[id] ?? 0;
  const table = d.tables[id] ?? [];
  let rank = table.findIndex(e => score > e.s);
  if (rank === -1 && table.length < 5) rank = table.length;
  if (score <= 0) rank = -1;

  const next: ArcadeData = {
    ...d,
    best: { ...d.best, [id]: Math.max(prevBest, score) },
    plays: { ...d.plays, [id]: (d.plays[id] ?? 0) + 1 },
    seconds: { ...d.seconds, [id]: (d.seconds[id] ?? 0) + seconds },
  };
  let dailyBest: boolean | undefined;
  if (daily) {
    const today = dayKey();
    const y = new Date(); y.setDate(y.getDate() - 1);
    const streak = d.daily.last === today ? d.daily.streak : d.daily.last === dayKey(y) ? d.daily.streak + 1 : 1;
    const prev = d.daily.scores[today] ?? 0;
    dailyBest = score > prev;
    next.daily = { streak, last: today, scores: { ...d.daily.scores, [today]: Math.max(prev, score) } };
  }
  commit(next);
  return { prevBest, isBest: score > prevBest && score > 0, rank, dailyBest };
}

export function addToTable(id: string, initials: string, score: number) {
  const d = getData();
  const t = [...(d.tables[id] ?? []), { n: initials, s: score, d: Date.now() }]
    .sort((a, b) => b.s - a.s).slice(0, 5);
  commit({ ...d, tables: { ...d.tables, [id]: t }, initials });
}

export function touchRecent(id: string) {
  const d = getData();
  commit({ ...d, recent: [id, ...d.recent.filter(r => r !== id)].slice(0, 8) });
}

export function toggleFav(id: string) {
  const d = getData();
  commit({ ...d, favs: d.favs.includes(id) ? d.favs.filter(f => f !== id) : [...d.favs, id] });
}

export function setCrt(on: boolean) { commit({ ...getData(), crt: on }); }

export function medalFor(score: number, m: readonly [number, number, number]): 0 | 1 | 2 | 3 {
  return score >= m[2] ? 3 : score >= m[1] ? 2 : score >= m[0] ? 1 : 0;
}
