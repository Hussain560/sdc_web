'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';
import './login.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await login(formData.email, formData.password);

    setLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('not confirmed')) {
        setErrorMsg(
          isEnglish
            ? 'Please confirm your email first. Check your inbox for the confirmation link.'
            : 'يرجى تأكيد بريدك الإلكتروني أولًا. تحقق من صندوق الوارد للرابط المرسل إليك.'
        );
      } else {
        setErrorMsg(
          isEnglish
            ? 'Incorrect email or password. Please try again.'
            : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.'
        );
      }
      return;
    }

    router.push('/');
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
            <p className="sdc-login-subtitle">{isEnglish ? 'Welcome back! Enter your details to access your account.' : 'مرحباً بعودتك! أدخل بياناتك للوصول إلى حسابك'}</p>
          </div>

          {errorMsg && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              {errorMsg}
            </div>
          )}

          <form className="sdc-login-form" onSubmit={handleSubmit}>
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

            <div style={{ textAlign: isEnglish ? 'left' : 'right', marginTop: '-8px', marginBottom: '4px' }}>
              <Link href="/forgot-password" className="sdc-login-link" style={{ fontSize: '13px' }}>
                {isEnglish ? 'Forgot your password?' : 'نسيت كلمة المرور؟'}
              </Link>
            </div>

            <button type="submit" className="sdc-login-submit-btn" disabled={loading}>
              {loading ? (isEnglish ? 'Verifying...' : 'جاري التحقق...') : (isEnglish ? 'Login' : 'تسجيل الدخول')}
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