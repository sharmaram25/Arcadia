'use client';

import { useEffect, useRef, useState } from 'react';

// Posters are painted procedurally once per session into compressed WebP
// data URLs (≈100 KB each) and shown as <img>. Painting is queued so it never janks scrolling.

const urls = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();
let fonts: Promise<unknown> | null = null;

const idle = () => new Promise<void>(r => {
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(() => r(), { timeout: 120 }); else setTimeout(r, 16);
});

function render(id: string): Promise<string> {
  const hit = urls.get(id);
  if (hit) return Promise.resolve(hit);
  const p = pending.get(id);
  if (p) return p;
  const job = queue.then(async () => {
    if (!fonts) {
      const fam = getComputedStyle(document.documentElement).getPropertyValue('--font-pixel').trim();
      fonts = Promise.race([document.fonts.load(`20px ${fam}`), new Promise(r => setTimeout(r, 1500))]);
    }
    await fonts;
    await idle();
    const { paintPoster, PW, PH } = await import('@/arcade/posters/posters');
    const k = 1.2;
    const c = document.createElement('canvas');
    c.width = PW * k; c.height = PH * k;
    const g = c.getContext('2d')!;
    g.scale(k, k);
    paintPoster(id, g);
    // synchronous encode: deterministic, and cheap enough inside an idle slot
    let url = c.toDataURL('image/webp', 0.86);
    if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.86);
    urls.set(id, url);
    return url;
  });
  // one failed poster must never poison the queue for the rest
  queue = job.catch((e) => { console.error('[poster]', id, e); });
  pending.set(id, job);
  return job;
}

interface Props { id: string; title: string; className?: string; eager?: boolean }

export default function Poster({ id, title, className = '', eager }: Props) {
  const [src, setSrc] = useState<string | null>(() => urls.get(id) ?? null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urls.has(id)) { setSrc(urls.get(id)!); return; }
    setSrc(null);
    let alive = true;
    const go = () => render(id).then(u => { if (alive) setSrc(u); });
    if (eager) { go(); return () => { alive = false; }; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => { alive = false; io.disconnect(); };
  }, [id, eager]);

  return (
    <div ref={ref} className={`poster ${src ? 'ready' : ''} ${className}`}>
      {src ? <img src={src} alt={`${title} poster`} draggable={false} /> : <span className="poster-ph" aria-hidden="true" />}
    </div>
  );
}
