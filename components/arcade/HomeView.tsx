'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES, GAME_BY_ID } from '@/arcade/catalog';
import { useArcadeStore } from '@/arcade/store';
import { streakOf, today } from '@/arcade/daily';
import Stage from './Stage';
import Poster from './Poster';
import GameCard from './GameCard';
import { toast } from './Shell';
import { Kc, PixelIcon } from './bits';

const fmt = (n: number) => n.toLocaleString('en-US');
const FEATURED = ['fuse', 'solitaire', 'typestorm', 'asteroids', 'sweeper', 'glide'];

const OFFICE = [
  { k: '`', t: 'Boss key', d: 'One keystroke swaps the arcade for a very boring spreadsheet. Even the tab title and icon change.', icon: ['########', '#..#...#', '########', '#..#...#', '########', '#..#...#', '########', '........'] },
  { k: 'M', t: 'Silent by default', d: 'No sound until you ask for it. Nobody in the next desk will ever know.', icon: ['...#....', '..##.#.#', '####..#.', '####.#.#', '####....', '..##....', '...#....', '........'] },
  { k: 'P', t: 'Pauses itself', d: 'Switch tabs, take a call, alt-tab away: the game freezes and costs zero CPU.', icon: ['........', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '........'] },
  { k: '2m', t: 'Coffee-break sized', d: 'Most runs last a couple of minutes. Perfect for the gap between meetings.', icon: ['..####..', '.#....#.', '#...#..#', '#...#..#', '#..##..#', '#......#', '.#....#.', '..####..'] },
];

export default function HomeView() {
  const store = useArcadeStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const d = today();
  const dmeta = GAME_BY_ID[d.id];
  const streak = streakOf(store);
  const playedToday = store.daily.last === d.key;
  const recent = store.recent.map(id => GAME_BY_ID[id]).filter(Boolean).slice(0, 5);
  const quick = GAMES.filter(g => g.mins <= 2).slice(0, 5);

  return (
    <div className="page" style={{ ['--c' as string]: dmeta.color }}>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">DAILY CHALLENGE #{d.no} · {streak} DAY STREAK</div>
          <h1>The arcade that fits in a browser tab.</h1>
          <p>{GAMES.length} games inspired by the golden age of the arcade. No installs, no sign-up, no sound until you want it. Today&apos;s run is loaded below — press Enter.</p>
        </div>
        <div className="hero-cta">
          <Link href="/games" className="btn primary">Browse all {GAMES.length} games</Link>
          <Link href="/about" className="btn ghost">How it works</Link>
        </div>
      </section>

      <section className="floor">
        <div>
          {mounted && (
            <Stage
              key={`home:${d.id}:${d.seed}`}
              meta={dmeta} daily seed={d.seed} dailyNo={d.no} crt={store.crt}
              onNext={() => router.push('/games')} onToast={toast}
            />
          )}
        </div>
        <aside className="rail">
          <div className="card rail-info">
            <Poster id={dmeta.id} title={dmeta.title} className="rail-poster" eager />
            <div className="card-pad">
              <div className="daily-k">TODAY&apos;S CABINET</div>
              <h2 className="rail-h">{dmeta.title}</h2>
              <p className="tagline">Same game, same seed, for everyone today. {playedToday ? `Your best: ${fmt(store.daily.scores[d.key] ?? 0)}.` : 'Play once to start your streak.'}</p>
              <div className="streak" aria-label={`${streak} day streak`}>
                {Array.from({ length: 7 }, (_, i) => <i key={i} className={i < Math.min(streak, 7) ? 'on' : ''} />)}
                <em>{streak} day streak</em>
              </div>
              <div className="keys" style={{ marginTop: 16 }}>
                {dmeta.keys.map(([k, a]) => <div key={k}><span>{a}</span><Kc>{k}</Kc></div>)}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {recent.length > 0 && (
        <section className="row">
          <div className="row-h"><h2>Continue playing</h2></div>
          <div className="poster-row">{recent.map(g => <GameCard key={g.id} g={g} size="sm" />)}</div>
        </section>
      )}

      <section className="row">
        <div className="row-h">
          <h2>Featured cabinets</h2>
          <Link href="/games" className="link-more">All games →</Link>
        </div>
        <div className="poster-row six">{FEATURED.map(id => <GameCard key={id} g={GAME_BY_ID[id]} size="sm" />)}</div>
      </section>

      <section className="office">
        <div className="office-copy">
          <div className="eyebrow">OFFICE MODE</div>
          <h2>Built for the desk you&apos;re sitting at.</h2>
          <p>Arcadia was designed for people who can&apos;t install games on a work machine. It runs in any browser tab, starts in a second, and knows how to keep a low profile.</p>
        </div>
        <div className="office-grid">
          {OFFICE.map(o => (
            <div key={o.t} className="ocard">
              <div className="ocard-top"><span className="ocard-ico"><PixelIcon rows={o.icon} color="#ffcf4a" /></span><kbd className="kc">{o.k}</kbd></div>
              <h3>{o.t}</h3>
              <p>{o.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="row">
        <div className="row-h">
          <h2>Coffee break</h2>
          <span className="row-sub">Runs under two minutes</span>
        </div>
        <div className="poster-row">{quick.map(g => <GameCard key={g.id} g={g} size="sm" />)}</div>
      </section>
    </div>
  );
}
