import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

describe('LanguageContext', () => {
  const TestConsumer = () => {
    const { language, toggleLanguage } = useLanguage();
    return (
      <div>
        <span data-testid="lang-value">{language}</span>
        <button onClick={() => toggleLanguage('en')}>en</button>
        <button onClick={() => toggleLanguage('it')}>it</button>
      </div>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.lang = 'it';
  });

  it('provides default italian language', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang-value').textContent).toBe('it');
  });

  it('toggles language to english', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('lang-value').textContent).toBe('en');
  });

  it('toggles language back to italian', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('en'));
    expect(screen.getByTestId('lang-value').textContent).toBe('en');
    fireEvent.click(screen.getByText('it'));
    expect(screen.getByTestId('lang-value').textContent).toBe('it');
  });

  it('saves language to localStorage', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('en'));
    expect(setItem).toHaveBeenCalledWith('language', 'en');
    setItem.mockRestore();
  });

  it('reads saved language from localStorage on mount', () => {
    localStorage.setItem('language', 'en');

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang-value').textContent).toBe('en');
  });

  it('ignores invalid language values from localStorage', () => {
    localStorage.setItem('language', 'fr');

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang-value').textContent).toBe('it');
  });

  it('updates document lang attribute when language changes', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(document.documentElement.lang).toBe('it');
    fireEvent.click(screen.getByText('en'));
    expect(document.documentElement.lang).toBe('en');
    fireEvent.click(screen.getByText('it'));
    expect(document.documentElement.lang).toBe('it');
  });
});
