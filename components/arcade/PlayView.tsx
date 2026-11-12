'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES, GAME_BY_ID, TAG_LABEL } from '@/arcade/catalog';
import { medalFor, useArcadeStore } from '@/arcade/store';
import { streakOf, today } from '@/arcade/daily';
import Stage from './Stage';
import Poster from './Poster';
import GameCard from './GameCard';
import { toast } from './Shell';
import { Kc, Medals } from './bits';

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtDur = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : `${(s / 3600).toFixed(1)}h`);

export function HighScores({ id }: { id: string }) {
  const store = useArcadeStore();
  const meta = GAME_BY_ID[id];
  const table = store.tables[id] ?? [];
  return (
    <div className="card card-pad">
      <div className="sec-h">HIGH SCORES <span className="rule" /><Medals n={medalFor(store.best[id] ?? 0, meta.medals)} /></div>
      <table className="hof">
        <tbody>
          {[0, 1, 2, 3, 4].map(i => {
            const e = table[i];
            const rk = ['1ST', '2ND', '3RD', '4TH', '5TH'][i];
            return e
              ? <tr key={i}><td className="rk">{rk}</td><td className="n">{e.n}</td><td className="s tnum">{fmt(e.s)}</td></tr>
              : <tr key={i} className="empty"><td className="rk">{rk}</td><td className="n">---</td><td className="s">000000</td></tr>;
          })}
        </tbody>
      </table>
      <div className="stats3">
        <div><small>Best</small><span className="tnum">{fmt(store.best[id] ?? 0)}</span></div>
        <div><small>Plays</small><span className="tnum">{store.plays[id] ?? 0}</span></div>
        <div><small>Played</small><span className="tnum">{fmtDur(store.seconds[id] ?? 0)}</span></div>
      </div>
      <p className="medal-note">Medals at {fmt(meta.medals[0])} · {fmt(meta.medals[1])} · {fmt(meta.medals[2])}</p>
    </div>
  );
}

export default function PlayView({ id }: { id: string }) {
  const router = useRouter();
  const store = useArcadeStore();
  const [mounted, setMounted] = useState(false);
  const [seed, setSeed] = useState(1);
  const d = today();
  const daily = id === 'daily';
  const meta = GAME_BY_ID[daily ? d.id : id] ?? GAMES[0];

  useEffect(() => { setMounted(true); setSeed(Math.floor(Math.random() * 2 ** 31)); }, [id]);

  const related = useMemo(() => {
    const t = new Set(meta.tags);
    return GAMES.filter(g => g.id !== meta.id)
      .map(g => ({ g, s: g.tags.filter(x => t.has(x)).length + (g.isNew ? 0.1 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 5).map(x => x.g);
  }, [meta]);

  const next = () => {
    const i = GAMES.findIndex(g => g.id === meta.id);
    router.push(`/play/${GAMES[(i + 1) % GAMES.length].id}`);
  };

  const streak = streakOf(store);

  return (
    <div className="page" style={{ ['--c' as string]: meta.color }}>
      <div className="crumbs">
        <Link href="/games">Games</Link><span>/</span>
        <span>{daily ? `Daily #${d.no}` : meta.title}</span>
      </div>
      <section className="floor">
        <div>
          {mounted && (
            <Stage
              key={`${meta.id}:${daily}:${daily ? d.seed : seed}`}
              meta={meta} daily={daily} seed={daily ? d.seed : seed} dailyNo={d.no} crt={store.crt}
              onNext={next} onToast={toast}
            />
          )}
        </div>
        <aside className="rail">
          <div className="card rail-info">
            <Poster id={meta.id} title={meta.title} className="rail-poster" eager />
            <div className="card-pad">
              {daily && <div className="daily-k">DAILY CHALLENGE #{d.no} · {streak} DAY STREAK</div>}
              <h1 className="rail-h">{meta.title}</h1>
              <p className="tagline">{meta.how}</p>
              <div className="chips-s">
                {meta.tags.slice(0, 3).map(t => <span key={t} className="chip-s">{TAG_LABEL[t]}</span>)}
                <span className="chip-s">~{meta.mins} min</span>
              </div>
              <div className="keys">
                {meta.keys.map(([k, a]) => <div key={k}><span>{a}</span><Kc>{k}</Kc></div>)}
                <div><span>Pause</span><Kc>{meta.textInput ? 'Esc' : 'P'}</Kc></div>
              </div>
            </div>
          </div>
          <HighScores id={meta.id} />
        </aside>
      </section>

      <section className="row">
        <div className="row-h">
          <h2>More like {meta.title}</h2>
          <Link href="/games" className="link-more">All games →</Link>
        </div>
        <div className="poster-row">
          {related.map(g => <GameCard key={g.id} g={g} size="sm" />)}
        </div>
      </section>
    </div>
  );
}
