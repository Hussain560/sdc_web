'use client';

import { CircleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

/**
 * The membership screens when a page cannot load (design: "الحالات · خطأ"): one icon, one sentence that says nothing
 * was changed, one way forward.
 */
export default function MembershipError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  useEffect(() => {
    console.error('[membership] page failed', error.digest ?? error.message);
  }, [error]);
  return (
    <section
      role="alert"
      className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-shape-xl border border-line bg-surface p-10 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-20 items-center justify-center rounded-full bg-danger-soft text-danger"
      >
        <CircleAlert size={34} />
      </span>
      <h1 className="text-xl font-extrabold">
        {ar ? 'تعذّر تحميل الصفحة' : 'The page could not load'}
      </h1>
      <p className="text-muted">
        {ar ? 'لم يتغيّر أي شيء. حاول مرة أخرى.' : 'Nothing was changed. Try again.'}
      </p>
      <Button variant="secondary" onClick={reset}>
        {ar ? 'إعادة المحاولة' : 'Try again'}
      </Button>
    </section>
  );
}
