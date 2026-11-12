// Shared procedural audio. One lazily-created AudioContext for the whole arcade,
// created only after a user gesture (no autoplay warnings), with a global mute
// that defaults to ON so the arcade is office-safe out of the box.

const MUTE_KEY = 'arcadia.muted';

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = true;
const listeners = new Set<(m: boolean) => void>();

if (typeof window !== 'undefined') {
  try {
    const v = localStorage.getItem(MUTE_KEY);
    muted = v === null ? true : v === '1';
  } catch { /* storage blocked */ }
}

function ctx(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  if (!ac) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.22;
      master.connect(ac.destination);
    } catch {
      return null;
    }
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

export function isMuted() { return muted; }

export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ }
  if (m && ac) void ac.suspend();
  if (!m) ctx();
  listeners.forEach(l => l(m));
}

export function onMuteChange(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

interface ToneOpts { type?: OscillatorType; vol?: number; to?: number; delay?: number }

export function tone(freq: number, dur: number, { type = 'square', vol = 0.25, to, delay = 0 }: ToneOpts = {}) {
  const a = ctx();
  if (!a || !master) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function noise(dur: number, vol = 0.3, cutoff = 1200, delay = 0) {
  const a = ctx();
  if (!a || !master) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + delay;
  const s = a.createBufferSource();
  s.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(cutoff, t);
  f.frequency.exponentialRampToValueAtTime(80, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

function arp(notes: number[], step: number, dur: number, type: OscillatorType = 'square', vol = 0.18) {
  notes.forEach((n, i) => tone(n, dur, { type, vol, delay: i * step }));
}

// A small vocabulary every game shares, so the arcade sounds coherent.
export const sfx = {
  blip: () => tone(660, 0.05, { vol: 0.12 }),
  tick: () => tone(1200, 0.025, { type: 'triangle', vol: 0.1 }),
  select: () => arp([523, 784], 0.05, 0.08, 'square', 0.12),
  coin: () => arp([988, 1319], 0.06, 0.12, 'square', 0.14),
  power: () => arp([523, 659, 784, 1047], 0.05, 0.1, 'square', 0.14),
  jump: () => tone(300, 0.15, { to: 700, vol: 0.14 }),
  flap: () => tone(420, 0.08, { to: 620, type: 'triangle', vol: 0.18 }),
  shoot: () => tone(900, 0.09, { to: 180, vol: 0.1 }),
  hit: () => { tone(180, 0.12, { to: 60, type: 'sawtooth', vol: 0.18 }); noise(0.08, 0.12, 2000); },
  boom: () => { noise(0.45, 0.35, 900); tone(120, 0.4, { to: 30, type: 'sawtooth', vol: 0.2 }); },
  bounce: () => tone(440, 0.05, { type: 'triangle', vol: 0.18 }),
  lose: () => arp([392, 330, 262, 196], 0.12, 0.2, 'triangle', 0.2),
  win: () => arp([523, 659, 784, 1047, 1319], 0.08, 0.18, 'square', 0.15),
  key: () => tone(1500 + Math.random() * 300, 0.02, { type: 'square', vol: 0.05 }),
  pad: (i: number) => tone([330, 392, 494, 587, 659][i % 5], 0.35, { type: 'triangle', vol: 0.25 }),
  note: (freq: number, dur = 0.12) => tone(freq, dur, { type: 'square', vol: 0.12 }),
};

export type Sfx = typeof sfx;
