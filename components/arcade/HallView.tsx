'use client';

import Link from 'next/link';
import { GAMES } from '@/arcade/catalog';
import { medalFor, useArcadeStore } from '@/arcade/store';
import { streakOf } from '@/arcade/daily';
import { Medals, PixelIcon } from './bits';

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtDur = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);

export default function HallView() {
  const store = useArcadeStore();
  const runs = Object.values(store.plays).reduce((a, b) => a + b, 0);
  const secs = Object.values(store.seconds).reduce((a, b) => a + b, 0);
  const medals = [0, 0, 0];
  GAMES.forEach(g => { const m = medalFor(store.best[g.id] ?? 0, g.medals); for (let i = 0; i < m; i++) medals[i]++; });
  const played = GAMES.filter(g => (store.plays[g.id] ?? 0) > 0).length;
  const rows = [...GAMES].sort((a, b) => (store.plays[b.id] ?? 0) - (store.plays[a.id] ?? 0));

  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow">HALL OF FAME</div>
        <h1>{store.initials ? <>Welcome back, <span className="px gold">{store.initials}</span></> : 'Your hall of fame'}</h1>
        <p>Every score, medal and streak you earn is kept right here, on this device. No account needed.</p>
      </header>

      <section className="hall-stats">
        <div className="hs"><small>Runs</small><b className="tnum">{fmt(runs)}</b></div>
        <div className="hs"><small>Time played</small><b>{fmtDur(secs)}</b></div>
        <div className="hs"><small>Cabinets tried</small><b>{played}<span>/{GAMES.length}</span></b></div>
        <div className="hs"><small>Daily streak</small><b>{streakOf(store)}<span> days</span></b></div>
        <div className="hs medals-big">
          <small>Medals</small>
          <b><i className="medal on m3" /> {medals[2]} <i className="medal on m2" /> {medals[1]} <i className="medal on m1" /> {medals[0]}</b>
        </div>
      </section>

      <div className="card hall-table-wrap">
        <table className="hall-table">
          <thead>
            <tr><th>Cabinet</th><th>Best</th><th>Champion</th><th>Medals</th><th>Next medal</th><th>Plays</th></tr>
          </thead>
          <tbody>
            {rows.map(g => {
              const best = store.best[g.id] ?? 0;
              const m = medalFor(best, g.medals);
              const champ = store.tables[g.id]?.[0];
              return (
                <tr key={g.id} style={{ ['--c' as string]: g.color }}>
                  <td><Link href={`/play/${g.id}`} className="hall-game"><span className="ll-ico"><PixelIcon rows={g.icon} color={g.color} /></span>{g.title}</Link></td>
                  <td className="px tnum">{best ? fmt(best) : '—'}</td>
                  <td className="px">{champ ? champ.n : '---'}</td>
                  <td><Medals n={m} /></td>
                  <td className="dim tnum">{m < 3 ? fmt(g.medals[m as 0 | 1 | 2]) : 'Maxed'}</td>
                  <td className="dim tnum">{store.plays[g.id] ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
