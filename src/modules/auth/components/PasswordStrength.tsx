'use client';

import { Check } from 'lucide-react';
import { cn } from '@/components/ui';
import { PASSWORD_REGEX } from '../schemas';

type Lang = 'ar' | 'en';

const RULES = [
  {
    key: 'length',
    test: (v: string) => v.length >= 8,
    ar: '8 أحرف على الأقل',
    en: 'At least 8 characters',
  },
  {
    key: 'case',
    test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v),
    ar: 'حرف كبير وحرف صغير',
    en: 'An uppercase and a lowercase letter',
  },
  { key: 'digit', test: (v: string) => /\d/.test(v), ar: 'رقم واحد على الأقل', en: 'A number' },
  {
    key: 'symbol',
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
    ar: 'رمز خاص مثل ! أو @',
    en: 'A symbol such as ! or @',
  },
] as const;

/** True when the password meets every rule the account enforces (the same expression the server checks). */
export const passwordMeetsPolicy = (v: string) => PASSWORD_REGEX.test(v);

/**
 * The password policy as a live checklist with a four-part strength bar (ACC-009). Nothing here is stricter than the
 * server: the bar fills as rules are met, and the list says which one is still missing.
 */
export function PasswordStrength({ value, lang }: { value: string; lang: Lang }) {
  const ar = lang === 'ar';
  const met = RULES.filter((r) => r.test(value)).length;
  const level = value.length === 0 ? 0 : met;
  const tone =
    level <= 1 ? 'bg-danger' : level === 2 ? 'bg-warning' : level === 3 ? 'bg-info' : 'bg-success';
  const word =
    level === 0
      ? ''
      : level <= 1
        ? ar
          ? 'ضعيفة'
          : 'Weak'
        : level === 2
          ? ar
            ? 'مقبولة'
            : 'Fair'
          : level === 3
            ? ar
              ? 'جيدة'
              : 'Good'
            : ar
              ? 'قوية'
              : 'Strong';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={cn(
                'h-1.5 rounded-full transition-colors duration-300',
                n <= level ? tone : 'bg-line',
              )}
            />
          ))}
        </div>
        <span aria-live="polite" className="min-w-12 text-sm font-semibold text-muted">
          {word}
        </span>
      </div>
      <ul
        className="flex flex-col gap-1.5 text-sm"
        aria-label={ar ? 'شروط كلمة المرور' : 'Password rules'}
      >
        {RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li
              key={r.key}
              className={cn('flex items-center gap-2', ok ? 'text-text' : 'text-muted')}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
                  ok ? 'border-transparent bg-success text-on-accent' : 'border-line-strong',
                )}
              >
                {ok && <Check size={12} strokeWidth={3} />}
              </span>
              {ar ? r.ar : r.en}
              <span className="sr-only">
                {ok ? (ar ? ' (متحقق)' : ' (met)') : ar ? ' (غير متحقق)' : ' (not met)'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
