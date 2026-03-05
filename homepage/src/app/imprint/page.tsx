'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Language = 'en' | 'de';

function detectSystemLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('de') ? 'de' : 'en';
}

export default function ImprintPage() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = (localStorage.getItem('preferred-language') as Language) || detectSystemLanguage();
    setLanguage(savedLang);
    document.documentElement.lang = savedLang;
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-32">
        <div className="space-y-8">
          <div className="border-b border-navy/20 pb-6 flex items-center justify-between">
            <h1 className="text-xl font-season text-navy">{language === 'de' ? 'Impressum' : 'Imprint'}</h1>
            <Link href="/" className="text-xs text-navy-muted hover:text-navy transition-colors font-dm-mono">
              {language === 'de' ? 'Zurück' : 'Back'}
            </Link>
          </div>

          <div className="text-sm leading-relaxed space-y-4 text-navy font-dm-mono">
            <div>
              <p className="font-semibold">{language === 'de' ? 'Angaben gemäß § 5 TMG' : 'Provider as per § 5 TMG (Germany)'}</p>
              <p>Dominique Paul</p>
              <p>Marienburger Straße 49</p>
              <p>50968 Cologne</p>
              <p>Germany</p>
            </div>

            <div>
              <p className="font-semibold">{language === 'de' ? 'Kontakt' : 'Contact'}</p>
              <p>E-Mail: team@dream-machines.eu</p>
            </div>

            <div>
              <p className="font-semibold">{language === 'de' ? 'Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV' : 'Responsible for content according to § 55 para. 2 RStV'}</p>
              <p>Dominique Paul {language === 'de' ? '(Anschrift wie oben)' : '(Address as above)'}</p>
            </div>

            <div className="text-[11px] text-navy-muted">
              <p>
                {language === 'de'
                  ? 'Hinweis: Dream Machines ist derzeit eine Marke, keine eingetragene Gesellschaft.'
                  : 'Note: Dream Machines is currently a brand name, not an incorporated entity.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


