'use client';

import './story.css';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GAMES } from '@/arcade/catalog';
import Poster from './Poster';

const STRIP_A = ['asteroids', 'snake', 'fuse', 'glide', 'shield', 'lander', 'voidchomp', 'hexspin', 'solitaire', 'defender'];
const STRIP_B = ['typestorm', 'stackpanic', 'trails', 'dash', 'gemswap', 'prismbreak', 'sweeper', 'river', 'echo', 'dodge'];
const LINKS = [
  { href: 'https://github.com/sharmaram25', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/ram-sharma-20rs02', label: 'LinkedIn' },
  { href: 'https://instagram.com/ramsharma.25', label: 'Instagram' },
  { href: 'mailto:sharmaram2504@gmail.com', label: 'Email' },
];

/** Fades chapters in as they scroll into view. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.rv');
    if (!els) return;
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.18 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function Strip({ ids, reverse }: { ids: string[]; reverse?: boolean }) {
  const loop = [...ids, ...ids];
  return (
    <div className={`strip${reverse ? ' rev' : ''}`} aria-hidden="true">
      <div className="strip-track">
        {loop.map((id, i) => <div key={i} className="strip-item"><Poster id={id} title={id} /></div>)}
      </div>
    </div>
  );
}

export default function AboutView() {
  const ref = useReveal();
  return (
    <div className="story" ref={ref}>
      {/* ── Title card ── */}
      <header className="st-hero">
        <div className="st-hero-copy rv">
          <div className="st-kicker">THE STORY OF ARCADIA</div>
          <h1>Every arcade has a story.<br /><span>This is ours.</span></h1>
          <p>How one developer set out to put a whole arcade inside a browser tab, without a game engine, a plugin, or a single downloaded file.</p>
          <div className="st-scroll"><span>SCROLL TO CONTINUE</span><i /></div>
        </div>
        <div className="st-hero-art">
          <Strip ids={STRIP_A} />
          <Strip ids={STRIP_B} reverse />
        </div>
      </header>

      {/* ── Level 1 ── */}
      <section className="chapter">
        <div className="ch-num rv">LEVEL 1</div>
        <div className="ch-body rv">
          <h2>Insert coin.</h2>
          <p className="lead">Remember the sound of a coin dropping into a machine? The glow of the screen in a dark room, three letters on a high-score table, and the stubborn certainty that the next run would be the one?</p>
          <p>That feeling never needed a cabinet the size of a fridge. It needed two minutes, a screen, and a reason to try once more. Arcadia is that feeling, rebuilt for the place most of us spend our days: a browser tab.</p>
        </div>
      </section>

      {/* ── Level 2 ── */}
      <section className="chapter">
        <div className="ch-num rv">LEVEL 2</div>
        <div className="ch-body rv">
          <h2>The locked-down laptop.</h2>
          <p className="lead">Most people can&apos;t install a game on the computer in front of them. Work machines are locked. Downloads are blocked. App stores are off-limits.</p>
          <p>But every one of those machines has a browser. So the question became simple: what if the arcade came to you? No install, no account, no sign-up wall. Just open a tab and you&apos;re playing, in silence until you decide otherwise, with a boss key for the moments you&apos;d rather not explain.</p>
        </div>
      </section>

      {/* ── Level 3: the creator ── */}
      <section className="chapter creator">
        <div className="ch-num rv">LEVEL 3</div>
        <div className="ch-body">
          <h2 className="rv">The player behind the machine.</h2>
          <div className="creator-card rv">
            <div className="creator-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/creator.jpg" alt="Ram Sharma" />
              <span className="p1">PLAYER 1</span>
            </div>
            <div className="creator-copy">
              <div className="st-kicker">CREATOR</div>
              <h3>Ram Sharma</h3>
              <div className="roles"><span>Full-stack developer</span><span>Game engineer</span><span>Engine architect</span></div>
              <p>Ram builds web experiences that push past what browsers were supposed to be able to do. Arcadia started as his arena: a place to prove that real-time graphics, physics and sound could all live in plain web code.</p>
              <div className="links">
                {LINKS.map(l => <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{l.label}<span>↗</span></a>)}
              </div>
            </div>
          </div>
          <blockquote className="pull rv">
            <p>&ldquo;No plugins. No cheats. No game engine frameworks. Pure web.&rdquo;</p>
            <cite>— Ram Sharma</cite>
          </blockquote>
          <p className="rv">The first version of Arcadia shipped with twelve original games running on an engine Ram wrote himself in TypeScript, with every sound effect synthesised at runtime instead of loaded from a file. It was a statement about how far the browser could go.</p>
        </div>
      </section>

      {/* ── Level 4 ── */}
      <section className="chapter">
        <div className="ch-num rv">LEVEL 4</div>
        <div className="ch-body rv">
          <h2>Built from nothing.</h2>
          <p className="lead">There is no game engine under Arcadia. No downloaded artwork. No audio files.</p>
          <p>Every cabinet runs on Arcadia&apos;s own runtime, ticking at a steady sixty frames a second whether you&apos;re on an office monitor or a gaming display. Every beep and explosion is synthesised the instant it plays. Even the posters on this site, every chrome logo and sunset and scanline, are painted by code the moment you scroll to them.</p>
          <p>When you switch tabs, the arcade stops completely and waits for you. It never runs in the background, never slows down the machine you&apos;re supposed to be working on.</p>
        </div>
      </section>

      {/* ── Level 5 ── */}
      <section className="chapter wide">
        <div className="ch-num rv">LEVEL 5</div>
        <div className="ch-body rv">
          <h2>The golden age, re-imagined.</h2>
          <p className="lead">Paddle duels from 1972. Vector rocks from 1979. Maze chases, falling blocks, light-cycle duels, bullet storms.</p>
          <p>Arcadia&apos;s {GAMES.length} cabinets are original games: new names, new art, new rules. Each one tips its hat to a genre that defined the arcade, then adds what decades of game design have taught us since: tighter controls, fairer difficulty, and runs short enough to fit between two meetings.</p>
        </div>
        <div className="exhibit rv">
          {['asteroids', 'voidchomp', 'stackpanic', 'lander', 'trails'].map((id, i) => (
            <Link key={id} href={`/play/${id}`} className="exhibit-item" style={{ ['--i' as string]: i }}>
              <Poster id={id} title={id} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Level 6 ── */}
      <section className="chapter">
        <div className="ch-num rv">LEVEL 6</div>
        <div className="ch-body rv">
          <h2>Yours, and only yours.</h2>
          <p className="lead">There are no accounts in Arcadia, no tracking, and nothing is sent anywhere.</p>
          <p>Your high scores, your initials, your medals and your daily streak live in your own browser, the way scores once lived inside the machine itself. Come back tomorrow and they&apos;ll be waiting. Clear your browser and the slate is clean, just like unplugging the cabinet.</p>
        </div>
      </section>

      {/* ── Level 7 ── */}
      <section className="chapter">
        <div className="ch-num rv">LEVEL 7</div>
        <div className="ch-body rv">
          <h2>Continue?</h2>
          <p className="lead">Arcadia isn&apos;t finished. Arcades never are.</p>
          <p>More cabinets are on the way, and Ram&apos;s long-standing plan is to open-source the engine so anyone can build their own. Until then, the floor is open and free play is on.</p>
        </div>
      </section>

      <section className="st-end rv">
        <Countdown />
        <h2>INSERT COIN</h2>
        <p>Pick a cabinet. Your story starts with the first run.</p>
        <div className="st-end-cta">
          <Link href="/games" className="btn primary">Browse the games</Link>
          <Link href="/play/daily" className="btn ghost">Play today&apos;s daily</Link>
        </div>
      </section>
    </div>
  );
}

/** The CONTINUE? countdown from every cabinet: 9 → 0, then round again. */
function Countdown() {
  const [n, setN] = useState(9);
  useEffect(() => {
    const t = setInterval(() => setN(v => (v <= 0 ? 9 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return <div className="countdown" aria-hidden="true">{n}</div>;
}
