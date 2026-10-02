'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Alert, Button, Dialog, Field } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { endRoleAssignment } from '../actions';

/** "End term" action: always behind a confirm dialog that names the person and requires a reason. */
export function EndAssignmentDialog({
  assignmentId,
  summary,
  disabledReason,
}: {
  assignmentId: string;
  summary: string;
  disabledReason?: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await endRoleAssignment({ assignmentId, reason }, { lang });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setReason('');
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        disabledReason={disabledReason}
        className="min-h-9 px-3"
      >
        {ar ? 'إنهاء الفترة' : 'End term'}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={ar ? 'إنهاء الفترة' : 'End term'}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-muted">{summary}</p>
          <Field
            label={`${ar ? 'السبب' : 'Reason'} *`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" variant="danger" loading={pending}>
              {ar ? 'إنهاء' : 'End term'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
