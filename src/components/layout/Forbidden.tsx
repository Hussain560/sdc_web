import { ShieldAlert } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * 403 view rendered inside the shell for permission-gated routes (INTERNAL-SCREENS/03 §5).
 * Never names the missing permission. Records outside a user's scope use notFound() instead.
 */
export async function Forbidden() {
  const ar = (await getLocale()) === 'ar';
  return (
    <section
      role="alert"
      className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-4 rounded-shape-xl border border-line bg-surface p-10 text-center"
    >
      <ShieldAlert size={40} className="text-accent" aria-hidden="true" />
      <h1 className="text-xl font-bold">
        {ar ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة' : "You don't have access to this page"}
      </h1>
      <p className="text-muted">
        {ar
          ? 'إذا كنت تعتقد أن هذا خطأ، تواصل مع قيادة المجتمع.'
          : 'If you think this is a mistake, contact the community leadership.'}
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          {ar ? 'العودة إلى لوحة التحكم' : 'Back to dashboard'}
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line-accent px-5 py-2 text-sm font-semibold text-accent"
        >
          {ar ? 'الموقع العام' : 'Public site'}
        </Link>
      </div>
    </section>
  );
}
