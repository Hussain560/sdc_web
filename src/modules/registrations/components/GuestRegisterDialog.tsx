'use client';

import { CheckCircle, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { eventTitle, type PublicEventCard } from '@/modules/events/public-types';
import { registerGuest, type RegistrationStatus } from '../actions';
import '../../../../app/[locale]/login/login.css';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;

/** Remembered on this device so the button reads "Registered" and a second submission is not even offered. */
export const guestKey = (eventId: string) => `sdc_guest_reg_${eventId}`;

/**
 * Registration without an account (public screens: a modal on the event page, like KFUCS). The person fills the
 * form, submits once and sees the outcome in the same dialog. Layers against spam and double submissions: a hidden
 * honeypot, the fill time, the button locked while sending (a ref blocks double clicks), a short client cooldown
 * after an error, and — authoritative — the database throttles and refuses a second registration per e-mail.
 */
export function GuestRegisterDialog({
  event,
  onClose,
  onRegistered,
}: {
  event: PublicEventCard;
  onClose: () => void;
  onRegistered: (status: RegistrationStatus) => void;
}) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const L = (a: string, e: string) => (en ? e : a);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [done, setDone] = useState<RegistrationStatus | null>(null);
  const lock = useRef(false);
  const [openedAt] = useState(() => Date.now()); // when the form opened, for the minimum fill time

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = L('اكتب اسمك الكامل.', 'Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      e.email = L('اكتب بريدًا إلكترونيًا صحيحًا.', 'Enter a valid e-mail address.');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15 || !/^[+0-9 ()-]+$/.test(phone.trim()))
      e.phone = L('اكتب رقم جوال صحيحًا.', 'Enter a valid phone number.');
    if (!consent)
      e.consent = L('يجب الموافقة على سياسة الخصوصية.', 'You must accept the privacy notice.');
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (lock.current || sending || cooldown) return;
    const found = validate();
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length > 0) return;

    lock.current = true;
    setSending(true);
    const r = await registerGuest(
      {
        eventId: event.id,
        name,
        email,
        phone,
        university: university.trim() || undefined,
        honeypot,
        consent,
        elapsedMs: Date.now() - openedAt,
      },
      { lang },
    );
    setSending(false);
    if (r.ok) {
      try {
        localStorage.setItem(guestKey(event.id), email.trim().toLowerCase());
      } catch {
        /* private mode: the server still refuses a second registration */
      }
      setDone(r.data.status);
      onRegistered(r.data.status);
      return; // stays locked: the form is gone
    }
    lock.current = false;
    setMessage(r.message);
    if (r.fieldErrors) setErrors(r.fieldErrors as Errors);
    // A short pause after a refusal slows scripted retries without punishing a typo.
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2500);
  };

  const outcome =
    done === 'accepted'
      ? L(
          'تم تسجيلك في الفعالية. أرسلنا إليك رسالة تأكيد على بريدك.',
          'You are registered. We sent a confirmation to your e-mail.',
        )
      : done === 'waitlisted'
        ? L(
            'اكتمل العدد، وأُضفت إلى قائمة الانتظار. سنراسلك إذا توفر مقعد.',
            'The event is full. You are on the waiting list and we will e-mail you if a seat opens.',
          )
        : L(
            'استلمنا طلبك. سنراسلك على بريدك عند قبول التسجيل.',
            'Request received. We will e-mail you once your registration is accepted.',
          );

  const err = (text?: string) =>
    text ? (
      <small role="alert" style={{ color: '#ef4444', fontSize: '0.8rem' }}>
        {text}
      </small>
    ) : null;

  return (
    <div className="sdc-modal-overlay" onClick={() => !sending && onClose()}>
      <div
        className="sdc-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={L('التسجيل في الفعالية', 'Register for the event')}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92dvh', overflowY: 'auto' }}
      >
        <button
          className="sdc-modal-close"
          onClick={onClose}
          disabled={sending}
          aria-label={L('إغلاق', 'Close')}
        >
          <X size={20} />
        </button>
        <div className="sdc-modal-header">
          <CheckCircle size={40} className="sdc-modal-icon" />
          <h3>
            {done
              ? L('تم استلام تسجيلك', 'Registration received')
              : L('التسجيل في الفعالية', 'Register for the event')}
          </h3>
        </div>
        <p className="sdc-modal-event-name">{eventTitle(event, lang)}</p>

        {done ? (
          <>
            <div className="sdc-modal-user-info" role="status" aria-live="polite">
              <span>{outcome}</span>
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={onClose}>
                {L('حسنًا', 'OK')}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="sdc-login-form" style={{ gap: 14 }}>
            {/* Honeypot: invisible to people, tempting to bots. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                insetInlineStart: '-9999px',
                height: 0,
                overflow: 'hidden',
              }}
            >
              <label>
                Website
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </label>
            </div>

            {message && (
              <div className="sdc-modal-user-info" role="alert" style={{ color: '#fca5a5' }}>
                {message}
              </div>
            )}

            <div className="sdc-form-group">
              <label htmlFor="g-name">{L('الاسم الكامل', 'Full name')}</label>
              <input
                id="g-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={100}
                disabled={sending}
                aria-invalid={!!errors.name}
              />
              {err(errors.name)}
            </div>
            <div className="sdc-form-group">
              <label htmlFor="g-email">{L('البريد الإلكتروني', 'E-mail')}</label>
              <input
                id="g-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                maxLength={160}
                disabled={sending}
                aria-invalid={!!errors.email}
                placeholder="name@example.com"
              />
              {err(errors.email)}
            </div>
            <div className="sdc-form-group">
              <label htmlFor="g-phone">{L('رقم الجوال', 'Phone number')}</label>
              <input
                id="g-phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={25}
                disabled={sending}
                aria-invalid={!!errors.phone}
                placeholder="+966 5x xxx xxxx"
              />
              {err(errors.phone)}
            </div>
            <div className="sdc-form-group">
              <label htmlFor="g-uni">
                {L('الجامعة أو جهة العمل', 'University or workplace')}{' '}
                <span style={{ opacity: 0.6, fontWeight: 400 }}>({L('اختياري', 'optional')})</span>
              </label>
              <input
                id="g-uni"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                maxLength={120}
                disabled={sending}
              />
            </div>

            <div className="sdc-form-group">
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setErrors((p) => ({ ...p, consent: '' }));
                  }}
                  disabled={sending}
                  aria-invalid={!!errors.consent}
                  style={{ marginTop: 4 }}
                />
                <span>
                  {L('قرأت ', 'I have read the ')}
                  <Link href="/privacy" className="sdc-login-link" target="_blank">
                    {L('سياسة الخصوصية', 'privacy notice')}
                  </Link>
                  {L(
                    ' وأوافق على معالجة بياناتي لغرض التسجيل في الفعالية.',
                    ' and agree to my data being processed for this registration.',
                  )}
                </span>
              </label>
              {err(errors.consent)}
            </div>

            <div className="sdc-modal-footer" style={{ marginTop: 4 }}>
              <button type="submit" className="sdc-btn-confirm" disabled={sending || cooldown}>
                {sending
                  ? L('جاري الإرسال...', 'Sending...')
                  : cooldown
                    ? L('انتظر لحظة...', 'One moment...')
                    : L('تأكيد التسجيل', 'Confirm registration')}
              </button>
              <button type="button" className="sdc-btn-cancel" onClick={onClose} disabled={sending}>
                {L('إلغاء', 'Cancel')}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', margin: 0, opacity: 0.85 }}>
              {L('لديك حساب؟', 'Have an account?')}{' '}
              <Link href={`/login?redirect=/events/${event.slug}`} className="sdc-login-link">
                {L('سجّل الدخول', 'Sign in')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
