'use client';

import { useState, useTransition } from 'react';
import { Button, Card, Field, Switch, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { saveSettings, type SettingsInput } from '../actions';
import type { AdminSettings } from '../queries';

/** Site settings (ACC-006). Validation lives in the database function; its field errors are shown inline. */
export function SettingsForm({
  initial,
  readOnly,
}: {
  initial: AdminSettings;
  readOnly?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [v, setV] = useState<SettingsInput>({
    socialInstagram: initial.socialInstagram,
    socialLinkedin: initial.socialLinkedin,
    socialX: initial.socialX,
    contactEmail: initial.contactEmail,
    whatsappLink: initial.whatsappLink,
    footerRightsAr: initial.footerRightsAr,
    footerRightsEn: initial.footerRightsEn,
    certificatesEnabled: initial.certificatesEnabled,
    certificateThreshold: String(initial.certificateThreshold),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof SettingsInput>(k: K, value: SettingsInput[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await saveSettings(v, { lang });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      setErrors({});
      toast.success(ar ? 'تم حفظ الإعدادات.' : 'Settings saved.');
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset disabled={readOnly || busy} className="contents">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{ar ? 'التواصل والتذييل' : 'Contact and footer'}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={ar ? 'رابط إنستغرام' : 'Instagram link'}
              value={v.socialInstagram}
              onChange={(e) => set('socialInstagram', e.target.value)}
              error={errors.socialInstagram}
              dir="ltr"
              inputMode="url"
            />
            <Field
              label={ar ? 'رابط لينكدإن' : 'LinkedIn link'}
              value={v.socialLinkedin}
              onChange={(e) => set('socialLinkedin', e.target.value)}
              error={errors.socialLinkedin}
              dir="ltr"
              inputMode="url"
            />
            <Field
              label={ar ? 'رابط X' : 'X link'}
              value={v.socialX}
              onChange={(e) => set('socialX', e.target.value)}
              error={errors.socialX}
              dir="ltr"
              inputMode="url"
            />
            <Field
              label={ar ? 'بريد التواصل' : 'Contact e-mail'}
              value={v.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              error={errors.contactEmail}
              hint={ar ? 'اختياري.' : 'Optional.'}
              dir="ltr"
              type="email"
            />
            <Field
              label={ar ? 'رابط مجموعة واتساب للمجتمع' : 'Community WhatsApp group link'}
              value={v.whatsappLink}
              onChange={(e) => set('whatsappLink', e.target.value)}
              error={errors.whatsappLink}
              hint={
                ar
                  ? 'يظهر في رسالة قبول العضوية وإضافة العضو. اتركه فارغًا لإخفائه. مثال: https://chat.whatsapp.com/…'
                  : 'Shown in the membership acceptance and add-member e-mails. Leave empty to hide it. Example: https://chat.whatsapp.com/…'
              }
              dir="ltr"
              inputMode="url"
            />
            <Field
              label={ar ? 'نص الحقوق (عربي)' : 'Rights text (Arabic)'}
              value={v.footerRightsAr}
              onChange={(e) => set('footerRightsAr', e.target.value)}
              error={errors.footerRightsAr}
              hint={
                ar ? 'اتركه فارغًا لاستخدام النص الافتراضي.' : 'Leave empty for the default text.'
              }
            />
            <Field
              label={ar ? 'نص الحقوق (إنجليزي)' : 'Rights text (English)'}
              value={v.footerRightsEn}
              onChange={(e) => set('footerRightsEn', e.target.value)}
              error={errors.footerRightsEn}
              hint={
                ar ? 'اتركه فارغًا لاستخدام النص الافتراضي.' : 'Leave empty for the default text.'
              }
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted">
            {ar
              ? 'روابط التواصل يجب أن تبدأ بـ https://.'
              : 'Social links must start with https://.'}
          </p>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{ar ? 'الشهادات' : 'Certificates'}</h2>
          <Switch
            checked={v.certificatesEnabled}
            onChange={(c) => set('certificatesEnabled', c)}
            label={ar ? 'إصدار الشهادات' : 'Issue certificates'}
            hint={
              ar
                ? 'عند التفعيل تُصدر الشهادات عند اعتماد الحضور لمن بلغ النسبة المطلوبة.'
                : 'When on, certificates are issued at attendance sign-off to those who reach the threshold.'
            }
          />
          <div className="max-w-xs">
            <Field
              label={ar ? 'نسبة الحضور المطلوبة (%)' : 'Required attendance (%)'}
              value={v.certificateThreshold}
              onChange={(e) => set('certificateThreshold', e.target.value)}
              error={errors.certificateThreshold}
              inputMode="numeric"
              dir="ltr"
            />
          </div>
        </Card>
      </fieldset>

      {!readOnly && (
        <div>
          <Button type="submit" loading={busy}>
            {ar ? 'حفظ الإعدادات' : 'Save settings'}
          </Button>
        </div>
      )}
    </form>
  );
}
