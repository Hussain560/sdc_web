'use client';

import { useEffect, useState } from 'react';
import { LinkButton } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

/** Shown only to the person whose profile this is: an edit link and a note that visitors see this page. */
export function OwnProfileBar({
  memberId,
  edit,
  note,
}: {
  memberId: string;
  edit: string;
  note: string;
}) {
  const { user } = useAuth();
  const [own, setOwn] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setOwn(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user, memberId]);
  if (!own) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <LinkButton href="/account/member-profile" variant="secondary" size="sm">
        {edit}
      </LinkButton>
      <p className="t-body-sm text-muted">{note}</p>
    </div>
  );
}
