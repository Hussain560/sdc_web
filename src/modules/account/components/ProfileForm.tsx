'use client';

import { useRouter } from '@/i18n/navigation';
import { useState, useTransition } from 'react';
import { Alert, Button, Card, Field } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { updateProfile } from '@/modules/auth/actions';
import type { MyProfile } from '../queries';

export function ProfileForm({ profile }: { profile: MyProfile }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState({
    fullNameAr: profile.fullNameAr,
    fullNameEn: profile.fullNameEn ?? '',
    preferredLocale: profile.preferredLocale as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateProfile(values, { lang });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage({ tone: 'danger', text: result.message });
        return;
      }
      setErrors({});
      setMessage({ tone: 'success', text: ar ? 'تم حفظ التغييرات' : 'Changes saved' });
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">{ar ? 'الحساب' : 'Account'}</h2>
        <Field
          label={ar ? 'الاسم (عربي)' : 'Name (Arabic)'}
          value={values.fullNameAr}
          error={errors.fullNameAr}
          onChange={(e) => setValues({ ...values, fullNameAr: e.target.value })}
          required
        />
        <Field
          label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
          dir="ltr"
          value={values.fullNameEn}
          error={errors.fullNameEn}
          onChange={(e) => setValues({ ...values, fullNameEn: e.target.value })}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium">{ar ? 'البريد الإلكتروني' : 'Email'}</p>
          <p dir="ltr" className="text-muted" style={{ textAlign: 'start' }}>
            {profile.email}
          </p>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">
            {ar ? 'لغة الرسائل' : 'Email language'}
          </legend>
          <div className="flex gap-6">
            {(['ar', 'en'] as const).map((code) => (
              <label key={code} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="preferredLocale"
                  value={code}
                  checked={values.preferredLocale === code}
                  onChange={() => setValues({ ...values, preferredLocale: code })}
                />
                {code === 'ar' ? 'العربية' : 'English'}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div>
        <Button type="submit" loading={pending}>
          {ar ? 'حفظ التغييرات' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
