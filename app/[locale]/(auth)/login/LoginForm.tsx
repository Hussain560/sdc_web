'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button, Field, PasswordField, TextLink, useToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import type { ErrorCode } from '@/lib/result';
import { AuthHeading } from '@/modules/auth/components/AuthShell';
import { resendConfirmation, signIn } from '@/modules/auth/actions';

const TEXT = {
  ar: {
    title: 'مرحباً بعودتك',
    lede: 'سجّل الدخول بحساب العضوية.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    show: 'إظهار كلمة المرور',
    hide: 'إخفاء كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'دخول',
    submitting: 'جارٍ التحقق…',
    notMember: 'لست عضواً بعد؟',
    apply: 'قدّم طلب العضوية',
    back: 'العودة إلى الرئيسية',
    resend: 'أعد إرسال رابط التفعيل',
  },
  en: {
    title: 'Welcome back',
    lede: 'Sign in with your membership account.',
    email: 'E-mail',
    password: 'Password',
    show: 'Show password',
    hide: 'Hide password',
    forgot: 'Forgot your password?',
    submit: 'Sign in',
    submitting: 'Verifying…',
    notMember: 'Not a member yet?',
    apply: 'Apply for membership',
    back: 'Back to home',
    resend: 'Resend the activation link',
  },
} as const;

export default function LoginForm({
  redirectTo,
  initialError,
}: {
  redirectTo: string;
  initialError?: string;
}) {
  const { lang } = useLanguage();
  const s = TEXT[lang];
  const toast = useToast();
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<{ code: ErrorCode; message: string } | null>(
    initialError ? { code: 'LINK_EXPIRED', message: initialError } : null,
  );
  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;
  const Forward = lang === 'ar' ? ArrowLeft : ArrowRight;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setProblem(null);
    const result = await signIn(form, { lang, redirect: redirectTo });
    if (!result.ok) {
      setLoading(false);
      setProblem({ code: result.code, message: result.message });
      return;
    }
    await refresh();
    // No router.refresh() here: it would re-run the (now signed-in) /login page and race the navigation.
    router.replace(result.data.redirectTo);
  }

  async function onResend() {
    const result = await resendConfirmation({ email: form.email }, { lang });
    if (result.ok) toast.success(result.data.notice);
    else toast.error(result.message);
  }

  const tone =
    problem?.code === 'EMAIL_NOT_CONFIRMED' || problem?.code === 'LINK_EXPIRED'
      ? 'info'
      : problem?.code === 'RATE_LIMITED'
        ? 'warning'
        : 'danger';

  return (
    <>
      <AuthHeading title={s.title} lede={s.lede} />

      {problem && (
        <Alert
          tone={tone}
          action={
            problem.code === 'EMAIL_NOT_CONFIRMED' ? (
              <button type="button" className="underline underline-offset-[3px]" onClick={onResend}>
                {s.resend}
              </button>
            ) : undefined
          }
        >
          {problem.message}
        </Alert>
      )}

      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field
          label={s.email}
          name="email"
          type="email"
          autoComplete="username"
          required
          readOnly={loading}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <PasswordField
          label={s.password}
          name="password"
          autoComplete="current-password"
          showLabel={s.show}
          hideLabel={s.hide}
          required
          readOnly={loading}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div>
          <TextLink href="/forgot-password" variant="standalone">
            {s.forgot}
          </TextLink>
        </div>
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? s.submitting : s.submit}
        </Button>
      </form>

      <div className="flex flex-col items-start gap-1">
        <p className="t-body-sm text-muted">
          {s.notMember}{' '}
          <TextLink href="/join" variant="standalone">
            {s.apply}
            <Forward aria-hidden="true" className="size-4" />
          </TextLink>
        </p>
        <TextLink href="/" variant="standalone" className="min-h-11 text-muted">
          <Back aria-hidden="true" className="size-4" />
          {s.back}
        </TextLink>
      </div>
    </>
  );
}
