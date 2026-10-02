'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import '../login/login.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const { resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setShowSuccess(false);
    setLoading(true);

    const { data: checkData, error: checkError } = await supabase.functions.invoke('check-email-exists', {
      body: { email },
    });

    if (checkError || !checkData?.exists) {
      setLoading(false);
      setErrorMsg(
        isEnglish
          ? 'This email is not registered.'
          : 'هذا البريد الإلكتروني غير مسجل.'
      );
      return;
    }

    const { error } = await resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      setErrorMsg(
        isEnglish
          ? 'Something went wrong. Please try again.'
          : 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.'
      );
      return;
    }

    setShowSuccess(true);
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
            <h1 className="sdc-login-title">{isEnglish ? 'Forgot Password' : 'استرجاع كلمة المرور'}</h1>
            <p className="sdc-login-subtitle">
              {isEnglish
                ? 'Enter the email linked to the account, and a reset link will be sent.'
                : 'يرجى إدخال البريد الإلكتروني المرتبط بالحساب، وسيتم إرسال رابط لإعادة تعيين كلمة المرور.'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {showSuccess && (
            <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid #00E676', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ color: '#00E676', fontWeight: 'bold', fontSize: '15px', margin: '0 0 4px' }}>
                {isEnglish ? 'Link sent successfully' : 'تم إرسال الرابط بنجاح'}
              </p>
              <p style={{ color: '#00E676', fontSize: '13px', margin: 0, opacity: 0.9 }}>
                {isEnglish
                  ? 'Please check the inbox to complete the password reset.'
                  : 'يرجى التحقق من البريد الإلكتروني الوارد لإكمال عملية استرجاع كلمة المرور.'}
              </p>
            </div>
          )}

          {!showSuccess && (
            <form className="sdc-login-form" onSubmit={handleSubmit}>
              <div className="sdc-form-group">
                <label>{isEnglish ? 'Email Address' : 'البريد الإلكتروني'}</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  required
                />
              </div>

              <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
                {loading ? (isEnglish ? 'Sending...' : 'جاري الإرسال...') : (isEnglish ? 'Send Reset Link' : 'إرسال رابط الاسترجاع')}
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