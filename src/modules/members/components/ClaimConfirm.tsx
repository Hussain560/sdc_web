'use client';

import { useState, useTransition } from 'react';
import { Button, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { claimLegacyMember } from '../actions';

/** "Confirm: this is my profile" — the token is checked again by the database when confirming (ME-6). */
export function ClaimConfirm({
  token,
  nameAr,
  nameEn,
}: {
  token: string;
  nameAr: string;
  nameEn: string | null;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      const r = await claimLegacyMember(token, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'تم الربط بنجاح.' : 'Linked successfully.');
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <h2 className="text-xl font-extrabold">
          {ar ? 'تم ربط ملفك بحسابك ✓' : 'Your profile is linked to your account ✓'}
        </h2>
        <p className="text-muted">
          {ar
            ? 'راجع بياناتك واختر ما إذا كنت تريد الظهور في الدليل.'
            : 'Review your details and choose whether to appear in the directory.'}
        </p>
        <Link
          href="/account/member-profile"
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-on-accent"
        >
          {ar ? 'ملف العضوية' : 'Member profile'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-xl font-extrabold">{ar ? 'هل هذا ملفك؟' : 'Is this your profile?'}</h2>
      <p className="text-lg font-bold">{ar ? nameAr : nameEn || nameAr}</p>
      <p className="max-w-md text-muted">
        {ar
          ? 'بتأكيدك يُربط هذا الملف القديم بحسابك الحالي، ولن يُستخدم الرابط مرة أخرى.'
          : 'Confirming links this existing profile to your current account. The link cannot be used again.'}
      </p>
      <Button onClick={confirm} loading={pending}>
        {ar ? 'نعم، هذا ملفي' : 'Yes, this is my profile'}
      </Button>
    </div>
  );
}
