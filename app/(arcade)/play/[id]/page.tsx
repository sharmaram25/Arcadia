import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GAMES, GAME_BY_ID } from '@/arcade/catalog';
import PlayView from '@/components/arcade/PlayView';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'daily' }, ...GAMES.map(g => ({ id: g.id }))];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (id === 'daily') return { title: 'Daily challenge — Arcadia' };
  const g = GAME_BY_ID[id];
  return g ? { title: `${g.title} — Play free in your browser · Arcadia`, description: `${g.tagline} ${g.how}` } : {};
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== 'daily' && !GAME_BY_ID[id]) notFound();
  return <PlayView id={id} />;
}
