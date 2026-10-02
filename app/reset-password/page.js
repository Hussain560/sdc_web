'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import '../login/login.css';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const { updatePassword, logout } = useAuth();
  const router = useRouter();

  const passwordHint = isEnglish
    ? 'At least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  const weakPasswordMsg = isEnglish
    ? 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => { listener?.subscription?.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setShowSuccess(false);

    if (password !== confirmPassword) {
      setErrorMsg(isEnglish ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setErrorMsg(weakPasswordMsg);
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);

    if (error) {
      setLoading(false);
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('password')) {
        setErrorMsg(weakPasswordMsg);
      } else {
        setErrorMsg(
          isEnglish
            ? 'Something went wrong. Please try again.'
            : 'حدث خطأ أثناء تحديث كلمة المرور، يرجى المحاولة مرة أخرى.'
        );
      }
      return;
    }

    // نسجّل خروج المستخدم من الجلسة المؤقتة اللي فتحها رابط الاسترجاع،
    // عشان يضطر يسجّل دخول من جديد بكلمة المرور الجديدة يدويًا.
    await logout();
    setLoading(false);

    setShowSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  return (
    <div className="sdc-login-page-wrapper">
      <Header />

      <main className="sdc-login-main">
        <div className="sdc-login-card">
          <div className="sdc-login-header">
            <h1 className="sdc-login-title">{isEnglish ? 'Reset Password' : 'تعيين كلمة مرور جديدة'}</h1>
            <p className="sdc-login-subtitle">
              {isEnglish
                ? 'Enter the new password below to complete the reset.'
                : 'يرجى إدخال كلمة المرور الجديدة أدناه لإكمال عملية إعادة التعيين.'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {showSuccess && (
            <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid #00E676', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ color: '#00E676', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>
                {isEnglish ? 'Password updated successfully' : 'تم تحديث كلمة المرور بنجاح'}
              </p>
            </div>
          )}

          {!ready && !showSuccess && (
            <p style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>
              {isEnglish ? 'Verifying link...' : 'جاري التحقق من صلاحية الرابط...'}
            </p>
          )}

          {ready && !showSuccess && (
            <form className="sdc-login-form" onSubmit={handleSubmit}>
              <div className="sdc-form-group">
                <label>{isEnglish ? 'New Password' : 'كلمة المرور الجديدة'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  required
                />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9aa0a6', lineHeight: 1.6 }}>{passwordHint}</p>
              </div>

              <div className="sdc-form-group">
                <label>{isEnglish ? 'Confirm New Password' : 'تأكيد كلمة المرور الجديدة'}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  required
                />
              </div>

              <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
                {loading ? (isEnglish ? 'Updating...' : 'جاري التحديث...') : (isEnglish ? 'Update Password' : 'تحديث كلمة المرور')}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}