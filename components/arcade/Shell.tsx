'use client';

import './arcade.css';
import './pages.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GAMES, TAG_LABEL } from '@/arcade/catalog';
import { isMuted, onMuteChange, setMuted } from '@/arcade/core/audio';
import { dayKey, setCrt, useArcadeStore } from '@/arcade/store';
import BossScreen from './BossScreen';
import { Kc, Logo, PixelIcon } from './bits';

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('arcadia:toast', { detail: msg }));
}

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/games', label: 'Games' },
  { href: '/play/daily', label: 'Daily' },
  { href: '/hall-of-fame', label: 'Hall of Fame' },
  { href: '/about', label: 'About' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const store = useArcadeStore();
  const path = usePathname();
  const router = useRouter();
  const [muted, setMutedState] = useState(true);
  const [boss, setBoss] = useState(false);
  const [toastMsg, setToast] = useState<{ msg: string; k: number } | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMutedState(isMuted()); return onMuteChange(setMutedState); }, []);
  useEffect(() => {
    const on = (e: Event) => setToast({ msg: (e as CustomEvent<string>).detail, k: Date.now() });
    window.addEventListener('arcadia:toast', on);
    return () => window.removeEventListener('arcadia:toast', on);
  }, []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToast(null), 2300);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return GAMES.filter(g => (g.title + ' ' + g.tagline + ' ' + g.tags.join(' ')).toLowerCase().includes(s)).slice(0, 6);
  }, [q]);

  const launch = useCallback((id: string) => {
    setQ(''); setOpen(false); searchRef.current?.blur();
    router.push(`/play/${id}`);
  }, [router]);

  const enterBoss = useCallback(() => {
    window.dispatchEvent(new Event('arcadia:pause'));
    setBoss(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || boss) return;
      if (e.key === '`') { e.preventDefault(); enterBoss(); return; }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (document.body.dataset.kbd === 'game') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); setOpen(true); }
      else if (e.key === 'm' || e.key === 'M') setMuted(!isMuted());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [boss, enterBoss]);

  const dailyDone = store.daily.last === dayKey();
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  if (boss) return <BossScreen onExit={() => setBoss(false)} />;

  return (
    <div className="ar">
      <a href="#main" className="skip">Skip to content</a>
      <header className="top">
        <div className="top-in">
          <Link href="/" className="brand" aria-label="Arcadia home">
            <Logo />
            <span className="brand-word">ARCADIA</span>
          </Link>

          <nav className="nav" aria-label="Primary">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className={active(n.href) ? 'on' : ''} aria-current={active(n.href) ? 'page' : undefined}>
                {n.label}
                {n.href === '/play/daily' && !dailyDone && <span className="dot" aria-label="not played today" />}
              </Link>
            ))}
          </nav>

          <div className="launcher">
            <label className="search">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" /></svg>
              <span className="sr">Find a game</span>
              <input
                ref={searchRef}
                value={q}
                placeholder="Find a game"
                onChange={e => { setQ(e.target.value); setOpen(true); setHi(0); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, results.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
                  else if (e.key === 'Enter' && results[hi]) launch(results[hi].id);
                  else if (e.key === 'Escape') { setQ(''); (e.target as HTMLInputElement).blur(); }
                }}
                aria-expanded={open && results.length > 0}
                aria-controls="launcher-list"
                role="combobox"
                aria-autocomplete="list"
              />
              <Kc>/</Kc>
            </label>
            {open && results.length > 0 && (
              <ul className="launcher-list" id="launcher-list" role="listbox">
                {results.map((g, i) => (
                  <li key={g.id} role="option" aria-selected={i === hi}>
                    <button onMouseDown={e => e.preventDefault()} onClick={() => launch(g.id)} onMouseEnter={() => setHi(i)} className={i === hi ? 'hi' : ''} style={{ ['--c' as string]: g.color }}>
                      <span className="ll-ico"><PixelIcon rows={g.icon} color={g.color} /></span>
                      <span className="ll-t">{g.title}<small>{TAG_LABEL[g.tags[0]]} · ~{g.mins} min</small></span>
                      {i === hi && <Kc>Enter</Kc>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="tools">
            <button className="icon-btn" aria-pressed={!muted} onClick={() => setMuted(!muted)} title={muted ? 'Sound off (M)' : 'Sound on (M)'} aria-label="Toggle sound">
              <svg width="18" height="18" viewBox="0 0 9 9" shapeRendering="crispEdges" fill="currentColor">
                <path d="M1 3h2v3H1zM3 2h1v5H3zM4 1h1v7H4z" />
                {muted ? <path d="M6 3h1v1H6zM8 3h1v1H8zM7 4h1v1H7zM6 5h1v1H6zM8 5h1v1H8z" /> : <path d="M6 3h1v3H6zM7 2h1v1H7zM8 3h1v3H8zM7 6h1v1H7z" />}
              </svg>
            </button>
            <button className="icon-btn" aria-pressed={store.crt} onClick={() => setCrt(!store.crt)} title="CRT scanlines" aria-label="Toggle CRT scanlines">
              <svg width="18" height="18" viewBox="0 0 9 9" shapeRendering="crispEdges" fill="currentColor">
                <path d="M1 1h7v1H1zM1 2h1v5H1zM7 2h1v5H7zM1 7h7v1H1z" />
                {store.crt && <path d="M3 3h3v1H3zM3 5h3v1H3z" opacity="0.6" />}
              </svg>
            </button>
            <button className="boss-btn" onClick={enterBoss} title="Boss key: instantly hide the arcade behind a spreadsheet">
              <span className="lbl">Boss key</span><Kc>`</Kc>
            </button>
          </div>
        </div>
      </header>

      <main className="main" id="main">{children}</main>

      <footer className="foot-wrap">
        <div className="foot">
          <div>
            <h4>ARCADIA</h4>
            <p>The arcade that lives in a browser tab. {GAMES.length} games inspired by the golden age, no installs, no accounts. Your scores stay on your device.</p>
          </div>
          <div>
            <h4>PLAY</h4>
            <ul>
              <li><Link href="/games">All games</Link></li>
              <li><Link href="/play/daily">Daily challenge</Link></li>
              <li><Link href="/hall-of-fame">Hall of Fame</Link></li>
            </ul>
          </div>
          <div>
            <h4>OFFICE MODE</h4>
            <ul>
              <li>Silent until you ask<Kc>M</Kc></li>
              <li>Boss key<Kc>`</Kc></li>
              <li>Pause<Kc>P</Kc></li>
              <li>Fullscreen<Kc>F</Kc></li>
            </ul>
          </div>
          <div>
            <h4>ARCADIA</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/about">Our story</Link></li>
            </ul>
          </div>
          <div className="legal"><span>© ARCADIA · INSERT COIN TO CONTINUE</span><span className="blink">FREE PLAY</span></div>
        </div>
      </footer>

      {toastMsg && <div key={toastMsg.k} className="toast" role="status">{toastMsg.msg}</div>}
    </div>
  );
}
