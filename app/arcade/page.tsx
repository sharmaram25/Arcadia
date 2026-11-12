'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Old /arcade links land on the games wall.
export default function LegacyArcade() {
  const router = useRouter();
  useEffect(() => { router.replace('/games'); }, [router]);
  return null;
}
