'use client';

import { Check, CircleCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, LinkButton, PasswordField, TextLink } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { updatePassword } from '@/modules/auth/actions';
import { AuthHeading } from '@/modules/auth/components/AuthShell';
import { PasswordStrength } from '@/modules/auth/components/PasswordStrength';
import { fieldErrorsOf, updatePasswordSchema } from '@/modules/auth/schemas';

const TEXT = {
  ar: {
    title: 'تعيين كلمة مرور جديدة',
    titleWelcome: 'اختر كلمة مرور لحسابك',
    lede: 'أدخل كلمة المرور الجديدة لإكمال إعادة التعيين.',
    ledeWelcome: 'أهلاً بك في المجتمع! اختر كلمة مرور لتفعيل حسابك في بوابة الأعضاء.',
    newPassword: 'كلمة المرور الجديدة',
    confirm: 'تأكيد كلمة المرور الجديدة',
    show: 'إظهار كلمة المرور',
    hide: 'إخفاء كلمة المرور',
    hint: 'ثمانية أحرف على الأقل، وتشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً خاصاً.',
    submit: 'تحديث كلمة المرور',
    submitting: 'جارٍ التحديث…',
    review: 'يرجى مراجعة الحقول.',
    okTitle: 'تم تعيين كلمة المرور',
    okBody: 'تم تحديث كلمة المرور بنجاح.',
    signIn: 'دخول',
    expiredTitle: 'انتهت صلاحية الرابط',
    expiredBody: 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته.',
    request: 'اطلب رابطاً جديداً',
    accepted: 'قُبلت عضويتك',
    welcomeTitle: (n: string) => (n ? `أهلاً ${n}، لنفعّل حسابك` : 'لنفعّل حسابك'),
    welcomeFor: (e: string) => `اختر كلمة مرور لحساب ${e}`,
    passwordLabel: 'كلمة المرور',
    again: 'أعد كتابتها',
    activate: 'فعّل حسابي',
    readyTitle: 'حسابك جاهز',
    readyBody: 'أصبحت عضواً في المجتمع. لنأخذ دقيقتين لنجهّز ملفك.',
    start: 'لنبدأ',
    later: 'لاحقاً، خذني إلى حسابي',
  },
  en: {
    title: 'Set a new password',
    titleWelcome: 'Choose a password for your account',
    lede: 'Enter the new password to complete the reset.',
    ledeWelcome:
      'Welcome to the community! Choose a password to activate your members portal account.',
    newPassword: 'New password',
    confirm: 'Confirm the new password',
    show: 'Show password',
    hide: 'Hide password',
    hint: 'At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol.',
    submit: 'Update password',
    submitting: 'Updating…',
    review: 'Please review the fields.',
    okTitle: 'Your password is set',
    okBody: 'Password updated successfully.',
    signIn: 'Sign in',
    expiredTitle: 'This link has expired',
    expiredBody: 'The reset link is invalid or has expired.',
    request: 'Request a new link',
    accepted: 'Your membership is accepted',
    welcomeTitle: (n: string) =>
      n ? `Welcome ${n}, let’s activate your account` : 'Let’s activate your account',
    welcomeFor: (e: string) => `Choose a password for ${e}`,
    passwordLabel: 'Password',
    again: 'Type it again',
    activate: 'Activate my account',
    readyTitle: 'Your account is ready',
    readyBody: 'You are a member of the community. Let’s take two minutes to set up your profile.',
    start: 'Let’s start',
    later: 'Later, take me to my account',
  },
} as const;

/** A result block: one icon, one title (focused), one sentence, one action (patterns §13). */
function Result({
  tone,
  title,
  body,
  action,
}: {
  tone: 'success' | 'warning';
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const Icon = tone === 'success' ? CircleCheck : TriangleAlert;
  return (
    <div role={tone === 'warning' ? 'alert' : 'status'} className="flex flex-col items-start gap-4">
      <span
        aria-hidden="true"
        className={`flex size-14 items-center justify-center rounded-full ${
          tone === 'success' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
        }`}
      >
        <Icon className="size-7" />
      </span>
      <h1 ref={ref} tabIndex={-1} className="t-h1 focus-visible:outline-none">
        {title}
      </h1>
      <p className="t-lede text-muted">{body}</p>
      {action}
    </div>
  );
}

export default function ResetPasswordForm({
  hasSession,
  welcome = false,
  name = '',
  email = '',
}: {
  hasSession: boolean;
  welcome?: boolean;
  name?: string;
  email?: string;
}) {
  const { lang } = useLanguage();
  const s = TEXT[lang];
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const parsed = updatePasswordSchema(lang).safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      setFormError(s.review);
      return;
    }
    setErrors({});
    setLoading(true);
    // endSession: the recovery session ends so the user signs in with the new password.
    const result = await updatePassword(
      { password, confirmPassword },
      // A new member goes straight on to the set-up; a reset ends the recovery session so they sign in again.
      { lang, endSession: !welcome },
    );
    setLoading(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      return;
    }
    setDone(true);
    if (!welcome)
      setTimeout(() => {
        router.replace('/login');
        router.refresh();
      }, 3000);
  }

  if (done && welcome) {
    return (
      <div
        role="status"
        className="m-pop flex flex-col items-center gap-4 rounded-shape-2xl bg-accent-soft p-8 text-center"
      >
        <span
          aria-hidden="true"
          className="flex size-20 items-center justify-center rounded-full bg-accent text-on-accent"
        >
          <Check size={36} />
        </span>
        <h1 className="t-h1">{s.readyTitle}</h1>
        <p className="t-lede text-muted">{s.readyBody}</p>
        <LinkButton href="/welcome" size="lg">
          {s.start}
        </LinkButton>
        <TextLink href="/account/membership">{s.later}</TextLink>
      </div>
    );
  }

  if (done) {
    return (
      <Result
        tone="success"
        title={s.okTitle}
        body={s.okBody}
        action={
          <LinkButton href="/login" size="lg" fullWidth>
            {s.signIn}
          </LinkButton>
        }
      />
    );
  }

  if (!hasSession) {
    return (
      <Result
        tone="warning"
        title={s.expiredTitle}
        body={s.expiredBody}
        action={
          <LinkButton href="/forgot-password" size="lg" fullWidth>
            {s.request}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div
      className={
        welcome
          ? 'flex flex-col gap-5 rounded-shape-2xl border border-line bg-surface p-6 md:p-8'
          : 'flex flex-col gap-6'
      }
    >
      {welcome && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-text">
          <Check size={14} aria-hidden="true" />
          {s.accepted}
        </span>
      )}
      <AuthHeading
        title={welcome ? s.welcomeTitle(name) : s.title}
        lede={welcome ? s.welcomeFor(email) : s.lede}
      />
      {formError && <Alert tone="danger">{formError}</Alert>}
      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5">
        <PasswordField
          label={welcome ? s.passwordLabel : s.newPassword}
          name="password"
          autoComplete="new-password"
          showLabel={s.show}
          hideLabel={s.hide}
          error={errors.password}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength value={password} lang={lang} />
        <PasswordField
          label={welcome ? s.again : s.confirm}
          name="confirmPassword"
          autoComplete="new-password"
          showLabel={s.show}
          hideLabel={s.hide}
          error={errors.confirmPassword}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button type="submit" size="lg" fullWidth loading={loading}>
          {loading ? s.submitting : welcome ? s.activate : s.submit}
        </Button>
      </form>
    </div>
  );
}
