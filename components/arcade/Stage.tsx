'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameMeta } from '@/arcade/catalog';
import { Runner } from '@/arcade/core/runner';
import type { EndInfo, GameFactory } from '@/arcade/core/types';
import { sfx } from '@/arcade/core/audio';
import { addToTable, getData, medalFor, recordRun, touchRecent, type RunResult } from '@/arcade/store';
import { arcadeManager } from '@/lib/arcade/ArcadeManager';
import TouchPad from './TouchPad';
import { Kc, Medals } from './bits';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'over' | 'error';

interface Result { score: number; info: EndInfo; seconds: number; run: RunResult }

interface Props {
  meta: GameMeta;
  daily: boolean;
  seed: number;
  dailyNo: number;
  crt: boolean;
  onNext: () => void;
  onToast: (msg: string) => void;
}

const fmt = (n: number) => n.toLocaleString('en-US');

export default function Stage({ meta, daily, seed, dailyNo, crt, onNext, onToast }: Props) {
  const cabRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runnerRef = useRef<Runner | null>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const phaseRef = useRef<Phase>('loading');
  const [phase, _setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<Result | null>(null);
  const [initials, setInitials] = useState('');
  const [entering, setEntering] = useState(false);
  const [size, setSize] = useState({ w: meta.w, h: meta.h, boxH: meta.h });
  const [best, setBest] = useState(0);

  const setPhase = useCallback((p: Phase) => { phaseRef.current = p; _setPhase(p); }, []);

  // Tell app-level shortcuts to back off while a typing game owns the keyboard,
  // or while initials are being entered.
  useEffect(() => {
    const busy = (phase === 'playing' && !!meta.textInput) || (phase === 'over' && entering);
    document.body.dataset.kbd = busy ? 'game' : '';
    return () => { document.body.dataset.kbd = ''; };
  }, [phase, meta.textInput, entering]);

  // ── Fit the screen to the available space (width of column, height of viewport) ──
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => {
      const full = document.fullscreenElement === cabRef.current;
      const coarse = matchMedia('(pointer: coarse)').matches;
      const padReserve = coarse && meta.touch !== 'none' ? 190 : 0;
      const maxH = full
        ? window.innerHeight - 150 - padReserve
        : Math.max(260, Math.min(window.innerHeight - 236 - padReserve, 860));
      const aw = box.clientWidth;
      const s = Math.min(aw / meta.w, maxH / meta.h);
      const w = Math.floor(meta.w * s), h = Math.floor(meta.h * s);
      setSize({ w, h, boxH: Math.max(h, Math.min(maxH, h)) });
      runnerRef.current?.resize(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', fit); };
  }, [meta]);

  const handleEnd = useCallback((score: number, info: EndInfo, seconds: number) => {
    const run = recordRun(meta.id, score, Math.round(seconds), daily);
    try { arcadeManager.recordGameEnd(meta.id, score, seconds); } catch { /* legacy profile optional */ }
    setResult({ score, info, seconds, run });
    setBest(Math.max(run.prevBest, score));
    setEntering(run.rank >= 0);
    setInitials(getData().initials || '');
    setPhase('over');
    if (info.win) sfx.win();
    // Let the death animation play out, then stop the loop entirely (zero idle CPU).
    window.setTimeout(() => { if (phaseRef.current === 'over') runnerRef.current?.pause(); }, 1400);
  }, [meta.id, daily, setPhase]);

  // ── Load the cabinet's code on demand and boot a runner ──
  useEffect(() => {
    let alive = true;
    setPhase('loading');
    setResult(null);
    const prevBest = getData().best[meta.id] ?? 0;
    setBest(prevBest);
    if (scoreRef.current) scoreRef.current.textContent = '0';

    meta.load().then((mod) => {
      if (!alive || !canvasRef.current) return;
      const factory: GameFactory = mod.default;
      const r = new Runner(canvasRef.current, factory, {
        w: meta.w, h: meta.h, seed, best: prevBest, daily, textInput: meta.textInput,
        onScore: (s) => { if (scoreRef.current) scoreRef.current.textContent = fmt(s); },
        onEnd: handleEnd,
      });
      runnerRef.current = r;
      const box = boxRef.current;
      if (box) r.resize(Math.min(box.clientWidth / meta.w, 10));
      r.pause(); // draw the attract frame behind the start card
      setPhase('ready');
    }).catch(() => { if (alive) setPhase('error'); });

    return () => {
      alive = false;
      runnerRef.current?.destroy();
      runnerRef.current = null;
    };
  }, [meta, seed, daily, handleEnd, setPhase]);

  // keep the runner's backing store in sync with the fitted size
  useEffect(() => { runnerRef.current?.resize(size.w / meta.w); }, [size.w, meta.w]);

  const start = useCallback(() => {
    const r = runnerRef.current;
    if (!r) return;
    sfx.select();
    touchRecent(meta.id);
    try { arcadeManager.recordGameStart(meta.id); } catch { /* optional */ }
    // Defer one task so the key that started the game isn't also its first input.
    window.setTimeout(() => r.resume(), 0);
    setPhase('playing');
    canvasRef.current?.focus({ preventScroll: true });
  }, [meta.id, setPhase]);

  const restart = useCallback(() => {
    const r = runnerRef.current;
    if (!r) return;
    sfx.select();
    setResult(null);
    setEntering(false);
    window.setTimeout(() => r.restart(getData().best[meta.id] ?? 0), 0);
    setPhase('playing');
  }, [meta.id, setPhase]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    runnerRef.current?.pause();
    setPhase('paused');
  }, [setPhase]);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    window.setTimeout(() => runnerRef.current?.resume(), 0);
    setPhase('playing');
  }, [setPhase]);

  const fullscreen = useCallback(() => {
    const el = cabRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => onToast('Fullscreen not available here'));
  }, [onToast]);

  const share = useCallback(async () => {
    if (!result) return;
    const url = `${location.origin}/play/${daily ? 'daily' : meta.id}`;
    const m = medalFor(result.score, meta.medals);
    const lines = [
      daily ? `Arcadia Daily #${dailyNo} · ${meta.title}` : `Arcadia · ${meta.title}`,
      `${fmt(result.score)} pts${m ? ` · ${['', 'bronze', 'silver', 'gold'][m]}` : ''}${result.info.message ? ` · ${result.info.message}` : ''}`,
      ...(result.info.share ? ['', result.info.share] : []),
      '', url,
    ];
    const text = lines.join('\n');
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); onToast('Result copied — paste it anywhere'); }
    } catch { /* user cancelled */ }
  }, [result, daily, dailyNo, meta, onToast]);

  const commitInitials = useCallback(() => {
    if (!result) return;
    const n = (initials || 'AAA').padEnd(3, 'A').slice(0, 3);
    addToTable(meta.id, n, result.score);
    setEntering(false);
    sfx.coin();
  }, [initials, meta.id, result]);

  // ── Auto-pause: tab hidden, window blurred, boss key ──
  useEffect(() => {
    const onVis = () => { if (document.hidden) pause(); };
    const onBlur = () => pause();
    const onExternal = () => pause();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('arcadia:pause', onExternal);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('arcadia:pause', onExternal);
    };
  }, [pause]);

  // ── Cabinet shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const p = phaseRef.current;
      const k = e.key;
      const text = !!meta.textInput;

      if (p === 'over' && entering) {
        if (/^[a-zA-Z0-9]$/.test(k)) { setInitials(s => (s.length >= 3 ? s : s + k.toUpperCase())); sfx.key(); e.preventDefault(); }
        else if (k === 'Backspace') { setInitials(s => s.slice(0, -1)); e.preventDefault(); }
        else if (k === 'Enter') { commitInitials(); e.preventDefault(); }
        return;
      }
      if (p === 'ready' && (k === 'Enter' || k === ' ')) {
        // only steal Space/Enter if focus isn't on another control
        if (t && t !== document.body && t.tagName === 'BUTTON' && !cabRef.current?.contains(t)) return;
        e.preventDefault(); start(); return;
      }
      if (p === 'over') {
        if (k === 'Enter' || k === ' ' || k === 'r' || k === 'R') { e.preventDefault(); restart(); }
        else if (k === 'n' || k === 'N') { e.preventDefault(); onNext(); }
        else if (k === 's' || k === 'S') { e.preventDefault(); void share(); }
        return;
      }
      if (p === 'playing') {
        if (k === 'Escape' || (!text && (k === 'p' || k === 'P'))) { e.preventDefault(); pause(); return; }
        if (!text && (k === 'f' || k === 'F')) { fullscreen(); return; }
        return;
      }
      if (p === 'paused') {
        if (k === 'Escape' || k === 'p' || k === 'P' || k === 'Enter' || k === ' ') { e.preventDefault(); resume(); }
        else if (k === 'r' || k === 'R') { e.preventDefault(); restart(); }
        return;
      }
      if (k === 'f' || k === 'F') fullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meta.textInput, entering, start, restart, pause, resume, fullscreen, onNext, share, commitInitials]);

  const medal = result ? medalFor(result.score, meta.medals) : medalFor(best, meta.medals);
  const table = getData().tables[meta.id] ?? [];

  return (
    <div ref={cabRef} className={`cab${crt ? ' crt' : ''}`} style={{ ['--c' as string]: meta.color }}>
      <div className="marquee">
        <div className="mq-side l">1UP<b ref={scoreRef} className="tnum">0</b></div>
        <div className="mq-title">
          {daily && <small>DAILY #{dailyNo}</small>}
          {meta.title.toUpperCase()}
        </div>
        <div className="mq-side r">HI-SCORE<b className="tnum">{fmt(best)}</b></div>
      </div>

      <div ref={boxRef} className="screen-box" style={{ height: size.boxH }}>
        <div className="screen" style={{ width: size.w, height: size.h }}>
          <canvas ref={canvasRef} tabIndex={-1} aria-label={`${meta.title} game screen`} />

          {phase === 'loading' && <div className="ov"><span className="loader">LOADING<i /></span></div>}
          {phase === 'error' && (
            <div className="ov"><div className="ov-card"><div className="ov-title">TILT</div><p className="ov-how">This cabinet failed to load. Check your connection and try again.</p></div></div>
          )}

          {phase === 'ready' && (
            <div className="ov attract" onClick={start} role="button" aria-label={`Start ${meta.title}`}>
              <div className="ov-card">
                <div className="ov-kicker">{daily ? 'DAILY CHALLENGE · SAME SEED FOR ALL' : '1 PLAYER'}</div>
                <div className="ov-title">{meta.title.toUpperCase()}</div>
                <p className="ov-how">{meta.how}</p>
                <div className="press">{matchMediaSafe('(pointer: coarse)') ? 'TAP TO START' : 'PRESS ENTER'}</div>
              </div>
              <div className="attract-foot"><span>CREDIT 00</span><span>FREE PLAY</span></div>
            </div>
          )}

          {phase === 'paused' && (
            <div className="ov">
              <div className="ov-card">
                <div className="ov-title">PAUSED</div>
                <div className="go-actions">
                  <button className="btn primary" onClick={resume}>Resume <Kc>Esc</Kc></button>
                  <button className="btn" onClick={restart}>Restart <Kc>R</Kc></button>
                </div>
                <div className="ov-row" style={{ color: 'var(--text-3)' }}>Pauses itself whenever you switch tabs.</div>
              </div>
            </div>
          )}

          {phase === 'over' && result && (
            <div className="ov">
              <div className="ov-card">
                <div className="ov-kicker">{result.info.win ? 'STAGE CLEAR' : 'GAME OVER'}</div>
                {result.info.message && <div className="ov-how" style={{ marginTop: -8 }}>{result.info.message}</div>}
                <div className="go-score tnum">{fmt(result.score)}</div>
                <div className="go-best">
                  {result.run.isBest ? <span className="newbest">NEW BEST</span> : <span>Best {fmt(Math.max(result.run.prevBest, result.score))}</span>}
                  <Medals n={medal} />
                </div>
                {entering ? (
                  <>
                    <div className="ov-kicker" style={{ color: 'var(--gold)' }}>TOP 5 — ENTER YOUR INITIALS</div>
                    <div className="initials" aria-live="polite">
                      {[0, 1, 2].map(i => <span key={i} className={i === initials.length ? 'cur' : ''}>{initials[i] ?? ''}</span>)}
                    </div>
                    <div className="go-actions">
                      <button className="btn primary" onClick={commitInitials}>Save <Kc>Enter</Kc></button>
                    </div>
                    <InitialsKeyboard onKey={(c) => setInitials(s => (c === '<' ? s.slice(0, -1) : s.length >= 3 ? s : s + c))} />
                  </>
                ) : (
                  <>
                    {table.length > 0 && (
                      <table className="hof" style={{ maxWidth: 280 }}>
                        <tbody>
                          {table.slice(0, 5).map((e, i) => (
                            <tr key={i}><td className="rk">{['1ST', '2ND', '3RD', '4TH', '5TH'][i]}</td><td className="n">{e.n}</td><td className="s tnum">{fmt(e.s)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="go-actions">
                      <button className="btn primary" onClick={restart}>Play again <Kc>Enter</Kc></button>
                      <button className="btn" onClick={onNext}>Next <Kc>N</Kc></button>
                      <button className="btn" onClick={share}>Share <Kc>S</Kc></button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="deck">
        <div className="deck-keys">
          {meta.keys.map(([k, a]) => <span key={k}><Kc>{k}</Kc>{a}</span>)}
          <span><Kc>{meta.textInput ? 'Esc' : 'P'}</Kc>Pause</span>
        </div>
        <div className="deck-actions">
          {phase === 'playing' && (
            <button className="icon-btn" onClick={pause} title="Pause" aria-label="Pause">
              <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor"><path d="M1 1h2v5H1zM4 1h2v5H4z" /></svg>
            </button>
          )}
          {(phase === 'playing' || phase === 'paused' || phase === 'over') && (
            <button className="icon-btn" onClick={restart} title="Restart (R)" aria-label="Restart">
              <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor"><path d="M2 1h3v1H2zM1 2h1v3H1zM5 2h1v1H5zM2 5h3v1H2zM5 4h1v1H5zM4 0h1v1H4zM4 2h1v1H4zM6 1h1v1H6z" /></svg>
            </button>
          )}
          <button className="icon-btn" onClick={fullscreen} title="Fullscreen (F)" aria-label="Fullscreen">
            <svg width="14" height="14" viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor"><path d="M0 0h3v1H1v2H0zM4 0h3v3H6V1H4zM0 4h1v2h2v1H0zM6 4h1v3H4V6h2z" /></svg>
          </button>
        </div>
      </div>

      {runnerRef.current && phase !== 'loading' && (
        <TouchPad layout={meta.touch} input={runnerRef.current.input} onStart={phase === 'ready' ? start : undefined} onPause={pause} />
      )}
    </div>
  );
}

function matchMediaSafe(q: string) {
  return typeof window !== 'undefined' && window.matchMedia(q).matches;
}

/** On-screen A–Z for initials on touch devices. */
function InitialsKeyboard({ onKey }: { onKey: (c: string) => void }) {
  if (!matchMediaSafe('(pointer: coarse)')) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 320 }}>
      {'ABCDEFGHIJKLMNOPQRSTUVWXYZ<'.split('').map(c => (
        <button key={c} className="kc lg" onClick={() => onKey(c)}>{c === '<' ? '⌫' : c}</button>
      ))}
    </div>
  );
}
