import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Press_Start_2P } from 'next/font/google';
import './globals.css';

// Geist for the interface, Press Start 2P only where an arcade cabinet would use it.
const pixel = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel', display: 'swap' });
const code = Geist_Mono({ subsets: ['latin'], variable: '--font-code', display: 'swap' });
const ui = Geist({ subsets: ['latin'], variable: '--font-ui', display: 'swap' });

export const metadata: Metadata = {
  title: 'Arcadia — 29 arcade games in your browser tab',
  description: 'A free, instant browser arcade. 29 games, no installs, no sign-up, no sound until you want it — and a boss key for when you need it.',
  applicationName: 'Arcadia',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Arcadia — the browser arcade',
    description: '29 instant arcade games. Daily challenge, high-score tables, a boss key.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${code.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
