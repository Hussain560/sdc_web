'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

/** A small button that copies a value (an e-mail, a phone, a reference) and says so, for the dashboard's read screens. */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.info(lang === 'ar' ? 'تم النسخ.' : 'Copied.');
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error(lang === 'ar' ? 'تعذّر النسخ.' : 'Could not copy.');
        }
      }}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring',
        className,
      )}
    >
      {done ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  );
}
