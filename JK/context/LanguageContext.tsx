'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types';
import { translations } from '@/lib/translations';

interface LanguageContextType {
  lang: Language;
  dir: 'rtl' | 'ltr';
  setLang: (l: Language) => void;
  toggleLang: () => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ur'); // Default to Urdu for authentic Pakistani merchant experience

  useEffect(() => {
    const saved = localStorage.getItem('jk_lang') as Language;
    if (saved === 'en' || saved === 'ur') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('jk_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'ur' ? 'en' : 'ur');
  };

  const dir = lang === 'ur' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    if (lang === 'ur') {
      document.documentElement.classList.add('font-nastaliq');
      document.documentElement.classList.remove('font-sans');
    } else {
      document.documentElement.classList.add('font-sans');
      document.documentElement.classList.remove('font-nastaliq');
    }
  }, [lang, dir]);

  const t = (key: keyof typeof translations.en): string => {
    const langDict = translations[lang];
    if (langDict && (langDict as any)[key]) {
      return (langDict as any)[key];
    }
    return translations.en[key] || (key as string);
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
