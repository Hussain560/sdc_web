'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from './cn';
import { useToast } from './Toast';

/**
 * Downloads a CSV from an API route. Blocks repeat clicks until the file arrives and reports the result
 * with a toast (the route is permission-checked and audited server-side).
 */
export function ExportButton({ href, filename }: { href: string; filename: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(href, { credentials: 'same-origin' });
      if (res.status === 401 || res.status === 403) throw new Error('DENIED');
      if (!res.ok) throw new Error('FAILED');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success(ar ? 'تم تنزيل ملف CSV.' : 'CSV downloaded.');
    } catch (e) {
      const denied = e instanceof Error && e.message === 'DENIED';
      toast.error(
        denied
          ? ar
            ? 'ليست لديك صلاحية التصدير.'
            : 'You do not have permission to export.'
          : ar
            ? 'تعذّر تنزيل الملف. حاول مرة أخرى.'
            : 'Could not download the file. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-line-accent px-5 text-sm font-semibold text-accent transition-colors hover:bg-surface-raised',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-wait disabled:opacity-60',
      )}
    >
      {busy && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {busy ? (ar ? 'جارٍ التجهيز…' : 'Preparing…') : ar ? 'تصدير CSV' : 'Export CSV'}
    </button>
  );
}
