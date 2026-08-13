import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

describe('ThemeContext', () => {
  const TestConsumer = () => {
    const { theme, toggleTheme } = useTheme();
    return (
      <div>
        <span data-testid="theme-value">{theme}</span>
        <button onClick={toggleTheme}>toggle</button>
      </div>
    );
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
  });

  it('provides default light theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('toggles theme to dark', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('toggles theme back to light', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    
    act(() => {
      fireEvent.click(screen.getByText('toggle'));
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('saves theme to localStorage', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('toggle'));
    expect(setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('reads saved theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
});
