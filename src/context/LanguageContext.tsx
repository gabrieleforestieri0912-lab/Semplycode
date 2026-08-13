'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextValue {
  language: 'it' | 'en';
  toggleLanguage: (lang: 'it' | 'en') => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<'it' | 'en'>('it');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang === 'en' || savedLang === 'it') {
      setLanguage(savedLang);
    }
    document.documentElement.lang = savedLang === 'en' ? 'en' : 'it';
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
