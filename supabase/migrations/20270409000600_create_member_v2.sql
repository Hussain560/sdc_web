-- MEM-014 (Sprint 17): add a member in one step, with the committee position, all or nothing.
-- create_member keeps its signature. The payload may now carry the name in parts (first, middle, last, in both
-- languages), a private phone, and an optional position (committee, role, start date, and what to do when the
-- committee already has a head). The old payload with one full name still works. The member row and the position are
-- written in ONE transaction: when the position is refused (for example a head conflict), nothing is saved.

create or replace function public.create_member(p_user uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  v_id uuid;
  v_first_ar text;
  v_middle_ar text;
  v_last_ar text;
  v_role text := nullif(btrim(coalesce(p ->> 'role_key', '')), '');
  v_committee uuid := nullif(btrim(coalesce(p ->> 'committee_id', '')), '')::uuid;
  v_start timestamptz := coalesce(nullif(btrim(coalesce(p ->> 'starts_at', '')), '')::timestamptz, now());
  v_full text := btrim(coalesce(p ->> 'full_name_ar', ''));
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.create') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if coalesce(p ->> 'academic_status', '') not in ('student', 'graduate', 'employee', 'other') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.members where user_id = p_user) then raise exception 'ALREADY_MEMBER' using errcode = 'P0001'; end if;

  if p ? 'first_name_ar' then
    v_first_ar := btrim(coalesce(p ->> 'first_name_ar', ''));
    v_middle_ar := nullif(btrim(coalesce(p ->> 'middle_name_ar', '')), '');
    v_last_ar := btrim(coalesce(p ->> 'last_name_ar', ''));
    if v_first_ar = '' or v_last_ar = '' then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  else
    -- Old payload: one full Arabic name, split at the first space.
    if char_length(v_full) not between 3 and 100 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
    v_first_ar := split_part(v_full, ' ', 1);
    v_last_ar := btrim(substr(v_full, length(v_first_ar) + 1));
  end if;

  insert into public.members (
    user_id, status, joined_via, first_name_ar, middle_name_ar, last_name_ar,
    first_name_en, middle_name_en, last_name_en, phone, academic_status,
    university_id, major_id, sub_major_id, track_id, is_directory_visible
  ) values (
    p_user, 'active', 'manual', v_first_ar, v_middle_ar, v_last_ar,
    case when p ? 'first_name_ar' then nullif(btrim(coalesce(p ->> 'first_name_en', '')), '') else nullif(btrim(coalesce(p ->> 'full_name_en', '')), '') end,
    nullif(btrim(coalesce(p ->> 'middle_name_en', '')), ''),
    nullif(btrim(coalesce(p ->> 'last_name_en', '')), ''),
    nullif(btrim(coalesce(p ->> 'phone', '')), ''), p ->> 'academic_status',
    nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint,
    nullif(p ->> 'sub_major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint, false
  ) returning id into v_id;

  -- The position, in the same transaction. Every guard of assign_role applies (anti-escalation, one head, scope).
  if v_role is not null then
    if v_role = 'committee_head' and coalesce((p ->> 'handover')::boolean, false) then
      perform public.handover_head(v_committee, p_user, v_start, coalesce((p ->> 'keep_as_deputy')::boolean, false));
    else
      perform public.assign_role(p_user, v_role, v_committee, v_start, null);
    end if;
  end if;

  perform private.write_audit('member.created', 'member', v_id::text, v_committee,
    jsonb_build_object('user_id', p_user, 'via', 'manual', 'role', v_role));
  return v_id;
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.create_member(uuid, jsonb) from public, anon;
grant execute on function public.create_member(uuid, jsonb) to authenticated;

-- ------------------------------------------------------------------------------------------ duplicate e-mail check
-- The wizard warns on the first step when the e-mail already belongs to somebody, before anything is created.
create or replace function public.find_member_by_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  mail text := lower(btrim(coalesce(p_email, '')));
  r record;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.create') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if mail !~ '^[^@\s]+@[^@\s]+$' then return jsonb_build_object('account', false, 'member', null); end if;

  select p.id as user_id, m.id as member_id,
         btrim(concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar)) as name_ar,
         nullif(btrim(concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en)), '') as name_en
  into r
  from public.profiles p
  left join public.members m on m.user_id = p.id
  where lower(p.email) = mail;

  if not found then return jsonb_build_object('account', false, 'member', null); end if;
  return jsonb_build_object(
    'account', true,
    'member', case when r.member_id is null then null
                   else jsonb_build_object('id', r.member_id, 'name_ar', r.name_ar, 'name_en', r.name_en) end);
end;
$$;
revoke all on function public.find_member_by_email(text) from public, anon;
grant execute on function public.find_member_by_email(text) to authenticated;
