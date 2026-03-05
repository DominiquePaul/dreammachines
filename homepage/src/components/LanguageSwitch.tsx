'use client';

import { useEffect, useState } from 'react';

interface LanguageSwitchProps {
  currentLanguage: 'en' | 'de';
  onLanguageChange: (language: 'en' | 'de') => void;
}

export default function LanguageSwitch({ currentLanguage, onLanguageChange }: LanguageSwitchProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === 'en' ? 'de' : 'en';
    onLanguageChange(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
  };

  if (!mounted) {
    return <div className="w-16 h-8" />;
  }

  return (
    <button
      onClick={handleLanguageToggle}
      aria-label={`Switch to ${currentLanguage === 'en' ? 'German' : 'English'}`}
      className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200"
    >
      <span className={currentLanguage === 'en' ? 'text-blue-700' : 'text-neutral-500'}>
        EN
      </span>
      <span className="text-neutral-300">|</span>
      <span className={currentLanguage === 'de' ? 'text-blue-700' : 'text-neutral-500'}>
        DE
      </span>
    </button>
  );
}