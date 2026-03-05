'use client';

import { useEffect, useState } from 'react';

type Language = 'en' | 'de';

function detectSystemLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('de') ? 'de' : 'en';
}

export default function FooterImprintLink() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = (localStorage.getItem('preferred-language') as Language) || detectSystemLanguage();
    setLanguage(savedLang);
  }, []);

  const label = language === 'de' ? 'Impressum' : 'Imprint';

  return (
    <a
      href="/imprint"
      className="text-sm lg:text-base leading-[1.3] text-navy-muted hover:text-navy transition-colors font-dm-mono"
      aria-label={label}
    >
      {label}
    </a>
  );
}


