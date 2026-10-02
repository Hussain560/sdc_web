import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

function Probe() {
  const { lang, t, toggleLanguage } = useLanguage();
  return (
    <button onClick={toggleLanguage}>
      {lang}:{t('definitely_missing_key')}
    </button>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to Arabic, RTL', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByRole('button').textContent).toContain('ar:');
  });

  it('falls back to the key when a translation is missing', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('ar:definitely_missing_key');
  });

  it('toggles to English, flips dir and persists', async () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button'));
    });
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('app_lang')).toBe('en');
  });

  it('throws outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/LanguageProvider/);
  });
});
