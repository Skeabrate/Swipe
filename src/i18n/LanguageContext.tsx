'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Language, T, translations } from './translations';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('swipe-lang') as Language | null;
    if (stored === 'en' || stored === 'pl') setLangState(stored);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('swipe-lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
