-- Sprint 18 — two small additions:
--  * the server resolves a tracking token to its application (only to send the activation link again);
--  * leadership can add an internal note to a member's history (never shown to the member).

create or replace function public.application_by_token(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('id', a.id, 'status', a.status)
    from public.membership_applications a
   where a.tracking_token_hash = private.token_hash(p_token)
$$;
revoke all on function public.application_by_token(text) from public, anon, authenticated;
grant execute on function public.application_by_token(text) to service_role;

create or replace function public.add_member_note(p_member uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if note is null or char_length(note) > 1000 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.members where id = p_member) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  perform private.add_member_event(p_member, 'note', jsonb_build_object('note', note));
  perform private.write_audit('member.note_added', 'member', p_member::text, null, '{}'::jsonb);
end;
$$;
revoke all on function public.add_member_note(uuid, text) from public, anon;
grant execute on function public.add_member_note(uuid, text) to authenticated;
