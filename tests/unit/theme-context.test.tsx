import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe('ThemeContext', () => {
  beforeEach(() => localStorage.clear());

  it('is dark by default (D-009: dark-first)', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('dark');
  });

  it('restores a saved light choice', async () => {
    localStorage.setItem('sdc_theme', 'light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(await screen.findByText('light')).toBeTruthy();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles and persists', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button'));
    });
    expect(localStorage.getItem('sdc_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
