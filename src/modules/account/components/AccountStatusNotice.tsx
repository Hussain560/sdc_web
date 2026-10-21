'use client';

import { useEffect, useState } from 'react';
import { Button, Dialog } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

export type StatusNoticeProps = {
  status: 'suspended' | 'expired' | 'ended';
  /** The category the member may see; the internal reason is never sent here. */
  categoryLabel: { ar: string; en: string } | null;
  until: string | null;
  termEndsAt: string | null;
};

const KEY = 'sdc_status_notice';

/** One calm dialog at the first visit of a sign-in when the membership is paused, expired or ended (ACC-008). */
export function AccountStatusNotice({
  status,
  categoryLabel,
  until,
  termEndsAt,
}: StatusNoticeProps) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === status) return;
    } catch {
      /* private mode: show it every time */
    }
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, [status]);

  const close = () => {
    try {
      sessionStorage.setItem(KEY, status);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const copy = {
    suspended: {
      title: L('عضويتك موقوفة مؤقتاً', 'Your membership is paused'),
      body: L(
        `${categoryLabel ? `السبب: ${categoryLabel.ar}. ` : ''}${until ? `تعود في ${formatDate(until, lang)}. ` : ''}تستطيع الدخول إلى حسابك، لكن بطاقتك لا تُظهر عضوية سارية حتى تعود.`,
        `${categoryLabel ? `Reason: ${categoryLabel.en}. ` : ''}${until ? `Back on ${formatDate(until, lang)}. ` : ''}You can still sign in, but your card does not show a valid membership until you are back.`,
      ),
    },
    expired: {
      title: L('انتهت مدة عضويتك', 'Your term has ended'),
      body: L(
        `${termEndsAt ? `انتهت في ${formatDate(termEndsAt, lang)}. ` : ''}اطلب التجديد لتعود بطاقتك سارية.`,
        `${termEndsAt ? `It ended on ${formatDate(termEndsAt, lang)}. ` : ''}Request a renewal to make your card valid again.`,
      ),
    },
    ended: {
      title: L('انتهت عضويتك', 'Your membership has ended'),
      body: L(
        'يبقى حسابك لشهاداتك وبياناتك، ولا يظهر ملفك في الدليل. يمكنك التقديم من جديد عند فتح باب العضوية.',
        'Your account stays for your certificates and data, and your profile is not in the directory. You can apply again when applications open.',
      ),
    },
  }[status];

  return (
    <Dialog
      open={open}
      onClose={close}
      title={copy.title}
      closeLabel={L('إغلاق', 'Close')}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {L('لاحقاً', 'Later')}
          </Button>
          <Link
            href="/account/membership"
            onClick={close}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 font-semibold text-on-accent hover:bg-accent-hover"
          >
            {L('عضويتي', 'My membership')}
          </Link>
        </>
      }
    >
      <p>{copy.body}</p>
    </Dialog>
  );
}
