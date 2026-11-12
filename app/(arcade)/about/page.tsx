import type { Metadata } from 'next';
import AboutView from '@/components/arcade/AboutView';

export const metadata: Metadata = { title: 'About — Arcadia', description: 'Why Arcadia exists, how it is built, and how to play it at the office.' };

export default function AboutPage() {
  return <AboutView />;
}
