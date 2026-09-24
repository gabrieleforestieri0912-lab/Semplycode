'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextValue {
  language: 'it' | 'en';
  toggleLanguage: (lang: 'it' | 'en') => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/** Rileva la lingua preferita del browser e la mappa a 'it' o 'en'. */
function detectBrowserLanguage(): 'it' | 'en' {
  if (typeof navigator === 'undefined') return 'it';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const code = l.toLowerCase().split('-')[0];
    if (code === 'it') return 'it';
    if (code === 'en') return 'en';
  }
  // Se la lingua del browser non è né it né en, usa l'inglese come lingua internazionale
  return 'en';
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<'it' | 'en'>('it');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'it') {
      // Preferenza salvata dall'utente: ha priorità assoluta
      setLanguage(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      // Prima visita: rileva automaticamente la lingua del browser
      const detected = detectBrowserLanguage();
      setLanguage(detected);
      document.documentElement.lang = detected;
      // Non salvare in localStorage: così se l'utente cambia browser lang
      // viene sempre rispettata finché non fa una scelta esplicita.
    }
  }, []);

  const toggleLanguage = (lang: 'it' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
