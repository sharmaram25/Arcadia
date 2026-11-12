import type { Metadata } from 'next';
import GamesView from '@/components/arcade/GamesView';

export const metadata: Metadata = { title: 'All games — Arcadia', description: 'Browse every Arcadia cabinet: golden-age arcade genres, instantly playable in your browser.' };

export default function GamesPage() {
  return <GamesView />;
}
