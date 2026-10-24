-- A ban with banned_until = infinity makes the auth service answer 500 ("Database error querying schema"), so the
-- person saw "wrong password" instead of the blocked notice. The auth service itself bans for a finite long time,
-- and the sign-in then answers user_banned, which the app turns into the blocked notice.

create or replace function public.block_accounts(p_ids uuid[], p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  pr public.profiles;
  m public.members;
  id uuid;
  code text;
  results jsonb := '[]'::jsonb;
  reason text := nullif(btrim(coalesce(p_reason, '')), '');
  banned boolean;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('users.block') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 or reason is null or char_length(reason) > 500 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  foreach id in array p_ids loop
    select * into pr from public.profiles where public.profiles.id = id for update;
    if not found then code := 'NOT_FOUND';
    elsif id = caller then code := 'SELF_ACTION';
    elsif private.role_rank(id) < private.role_rank(caller) then code := 'HIGHER_ROLE';
    elsif pr.blocked_at is not null then code := 'INVALID_TRANSITION';
    else
      code := null;
      update public.profiles set blocked_at = now(), blocked_by = caller, blocked_reason = reason where public.profiles.id = id;
      -- The auth user is banned and every session ends; the app also refuses a blocked profile, so a failure
      -- here (for example a missing privilege on the auth schema) never leaves the account usable.
      banned := true;
      begin
        update auth.users set banned_until = now() + interval '100 years' where auth.users.id = id;
        delete from auth.sessions where auth.sessions.user_id = id;
      exception when others then banned := false;
      end;
      select * into m from public.members where public.members.user_id = id;
      if found then
        update public.members set card_token = null where public.members.id = m.id;
        perform private.add_member_event(m.id, 'blocked', jsonb_build_object('reason', reason));
      end if;
      perform private.write_audit('account.blocked', 'profile', id::text, null, jsonb_build_object('reason', reason, 'auth_ban', banned));
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

-- Accounts blocked before this fix.
update auth.users set banned_until = now() + interval '100 years' where banned_until = 'infinity';
