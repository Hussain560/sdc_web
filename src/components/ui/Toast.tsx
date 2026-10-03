'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from './cn';

type Tone = 'success' | 'info' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  tone: Tone;
  text: string;
}

interface ToastApi {
  show: (tone: Tone, text: string) => void;
  success: (text: string) => void;
  info: (text: string) => void;
  warning: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;
const DURATION: Record<Tone, number> = { success: 4500, info: 4500, warning: 7000, danger: 8000 };

// Tone drives the leading edge bar and the icon only; surface, text and border stay on semantic tokens
// so the toast follows the dark and light themes without extra rules.
const bar: Record<Tone, string> = {
  success: 'border-s-accent',
  info: 'border-s-muted',
  warning: 'border-s-warning',
  danger: 'border-s-danger',
};
const iconColor: Record<Tone, string> = {
  success: 'text-accent',
  info: 'text-muted',
  warning: 'text-warning',
  danger: 'text-danger',
};
const iconPath: Record<Tone, string> = {
  success: 'M8 12.5l3 3 5-6',
  info: 'M12 11v5M12 8h.01',
  warning: 'M12 8v5M12 16h.01',
  danger: 'M9 9l6 6M15 9l-6 6',
};

function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(DURATION[item.tone]);

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const t = setTimeout(() => onClose(item.id), left.current);
    return () => {
      clearTimeout(t);
      left.current = Math.max(1500, left.current - (Date.now() - startedAt));
    };
  }, [paused, item.id, onClose]);

  return (
    <div
      role={item.tone === 'danger' || item.tone === 'warning' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-s-4 border-line bg-surface-raised px-4 py-3 text-sm text-text shadow-lg',
        bar[item.tone],
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cn('mt-0.5 size-5 shrink-0', iconColor[item.tone])}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d={iconPath[item.tone]} />
      </svg>
      <p className="min-w-0 flex-1 wrap-break-word leading-6">{item.text}</p>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Close"
        className="-me-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

/** Action feedback toasts (top corner: left in Arabic, right in English). One provider near the root; call `useToast()` from client code. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const close = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);
  const show = useCallback((tone: Tone, text: string) => {
    setItems((p) => [...p, { id: next.current++, tone, text }].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t) => show('success', t),
      info: (t) => show('info', t),
      warning: (t) => show('warning', t),
      error: (t) => show('danger', t),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={cn(
          'sdc-inter pointer-events-none fixed top-4 z-200 flex w-[calc(100%-2rem)] flex-col gap-2 sm:w-96',
          // Arabic: top-left corner; English: top-right corner (physical, on purpose).
          lang === 'ar' ? 'left-4' : 'right-4',
        )}
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={close} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
