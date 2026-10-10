'use client';

import { CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Button, LinkButton, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { AuthHeading } from '@/modules/auth/components/AuthShell';
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (done) titleRef.current?.focus();
  }, [done]);

  const confirm = () => {
    startTransition(async () => {
      const r = await claimLegacyMember(token, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      setDone(true);
    });
  };

  if (done) {
    return (
      <div role="status" className="flex flex-col items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success"
        >
          <CircleCheck className="size-7" />
        </span>
        <h1 ref={titleRef} tabIndex={-1} className="t-h1 focus-visible:outline-none">
          {ar ? 'تم ربط ملفك' : 'Your profile is linked'}
        </h1>
        <p className="t-lede text-muted">
          {ar
            ? 'راجع بياناتك واختر ما إذا كنت تريد الظهور في الدليل.'
            : 'Review your details and choose whether to appear in the directory.'}
        </p>
        <LinkButton href="/account/member-profile" size="lg" fullWidth>
          {ar ? 'اذهب إلى ملفي' : 'Go to my profile'}
        </LinkButton>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title={ar ? 'هل هذا ملفك؟' : 'Is this your profile?'}
        lede={
          ar
            ? 'بتأكيدك يُربط هذا الملف القديم بحسابك الحالي، ولن يُستخدم الرابط مرة أخرى.'
            : 'Confirming links this existing profile to your current account. The link cannot be used again.'
        }
      />
      <p className="t-h3 rounded-shape-lg bg-surface-raised p-5">
        {ar ? nameAr : nameEn || nameAr}
      </p>
      <div className="flex flex-col gap-2">
        <Button size="lg" fullWidth onClick={confirm} loading={pending}>
          {ar ? 'اربط هذا الملف بحسابي' : 'Link this profile to my account'}
        </Button>
        <LinkButton href="/account" variant="ghost" size="lg" fullWidth>
          {ar ? 'ليس ملفي' : "This isn't me"}
        </LinkButton>
      </div>
    </>
  );
}
