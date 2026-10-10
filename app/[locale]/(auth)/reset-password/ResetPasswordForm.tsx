'use client';

import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, LinkButton, PasswordField } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { updatePassword } from '@/modules/auth/actions';
import { AuthHeading } from '@/modules/auth/components/AuthShell';
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
}: {
  hasSession: boolean;
  welcome?: boolean;
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
    const result = await updatePassword({ password, confirmPassword }, { lang, endSession: true });
    setLoading(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.replace('/login');
      router.refresh();
    }, 3000);
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
    <>
      <AuthHeading
        title={welcome ? s.titleWelcome : s.title}
        lede={welcome ? s.ledeWelcome : s.lede}
      />
      {formError && <Alert tone="danger">{formError}</Alert>}
      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5">
        <PasswordField
          label={s.newPassword}
          name="password"
          autoComplete="new-password"
          showLabel={s.show}
          hideLabel={s.hide}
          hint={s.hint}
          error={errors.password}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label={s.confirm}
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
          {loading ? s.submitting : s.submit}
        </Button>
      </form>
    </>
  );
}
