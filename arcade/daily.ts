import { dailyGameId } from './catalog';
import { dayKey, hashStr, type ArcadeData } from './store';

const EPOCH = new Date(2026, 0, 1).getTime();

/** Today's shared challenge: same cabinet + seed for every player on a given local date. */
export function today() {
  const key = dayKey();
  const seed = hashStr('arcadia:' + key);
  const no = Math.floor((new Date().setHours(0, 0, 0, 0) - EPOCH) / 86400000) + 1;
  return { key, seed, no, id: dailyGameId(seed) };
}

export function streakOf(d: ArcadeData) {
  const t = dayKey();
  const y = dayKey(new Date(Date.now() - 86400000));
  return d.daily.last === t || d.daily.last === y ? d.daily.streak : 0;
}
