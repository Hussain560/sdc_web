'use client';

import { useToast } from '@/components/ui';
import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { requestPasswordReset } from '@/modules/auth/actions';
import '../login/login.css';

export default function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { lang } = useLanguage();
  const toast = useToast();
  const isEnglish = lang === 'en';
  useEffect(() => {
    if (initialError) toast.error(initialError);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, for the error carried in the URL
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccess(false);
    setLoading(true);

    const result = await requestPasswordReset({ email }, { lang });
    setLoading(false);

    if (!result.ok) {
      toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.message);
      return;
    }

    // Same message whether or not the e-mail is registered (no enumeration).
    setNotice(result.data.notice);
    setShowSuccess(true);
    toast.success(isEnglish ? 'Request received.' : 'استلمنا طلبك.');
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
            <h1 className="sdc-login-title">
              {isEnglish ? 'Forgot Password' : 'استرجاع كلمة المرور'}
            </h1>
            <p className="sdc-login-subtitle">
              {isEnglish
                ? 'Enter the email linked to the account, and a reset link will be sent.'
                : 'يرجى إدخال البريد الإلكتروني المرتبط بالحساب، وسيتم إرسال رابط لإعادة تعيين كلمة المرور.'}
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
              <p
                style={{
                  color: '#00E676',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  margin: '0 0 4px',
                }}
              >
                {isEnglish ? 'Check your email' : 'تحقق من بريدك الإلكتروني'}
              </p>
              <p style={{ color: '#00E676', fontSize: '13px', margin: 0, opacity: 0.9 }}>
                {notice}
              </p>
            </div>
          )}

          {!showSuccess && (
            <form className="sdc-login-form" method="post" onSubmit={handleSubmit}>
              <div className="sdc-form-group">
                <label>{isEnglish ? 'Email Address' : 'البريد الإلكتروني'}</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  required
                />
              </div>

              <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
                {loading
                  ? isEnglish
                    ? 'Sending...'
                    : 'جاري الإرسال...'
                  : isEnglish
                    ? 'Send Reset Link'
                    : 'إرسال رابط الاسترجاع'}
              </button>
            </form>
          )}

          <div className="sdc-login-footer">
            <Link href="/login" className="sdc-login-link">
              {isEnglish ? 'Back to login' : 'الرجوع لتسجيل الدخول'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
