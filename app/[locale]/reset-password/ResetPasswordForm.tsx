'use client';

import { useToast } from '@/components/ui';
import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { updatePassword } from '@/modules/auth/actions';
import { updatePasswordSchema, fieldErrorsOf } from '@/modules/auth/schemas';
import '../login/login.css';

export default function ResetPasswordForm({
  hasSession,
  welcome = false,
}: {
  hasSession: boolean;
  welcome?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { lang } = useLanguage();
  const toast = useToast();
  const isEnglish = lang === 'en';
  const router = useRouter();

  const passwordHint = isEnglish
    ? 'At least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccess(false);

    const parsed = updatePasswordSchema(lang).safeParse({ password, confirmPassword });
    if (!parsed.success) {
      toast.error(
        Object.values(fieldErrorsOf(parsed.error))[0] ??
          (isEnglish ? 'Please review the fields.' : 'يرجى مراجعة الحقول.'),
      );
      return;
    }

    setLoading(true);
    // endSession: the recovery session ends so the user signs in with the new password.
    const result = await updatePassword({ password, confirmPassword }, { lang, endSession: true });
    setLoading(false);

    if (!result.ok) {
      toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.message);
      return;
    }

    setShowSuccess(true);
    toast.success(isEnglish ? 'Password updated.' : 'تم تحديث كلمة المرور.');
    setTimeout(() => {
      router.replace('/login');
      router.refresh();
    }, 3000);
  };

  return (
    <div className="sdc-login-page-wrapper">
      <Header />

      <main className="sdc-login-main">
        <div className="sdc-login-card">
          <div className="sdc-login-header">
            <h1 className="sdc-login-title">
              {welcome
                ? isEnglish
                  ? 'Activate your account'
                  : 'تفعيل حسابك'
                : isEnglish
                  ? 'Reset Password'
                  : 'تعيين كلمة مرور جديدة'}
            </h1>
            <p className="sdc-login-subtitle">
              {welcome
                ? isEnglish
                  ? 'Welcome to the community! Choose a password to activate your members portal account.'
                  : 'أهلًا بك في المجتمع! اختر كلمة مرور لتفعيل حسابك في بوابة الأعضاء.'
                : isEnglish
                  ? 'Enter the new password below to complete the reset.'
                  : 'يرجى إدخال كلمة المرور الجديدة أدناه لإكمال عملية إعادة التعيين.'}
            </p>
          </div>

          {showSuccess && (
            <div
              style={{
                background: 'rgba(0,230,118,0.1)',
                border: '1px solid #00E676',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#00E676', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>
                {isEnglish ? 'Password updated successfully' : 'تم تحديث كلمة المرور بنجاح'}
              </p>
            </div>
          )}

          {!hasSession && !showSuccess && (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>
              {isEnglish
                ? 'This reset link is invalid or has expired. '
                : 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته. '}
              <Link href="/forgot-password" className="sdc-login-link">
                {isEnglish ? 'Request a new link' : 'اطلب رابطًا جديدًا'}
              </Link>
            </p>
          )}

          {hasSession && !showSuccess && (
            <form className="sdc-login-form" method="post" onSubmit={handleSubmit}>
              <div className="sdc-form-group">
                <label>{isEnglish ? 'New Password' : 'كلمة المرور الجديدة'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  required
                />
                <p
                  style={{ margin: '6px 0 0', fontSize: '12px', color: '#9aa0a6', lineHeight: 1.6 }}
                >
                  {passwordHint}
                </p>
              </div>

              <div className="sdc-form-group">
                <label>{isEnglish ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  required
                />
              </div>

              <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
                {loading
                  ? isEnglish
                    ? 'Updating...'
                    : 'جاري التحديث...'
                  : isEnglish
                    ? 'Update Password'
                    : 'تحديث كلمة المرور'}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
