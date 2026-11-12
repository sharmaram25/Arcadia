'use client';

import { useEffect, useMemo } from 'react';

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const LINES = [
  'Revenue — Enterprise', 'Revenue — Mid-market', 'Revenue — SMB', 'Services', 'Total revenue',
  'COGS — Hosting', 'COGS — Support', 'Gross margin', 'Sales & marketing', 'R&D', 'G&A',
  'Total opex', 'EBITDA', 'D&A', 'Operating income', 'Headcount — Sales', 'Headcount — Eng',
  'Headcount — G&A', 'Avg. deal size', 'Pipeline coverage', 'Win rate', 'Net retention',
  'Churn (logos)', 'CAC payback (mo)', 'Cash — opening', 'Cash — closing',
];
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#1e7a46"/><path d="M3 4h10M3 8h10M3 12h10M7 2v12" stroke="#fff" stroke-width="1.2"/></svg>');

/**
 * Boss key. Instantly swaps the arcade for a dull, generic spreadsheet, retitles
 * the tab and swaps the favicon. ` or Esc brings the arcade back (game stays paused).
 */
export default function BossScreen({ onExit }: { onExit: () => void }) {
  useEffect(() => {
    const prevTitle = document.title;
    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const prevIcon = link?.href;
    document.title = 'Q4 Forecast v3 (final) - Sheet1';
    if (link) link.href = FAVICON;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); onExit(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.title = prevTitle;
      if (link && prevIcon) link.href = prevIcon;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onExit]);

  const rows = useMemo(() => {
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    return LINES.map((label, i) => {
      const base = 40000 + r() * 900000;
      const isPct = /rate|retention|Churn|coverage/.test(label);
      const vals = COLS.slice(1, 9).map((_, q) => {
        const v = base * (1 + q * 0.035 + (r() - 0.5) * 0.06);
        if (isPct) return (10 + r() * 80).toFixed(1) + '%';
        if (/Headcount|payback/.test(label)) return String(Math.round(v / 20000));
        return Math.round(v).toLocaleString('en-US');
      });
      return { label, vals, bold: /Total|margin|EBITDA|income/.test(label), i };
    });
  }, []);

  const S = {
    root: { position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', color: '#202124', font: '13px Arial, Helvetica, sans-serif', display: 'flex', flexDirection: 'column' },
    bar: { display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px', borderBottom: '1px solid #e0e0e0' },
    menu: { display: 'flex', gap: 14, padding: '2px 14px 6px', color: '#444', borderBottom: '1px solid #e0e0e0' },
    fx: { display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px', borderBottom: '1px solid #e0e0e0', color: '#555' },
    th: { background: '#f8f9fa', border: '1px solid #e2e3e3', color: '#5f6368', fontWeight: 400, padding: '3px 6px', textAlign: 'center' },
    td: { border: '1px solid #e2e3e3', padding: '3px 8px', whiteSpace: 'nowrap', textAlign: 'right' },
  } as const;

  return (
    <div style={S.root} role="presentation">
      <div style={S.bar}>
        <div style={{ width: 26, height: 30, background: '#1e7a46', borderRadius: 3 }} />
        <div>
          <div style={{ fontSize: 17 }}>Q4 Forecast v3 (final)</div>
        </div>
        <div style={{ marginLeft: 'auto', color: '#5f6368', fontSize: 12 }}>All changes saved</div>
      </div>
      <div style={S.menu}>{['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Help'].map(m => <span key={m}>{m}</span>)}</div>
      <div style={S.fx}><span style={{ width: 60, borderRight: '1px solid #e0e0e0' }}>D14</span><i style={{ fontStyle: 'italic' }}>fx</i><span>=SUM(D9:D13)-D6</span></div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 40 }} />
              {COLS.map(c => <th key={c} style={{ ...S.th, minWidth: c === 'A' ? 200 : 110 }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...S.th }}>1</td>
              <td style={{ ...S.td, textAlign: 'left', fontWeight: 700 }}>FY Plan (USD)</td>
              {['Q1 act', 'Q2 act', 'Q3 act', 'Q4 fcst', 'Q1 plan', 'Q2 plan', 'Q3 plan', 'Q4 plan'].map(h => <td key={h} style={{ ...S.td, fontWeight: 700, textAlign: 'center' }}>{h}</td>)}
              <td style={S.td} /><td style={S.td} />
            </tr>
            {rows.map(r => (
              <tr key={r.i}>
                <td style={S.th}>{r.i + 2}</td>
                <td style={{ ...S.td, textAlign: 'left', fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                {r.vals.map((v, j) => <td key={j} style={{ ...S.td, fontWeight: r.bold ? 700 : 400, outline: r.i === 12 && j === 2 ? '2px solid #1a73e8' : undefined }}>{v}</td>)}
                <td style={S.td} /><td style={S.td} />
              </tr>
            ))}
            {Array.from({ length: 14 }, (_, i) => (
              <tr key={'e' + i}><td style={S.th}>{rows.length + i + 2}</td>{COLS.map(c => <td key={c} style={S.td}>&nbsp;</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 2, padding: '4px 10px', borderTop: '1px solid #e0e0e0', background: '#f8f9fa' }}>
        {['Summary', 'Sheet1', 'Assumptions', 'Headcount'].map((t, i) => (
          <span key={t} style={{ padding: '4px 14px', background: i === 1 ? '#fff' : 'transparent', color: i === 1 ? '#188038' : '#444', fontWeight: i === 1 ? 600 : 400 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
