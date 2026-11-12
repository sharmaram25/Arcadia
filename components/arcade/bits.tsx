'use client';

import { memo } from 'react';

export function Kc({ children, lg }: { children: React.ReactNode; lg?: boolean }) {
  return <kbd className={`kc${lg ? ' lg' : ''}`}>{children}</kbd>;
}

export function Medals({ n }: { n: number }) {
  return (
    <span className="medals" aria-label={`${['No', 'Bronze', 'Silver', 'Gold'][n]} medal`}>
      {[1, 2, 3].map(i => <i key={i} className={`medal m${i}${n >= i ? ' on' : ''}`} />)}
    </span>
  );
}

/** Renders an 8x8 bitmap as a single SVG path (one DOM node, crisp at any size). */
export const PixelIcon = memo(function PixelIcon({ rows, color }: { rows: string[]; color: string }) {
  let d = '';
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] === '#') d += `M${x} ${y}h1v1h-1z`;
  });
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true">
      <path d={d} fill={color} />
    </svg>
  );
});

/** Procedural cover art: the cabinet's sprite over dithered colour, horizon and scanlines. */
export function Cover({ rows, color, className = '' }: { rows: string[]; color: string; className?: string }) {
  return (
    <span className={`cover ${className}`} style={{ ['--c' as string]: color }}>
      <span className="stars" />
      <PixelIcon rows={rows} color={color} />
    </span>
  );
}

const LOGO = ['..####..', '.#....#.', '#.#..#.#', '#......#', '#.####.#', '.#....#.', '..####..', '...##...'];
export function Logo() {
  let d = '';
  LOGO.forEach((r, y) => { for (let x = 0; x < 8; x++) if (r[x] === '#') d += `M${x} ${y}h1v1h-1z`; });
  return (
    <svg className="brand-logo" viewBox="0 0 8 8" aria-hidden="true" shapeRendering="crispEdges">
      <path d={d} fill="#ffcf4a" />
    </svg>
  );
}
