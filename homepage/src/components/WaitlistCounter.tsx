'use client';

import { useEffect, useState, useCallback } from 'react';

const labels = {
  en: 'Companies on the waitlist',
  de: 'Unternehmen auf der Warteliste',
};

export default function WaitlistCounter({ language = 'en' }: { language?: 'en' | 'de' }) {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/waitlist-count');
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch {
      // Silently fail - component won't render if count unavailable
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Re-fetch when a new signup happens
  useEffect(() => {
    const handler = () => fetchCount();
    window.addEventListener('waitlist-updated', handler);
    return () => window.removeEventListener('waitlist-updated', handler);
  }, [fetchCount]);

  if (count === null || count === 0) return null;

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-navy/10">
        <span className="block w-1 h-1 rounded-full bg-navy" />
        <span className="font-dm-mono text-sm font-medium text-navy uppercase leading-none tracking-wide">
          {count} {labels[language]}
        </span>
      </div>
    </div>
  );
}
