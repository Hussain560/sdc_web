'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { signIn, resendConfirmation } from '@/modules/auth/actions';
import type { ErrorCode } from '@/lib/result';
import './login.css';

export default function LoginForm({
  redirectTo,
  initialError,
}: {
  redirectTo: string;
  initialError?: string;
}) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError ?? '');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [notice, setNotice] = useState('');
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const router = useRouter();
  const { refresh } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setErrorCode(null);
    setNotice('');

    const result = await signIn(formData, { lang, redirect: redirectTo });

    if (!result.ok) {
      setLoading(false);
      setErrorMsg(result.message);
      setErrorCode(result.code);
      return;
    }

    await refresh();
    // No router.refresh() here: it would re-run the (now signed-in) /login page and race the navigation.
    router.replace(result.data.redirectTo);
  };

  const handleResend = async () => {
    const result = await resendConfirmation({ email: formData.email }, { lang });
    setNotice(result.ok ? result.data.notice : result.message);
  };

  return (
    <div className="sdc-login-page-wrapper">
      <Header />

      <main className="sdc-login-main" style={{ position: 'relative' }}>
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '40px',
            right: '40px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fff',
            fontSize: '14px',
            textDecoration: 'none',
            opacity: 0.85,
          }}
        >
          {isEnglish ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          <span>{isEnglish ? 'Back to Home Page' : 'العودة للصفحة الرئيسية'}</span>
        </Link>

        <div className="sdc-login-card">
          <div className="sdc-login-header">
            <h1 className="sdc-login-title">{isEnglish ? 'Login' : 'تسجيل الدخول'}</h1>
            <p className="sdc-login-subtitle">
              {isEnglish
                ? 'Welcome back! Enter your details to access your account.'
                : 'مرحباً بعودتك! أدخل بياناتك للوصول إلى حسابك'}
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {errorMsg}
              {errorCode === 'EMAIL_NOT_CONFIRMED' && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="sdc-login-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={handleResend}
                  >
                    {isEnglish ? 'Resend confirmation email' : 'إعادة إرسال رسالة التأكيد'}
                  </button>
                </div>
              )}
            </div>
          )}

          {notice && (
            <div
              role="status"
              style={{
                background: 'rgba(0,230,118,0.1)',
                border: '1px solid #00E676',
                color: '#00E676',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {notice}
            </div>
          )}

          <form className="sdc-login-form" method="post" onSubmit={handleSubmit}>
            <div className="sdc-form-group">
              <label>{isEnglish ? 'Email Address' : 'البريد الإلكتروني'}</label>
              <input
                type="email"
                name="email"
                placeholder="example@domain.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sdc-form-group">
              <label>{isEnglish ? 'Password' : 'كلمة المرور'}</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div
              style={{
                textAlign: isEnglish ? 'left' : 'right',
                marginTop: '-8px',
                marginBottom: '4px',
              }}
            >
              <Link href="/forgot-password" className="sdc-login-link" style={{ fontSize: '13px' }}>
                {isEnglish ? 'Forgot your password?' : 'نسيت كلمة المرور؟'}
              </Link>
            </div>

            <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
              {loading
                ? isEnglish
                  ? 'Verifying...'
                  : 'جاري التحقق...'
                : isEnglish
                  ? 'Login'
                  : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="sdc-login-footer">
            <span>{isEnglish ? 'New user? ' : 'مستخدم جديد؟ '}</span>
            <Link href="/register" className="sdc-login-link">
              {isEnglish ? 'Create a new account' : 'إنشاء حساب جديد'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
