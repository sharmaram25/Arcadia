'use client';

import { useEffect, useState } from 'react';
import type { TouchLayout } from '@/arcade/catalog';
import type { Btn, Input } from '@/arcade/core/input';

interface Props { layout: TouchLayout; input: Input; onStart?: () => void; onPause: () => void }

/** On-screen controller for touch devices. Feeds the same virtual buttons as the keyboard. */
export default function TouchPad({ layout, input, onStart, onPause }: Props) {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(pointer: coarse)');
    const set = () => {
      setCoarse(mq.matches);
      document.documentElement.classList.toggle('coarse', mq.matches);
    };
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  if (!coarse || layout === 'none') return null;

  const B = ({ b, label, cls = '', area }: { b: Btn; label: React.ReactNode; cls?: string; area?: string }) => (
    <button
      className={`pb ${cls}`}
      style={area ? { gridArea: area } : undefined}
      aria-label={b}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).dataset.on = '1';
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
        if (onStart) { onStart(); return; }
        input.virtualDown(b);
        navigator.vibrate?.(8);
      }}
      onPointerUp={(e) => { (e.currentTarget as HTMLElement).dataset.on = '0'; input.virtualUp(b); }}
      onPointerCancel={(e) => { (e.currentTarget as HTMLElement).dataset.on = '0'; input.virtualUp(b); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  const dpad = layout === 'dpad' || layout === 'dpad-a';
  const lr = layout === 'lr' || layout === 'lr-a';
  const hasA = layout === 'dpad-a' || layout === 'lr-a' || layout === 'a';

  return (
    <div className="pad">
      {dpad && (
        <div className="dpad">
          <B b="up" label="▲" area="1 / 2" />
          <B b="left" label="◀" area="2 / 1" />
          <B b="right" label="▶" area="2 / 3" />
          <B b="down" label="▼" area="3 / 2" />
        </div>
      )}
      {lr && (
        <div className="abtns">
          <B b="left" label="◀" cls="wide" />
          <B b="right" label="▶" cls="wide" />
        </div>
      )}
      {!dpad && !lr && <span />}
      <button className="pb" style={{ width: 44, height: 30, fontSize: 9 }} onClick={onPause} aria-label="Pause">II</button>
      {hasA ? <div className="abtns"><B b="a" label="A" cls="round" /></div> : <span />}
    </div>
  );
}
