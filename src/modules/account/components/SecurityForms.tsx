'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Field, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { changeEmail, updatePassword } from '@/modules/auth/actions';

export function SecurityForms({ email }: { email: string }) {
  const { lang } = useLanguage();
  const toast = useToast();
  const ar = lang === 'ar';

  const [pwd, setPwd] = useState({ password: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [pwdPending, startPwd] = useTransition();

  const [newEmail, setNewEmail] = useState('');
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [emailPending, startEmail] = useTransition();

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    startPwd(async () => {
      const result = await updatePassword(pwd, { lang });
      if (!result.ok) {
        setPwdErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      setPwdErrors({});
      setPwd({ password: '', confirmPassword: '' });
      toast.success(
        ar
          ? 'تم تحديث كلمة المرور وإنهاء الجلسات الأخرى'
          : 'Password updated; other sessions were signed out',
      );
    });
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    startEmail(async () => {
      const result = await changeEmail({ email: newEmail }, { lang });
      if (!result.ok) {
        setEmailErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      setEmailErrors({});
      setNewEmail('');
      toast.success(result.data.notice);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={submitPassword} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">{ar ? 'تغيير كلمة المرور' : 'Change password'}</h2>
          <Field
            type="password"
            autoComplete="new-password"
            label={ar ? 'كلمة المرور الجديدة' : 'New password'}
            hint={
              ar
                ? '8 أحرف على الأقل، مع حرف كبير وصغير ورقم ورمز خاص.'
                : 'At least 8 characters with upper and lower case, a number and a symbol.'
            }
            value={pwd.password}
            error={pwdErrors.password}
            onChange={(e) => setPwd({ ...pwd, password: e.target.value })}
            required
          />
          <Field
            type="password"
            autoComplete="new-password"
            label={ar ? 'تأكيد كلمة المرور' : 'Confirm password'}
            value={pwd.confirmPassword}
            error={pwdErrors.confirmPassword}
            onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
            required
          />
          <div>
            <Button type="submit" loading={pwdPending}>
              {ar ? 'تحديث كلمة المرور' : 'Update password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={submitEmail} className="flex flex-col gap-5">
          <h2 className="text-lg font-bold">{ar ? 'تغيير البريد الإلكتروني' : 'Change email'}</h2>
          <p className="text-sm text-muted">
            {ar ? 'البريد الحالي: ' : 'Current email: '}
            <span dir="ltr">{email}</span>
          </p>
          <Field
            type="email"
            dir="ltr"
            autoComplete="email"
            label={ar ? 'البريد الجديد' : 'New email'}
            value={newEmail}
            error={emailErrors.email}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <div>
            <Button type="submit" loading={emailPending}>
              {ar ? 'إرسال رابط التأكيد' : 'Send confirmation link'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
