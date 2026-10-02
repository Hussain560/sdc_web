'use client';

import { useToast } from '@/components/ui';
import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { signUp } from '@/modules/auth/actions';
import { signUpSchema, fieldErrorsOf } from '@/modules/auth/schemas';
import '../login/login.css';

export default function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const { lang } = useLanguage();
  const toast = useToast();
  const isEnglish = lang === 'en';

  const passwordHint = isEnglish
    ? 'At least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuccess(false);

    // Same schema as the server: instant feedback only; the Server Action re-validates.
    const parsed = signUpSchema(lang).safeParse(formData);
    if (!parsed.success) {
      toast.error(
        Object.values(fieldErrorsOf(parsed.error))[0] ??
          (isEnglish ? 'Please review the fields.' : 'يرجى مراجعة الحقول.'),
      );
      return;
    }

    setLoading(true);
    const result = await signUp(formData, { lang, redirect: redirectTo });
    setLoading(false);

    if (!result.ok) {
      toast.error(Object.values(result.fieldErrors ?? {})[0] ?? result.message);
      return;
    }

    // Identical outcome whether or not the address already has an account (no enumeration).
    setNotice(result.data.notice);
    setShowSuccess(true);
    toast.success(isEnglish ? 'Account created.' : 'أُنشئ الحساب.');
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
            <h1 className="sdc-login-title">{isEnglish ? 'Create Account' : 'إنشاء حساب جديد'}</h1>
            <p className="sdc-login-subtitle">
              {isEnglish
                ? 'Join the Saudi Developer Community.'
                : 'انضم إلى المجتمع السعودي للمطورين.'}
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

          <form className="sdc-login-form" method="post" onSubmit={handleSubmit}>
            <div className="sdc-form-group">
              <label>{isEnglish ? 'Full Name' : 'الاسم الثلاثي'}</label>
              <input
                type="text"
                name="fullName"
                placeholder={isEnglish ? 'Your full name' : 'اكتب اسمك الثلاثي'}
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

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
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9aa0a6', lineHeight: 1.6 }}>
                {passwordHint}
              </p>
            </div>

            <div className="sdc-form-group">
              <label>{isEnglish ? 'Confirm Password' : 'تأكيد كلمة المرور'}</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
              {loading
                ? isEnglish
                  ? 'Creating account...'
                  : 'جاري إنشاء الحساب...'
                : isEnglish
                  ? 'Create Account'
                  : 'إنشاء حساب'}
            </button>
          </form>

          <div className="sdc-login-footer">
            <span>{isEnglish ? 'Already have an account? ' : 'لديك حساب مسبقًا؟ '}</span>
            <Link href="/login" className="sdc-login-link">
              {isEnglish ? 'Login' : 'تسجيل الدخول'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
