import type { Metadata } from 'next';
import HallView from '@/components/arcade/HallView';

export const metadata: Metadata = { title: 'Hall of Fame — Arcadia' };

export default function HallPage() {
  return <HallView />;
}
