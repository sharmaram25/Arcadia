'use client';

import { useMemo, useState } from 'react';
import { GAMES, GAME_BY_ID, TAG_LABEL, type GameMeta, type Tag } from '@/arcade/catalog';
import { useArcadeStore } from '@/arcade/store';
import GameCard from './GameCard';

type Filter = 'all' | 'quick' | 'favs' | 'recent' | 'new' | Tag;
type Sort = 'featured' | 'az' | 'played' | 'quick';

const TAGS: Tag[] = ['classic', 'action', 'puzzle', 'one-button', 'mouse', 'brain', 'versus', 'typing', 'cards'];

export default function GamesView() {
  const store = useArcadeStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('featured');
  const [q, setQ] = useState('');

  const count = (f: Filter) => {
    if (f === 'all') return GAMES.length;
    if (f === 'quick') return GAMES.filter(g => g.mins <= 2).length;
    if (f === 'favs') return store.favs.length;
    if (f === 'recent') return store.recent.length;
    if (f === 'new') return GAMES.filter(g => g.isNew).length;
    return GAMES.filter(g => g.tags.includes(f)).length;
  };

  const list = useMemo(() => {
    let l: GameMeta[] = GAMES;
    if (filter === 'quick') l = l.filter(g => g.mins <= 2);
    else if (filter === 'favs') l = l.filter(g => store.favs.includes(g.id));
    else if (filter === 'recent') l = store.recent.map(id => GAME_BY_ID[id]).filter(Boolean);
    else if (filter === 'new') l = l.filter(g => g.isNew);
    else if (filter !== 'all') l = l.filter(g => g.tags.includes(filter));
    const s = q.trim().toLowerCase();
    if (s) l = l.filter(g => (g.title + ' ' + g.tagline + ' ' + g.tags.join(' ')).toLowerCase().includes(s));
    if (sort === 'az') l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'played') l = [...l].sort((a, b) => (store.plays[b.id] ?? 0) - (store.plays[a.id] ?? 0));
    if (sort === 'quick') l = [...l].sort((a, b) => a.mins - b.mins);
    return l;
  }, [filter, sort, q, store.favs, store.recent, store.plays]);

  const filters: Filter[] = ['all', 'quick', 'new', ...(store.favs.length ? ['favs' as const] : []), ...(store.recent.length ? ['recent' as const] : [])];
  const label = (f: Filter) => ({ all: 'All', quick: 'Coffee break', new: 'New', favs: 'Favourites', recent: 'Recent' } as Record<string, string>)[f] ?? TAG_LABEL[f as Tag];

  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow">THE CABINET ROW</div>
        <h1>All games</h1>
        <p>{GAMES.length} cabinets drawn from the golden age of the arcade: vector shooters, maze chases, falling blocks, paddle duels, and a few office classics. Every one starts instantly.</p>
      </header>

      <div className="filters" role="toolbar" aria-label="Filter games">
        <label className="sort">
          <span className="sr">Sort</span>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
            <option value="featured">Featured</option>
            <option value="az">A–Z</option>
            <option value="played">Most played</option>
            <option value="quick">Quickest first</option>
          </select>
        </label>
        <label className="search sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" /></svg>
          <span className="sr">Filter games</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filter" />
        </label>
        {filters.map(f => (
          <button key={f} className="pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>{label(f)}<b>{count(f)}</b></button>
        ))}
        <span className="sep" />
        {TAGS.map(f => (
          <button key={f} className="pill" aria-pressed={filter === f} onClick={() => setFilter(f)}>{label(f)}<b>{count(f)}</b></button>
        ))}
      </div>

      {list.length === 0
        ? <div className="empty">{filter === 'favs' ? 'No favourites yet. Tap the star on any game.' : 'Nothing matches that. Try another filter.'}</div>
        : <div className="poster-grid">{list.map(g => <GameCard key={g.id} g={g} />)}</div>}
    </div>
  );
}
