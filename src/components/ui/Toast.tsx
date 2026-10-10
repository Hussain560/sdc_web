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
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from './cn';

type Tone = 'success' | 'info' | 'warning' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  tone: Tone;
  text: string;
  action?: ToastAction;
}

interface ToastApi {
  show: (tone: Tone, text: string, action?: ToastAction) => void;
  success: (text: string, action?: ToastAction) => void;
  info: (text: string) => void;
  warning: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 4;
const DURATION: Record<Tone, number> = { success: 5000, info: 5000, warning: 7000, danger: 8000 };

// Tone drives the icon only (components §6.4); surface, text and border stay on semantic tokens so the toast
// follows both themes without extra rules.
const iconColor: Record<Tone, string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
};
const ICON: Record<Tone, LucideIcon> = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
};

function ToastCard({
  item,
  onClose,
  closeLabel,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
  closeLabel: string;
}) {
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

  const Icon = ICON[item.tone];
  return (
    <div
      role={item.tone === 'danger' || item.tone === 'warning' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-shape-lg border border-line bg-surface-overlay px-4 py-3 text-sm text-text shadow-elev-3"
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', iconColor[item.tone])} />
      <p className="min-w-0 flex-1 wrap-break-word leading-6">{item.text}</p>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onClose(item.id);
          }}
          className="shrink-0 rounded-full px-2 font-semibold text-accent-text underline-offset-[3px] hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label={closeLabel}
        className="-me-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

/** Action feedback toasts (bottom-centre on phones, bottom inline-end on desktop). One provider near the root; call `useToast()` from client code. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const close = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);
  const show = useCallback((tone: Tone, text: string, action?: ToastAction) => {
    setItems((p) => [...p, { id: next.current++, tone, text, action }].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t, a) => show('success', t, a),
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
        className="sdc-inter pointer-events-none fixed inset-x-4 bottom-4 z-(--z-toast) mx-auto flex flex-col gap-2 sm:inset-x-auto sm:end-4 sm:mx-0 sm:w-96"
      >
        {items.map((t) => (
          <ToastCard
            key={t.id}
            item={t}
            onClose={close}
            closeLabel={lang === 'ar' ? 'إغلاق' : 'Close'}
          />
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
