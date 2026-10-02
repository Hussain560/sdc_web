'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import '../login/login.css';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function RegisterPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const { signup } = useAuth();
  const router = useRouter();

  const passwordHint = isEnglish
    ? 'At least 8 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  const weakPasswordMsg = isEnglish
    ? 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.'
    : 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setShowSuccess(false);

    const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 3) {
      setErrorMsg(
        isEnglish
          ? 'Please enter your full name (first, middle and last name).'
          : 'يرجى إدخال الاسم الثلاثي كاملًا (لا يقل عن ثلاث كلمات).'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(isEnglish ? 'Passwords do not match.' : 'كلمتا المرور غير متطابقتين.');
      return;
    }

    if (!PASSWORD_REGEX.test(formData.password)) {
      setErrorMsg(weakPasswordMsg);
      return;
    }

    setLoading(true);
    const { data, error } = await signup(formData.email, formData.password, formData.fullName);
    setLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setErrorMsg(isEnglish ? 'This email is already registered.' : 'هذا البريد الإلكتروني مسجل مسبقًا.');
      } else if (msg.includes('password')) {
        setErrorMsg(weakPasswordMsg);
      } else {
        setErrorMsg(isEnglish ? error.message : 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.');
      }
      return;
    }

    // Supabase لأسباب أمنية لا يرجع خطأ صريح عند التسجيل ببريد مسجل ومفعّل مسبقًا،
    // بل يرجع استجابة تبدو ناجحة لكن حقل identities يكون فارغًا في هذه الحالة تحديدًا.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setErrorMsg(isEnglish ? 'This email is already registered.' : 'هذا البريد الإلكتروني مسجل مسبقًا.');
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      router.push('/login');
    }, 5000);
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
              {isEnglish ? 'Join the Saudi Developer Community.' : 'انضم إلى المجتمع السعودي للمطورين.'}
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
                {isEnglish ? 'Account created successfully' : 'تم إنشاء الحساب بنجاح'}
              </p>
              <p style={{ color: '#00E676', fontSize: '13px', margin: 0, opacity: 0.9 }}>
                {isEnglish
                  ? 'A verification link has been sent to your email.'
                  : 'تم إرسال رابط التحقق إلى بريدك الإلكتروني.'}
              </p>
            </div>
          )}

          <form className="sdc-login-form" onSubmit={handleSubmit}>
            <div className="sdc-form-group">
              <label>{isEnglish ? 'Full Name' : 'الاسم الثلاثي'}</label>
              <input type="text" name="fullName" placeholder={isEnglish ? 'Your full name' : 'اكتب اسمك الثلاثي'} value={formData.fullName} onChange={handleChange} required />
            </div>

            <div className="sdc-form-group">
              <label>{isEnglish ? 'Email Address' : 'البريد الإلكتروني'}</label>
              <input type="email" name="email" placeholder="example@domain.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="sdc-form-group">
              <label>{isEnglish ? 'Password' : 'كلمة المرور'}</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9aa0a6', lineHeight: 1.6 }}>{passwordHint}</p>
            </div>

            <div className="sdc-form-group">
              <label>{isEnglish ? 'Confirm Password' : 'تأكيد كلمة المرور'}</label>
              <input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
              {loading ? (isEnglish ? 'Creating account...' : 'جاري إنشاء الحساب...') : (isEnglish ? 'Create Account' : 'إنشاء حساب')}
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