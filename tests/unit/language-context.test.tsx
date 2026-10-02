import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';

const replace = vi.fn();
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/events',
}));

function Probe() {
  const { lang, t, toggleLanguage } = useLanguage();
  return (
    <button onClick={toggleLanguage}>
      {lang}:{t('definitely_missing_key')}
    </button>
  );
}

describe('LanguageContext (locale comes from the URL — ADR-010)', () => {
  beforeEach(() => replace.mockClear());

  it('exposes the locale it is given', () => {
    render(
      <LanguageProvider locale="en">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole('button').textContent).toContain('en:');
  });

  it('falls back to the key when a translation is missing', () => {
    render(
      <LanguageProvider locale="ar">
        <Probe />
      </LanguageProvider>,
    );
    expect(screen.getByRole('button').textContent).toBe('ar:definitely_missing_key');
  });

  it('toggling navigates to the same path in the other locale', async () => {
    render(
      <LanguageProvider locale="ar">
        <Probe />
      </LanguageProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(replace).toHaveBeenCalledWith('/events', { locale: 'en' });
  });

  it('throws outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/LanguageProvider/);
  });
});
