'use client';

import Link from 'next/link';
import { TAG_LABEL, type GameMeta } from '@/arcade/catalog';
import { medalFor, toggleFav, useArcadeStore } from '@/arcade/store';
import Poster from './Poster';
import { Medals } from './bits';

const fmt = (n: number) => n.toLocaleString('en-US');

export default function GameCard({ g, size = 'md' }: { g: GameMeta; size?: 'md' | 'sm' }) {
  const store = useArcadeStore();
  const best = store.best[g.id] ?? 0;
  const fav = store.favs.includes(g.id);
  return (
    <article className={`gcard ${size}`} style={{ ['--c' as string]: g.color }}>
      <Link href={`/play/${g.id}`} className="gcard-link" aria-label={`Play ${g.title}`}>
        <Poster id={g.id} title={g.title} />
        <span className="gcard-play" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor"><path d="M1 0h1v7H1zM2 1h1v5H2zM3 2h1v3H3zM4 3h1v1H4z" /></svg>
          PLAY
        </span>
      </Link>
      <div className="gcard-b">
        <div className="gcard-t">
          <Link href={`/play/${g.id}`}>{g.title}</Link>
          <button className="fav" aria-pressed={fav} aria-label={fav ? `Unfavourite ${g.title}` : `Favourite ${g.title}`} onClick={() => toggleFav(g.id)}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2"><path d="M6 1l1.5 3.2 3.5.4-2.6 2.4.7 3.5L6 8.8 2.9 10.5l.7-3.5L1 4.6l3.5-.4z" /></svg>
          </button>
        </div>
        {size === 'md' && <p className="gcard-s">{g.tagline}</p>}
        <div className="gcard-m">
          <span>{TAG_LABEL[g.tags[0]]} · ~{g.mins} min</span>
          <span className="gcard-best">
            {best > 0 && <span className="tnum">{fmt(best)}</span>}
            <Medals n={medalFor(best, g.medals)} />
          </span>
        </div>
      </div>
    </article>
  );
}
