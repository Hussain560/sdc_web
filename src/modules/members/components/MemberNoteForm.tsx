'use client';

import { StickyNote } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { addMemberNote } from '../lifecycle-actions';

/** An internal note on the member's history, visible to leadership only. */
export function MemberNoteForm({ id }: { id: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addMemberNote({ id, note }, { lang });
          if (!r.ok) return void toast.error(r.message);
          setNote('');
          toast.success(ar ? 'أُضيفت الملاحظة.' : 'The note was added.');
          router.refresh();
        });
      }}
    >
      <Textarea
        label={ar ? 'ملاحظة داخلية' : 'Internal note'}
        hint={
          ar
            ? 'تظهر للقيادة فقط، ولا تُرسل للعضو.'
            : 'Visible to leadership only; never sent to the member.'
        }
        value={note}
        maxLength={1000}
        rows={2}
        onChange={(e) => setNote(e.target.value)}
      />
      <div>
        <Button
          type="submit"
          size="sm"
          loading={pending}
          disabled={!note.trim()}
          iconStart={<StickyNote size={14} aria-hidden="true" />}
        >
          {ar ? 'أضف الملاحظة' : 'Add the note'}
        </Button>
      </div>
    </form>
  );
}
