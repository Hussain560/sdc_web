-- Leadership adds a member directly (KFUCS parity): system administrator, community leader and founders.
-- The account is created by the server (admin API) and linked here; this function only writes the member row.

insert into public.permissions (key, module, description_ar, description_en) values
  ('members.create', 'members', 'إضافة عضو مباشرة وإرسال رابط تفعيل الحساب', 'Add a member directly and send the account activation link')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('system_admin', 'members.create'), ('community_leader', 'members.create'), ('founder', 'members.create')
on conflict do nothing;

create or replace function public.create_member(p_user uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  name_ar text := btrim(coalesce(p ->> 'full_name_ar', ''));
  first_ar text;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.create') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if char_length(name_ar) not between 3 and 100 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  if coalesce(p ->> 'academic_status', '') not in ('student', 'graduate', 'employee', 'other') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.members where user_id = p_user) then raise exception 'ALREADY_MEMBER' using errcode = 'P0001'; end if;

  first_ar := split_part(name_ar, ' ', 1);
  insert into public.members (
    user_id, status, joined_via, first_name_ar, last_name_ar, first_name_en, academic_status,
    university_id, major_id, track_id, is_directory_visible
  ) values (
    p_user, 'active', 'manual', first_ar, btrim(substr(name_ar, length(first_ar) + 1)),
    nullif(btrim(p ->> 'full_name_en'), ''), p ->> 'academic_status',
    nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint,
    false
  ) returning id into v_id;

  perform private.write_audit('member.created', 'member', v_id::text, null, jsonb_build_object('user_id', p_user, 'via', 'manual'));
  return v_id;
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.create_member(uuid, jsonb) from public, anon;
grant execute on function public.create_member(uuid, jsonb) to authenticated;
