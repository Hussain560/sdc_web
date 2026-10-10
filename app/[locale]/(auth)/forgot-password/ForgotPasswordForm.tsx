'use client';

import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Field, TextLink } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { requestPasswordReset } from '@/modules/auth/actions';
import { AuthHeading } from '@/modules/auth/components/AuthShell';

const RESEND_AFTER = 60;

const TEXT = {
  ar: {
    title: 'نسيت كلمة المرور؟',
    lede: 'أدخل بريدك وسنرسل لك رابطاً لتعيين كلمة جديدة.',
    email: 'البريد الإلكتروني',
    submit: 'أرسل الرابط',
    submitting: 'جارٍ الإرسال…',
    back: 'العودة لتسجيل الدخول',
    sentTitle: 'تفقّد بريدك',
    resend: 'أعد الإرسال',
    resendIn: (n: number) => `أعد الإرسال بعد ${n} ثانية`,
  },
  en: {
    title: 'Forgot your password?',
    lede: "Enter your e-mail and we'll send you a link to set a new one.",
    email: 'E-mail',
    submit: 'Send the link',
    submitting: 'Sending…',
    back: 'Back to sign in',
    sentTitle: 'Check your inbox',
    resend: 'Resend',
    resendIn: (n: number) => `Resend in ${n} s`,
  },
} as const;

export default function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const { lang } = useLanguage();
  const s = TEXT[lang];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [wait, setWait] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const Back = lang === 'ar' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (notice) titleRef.current?.focus();
  }, [notice]);

  async function send() {
    setLoading(true);
    setError(null);
    const result = await requestPasswordReset({ email }, { lang });
    setLoading(false);
    if (!result.ok) {
      setError(Object.values(result.fieldErrors ?? {})[0] ?? result.message);
      return;
    }
    // Same answer whether or not the e-mail has an account (no enumeration).
    setNotice(result.data.notice);
    setWait(RESEND_AFTER);
  }

  if (notice) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-info-soft text-info"
        >
          <Mail className="size-7" />
        </span>
        <h1 ref={titleRef} tabIndex={-1} className="t-h1 focus-visible:outline-none">
          {s.sentTitle}
        </h1>
        <p className="t-lede text-muted">{notice}</p>
        <Button variant="secondary" disabled={wait > 0} loading={loading} onClick={send}>
          {wait > 0 ? s.resendIn(wait) : s.resend}
        </Button>
        <TextLink href="/login" variant="standalone" className="min-h-11">
          <Back aria-hidden="true" className="size-4" />
          {s.back}
        </TextLink>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title={s.title} lede={s.lede} />
      {error && <Alert tone="warning">{error}</Alert>}
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex flex-col gap-5"
      >
        <Field
          label={s.email}
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? s.submitting : s.submit}
        </Button>
      </form>
      <TextLink href="/login" variant="standalone" className="min-h-11">
        <Back aria-hidden="true" className="size-4" />
        {s.back}
      </TextLink>
    </>
  );
}
