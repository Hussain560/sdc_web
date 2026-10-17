-- MEM-015 (Sprint 17, Q-M8): leadership may correct a member's names, phone and academic data, and every change is
-- audited. The public blocks of the profile (headline, about, skills, projects, links, photo and what is shown)
-- belong to the member alone; this function does not touch them. A key that is absent is left as it was.

create or replace function public.admin_update_member(p_id uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into m from public.members where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  -- The phone is contact data: changing it needs the same permission as seeing it.
  if p ? 'phone' and not private.has_permission('members.view_contact') then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p ? 'first_name_ar' and nullif(btrim(p ->> 'first_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p ? 'last_name_ar' and nullif(btrim(p ->> 'last_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  update public.members set
    first_name_ar  = case when p ? 'first_name_ar'  then btrim(p ->> 'first_name_ar') else first_name_ar end,
    middle_name_ar = case when p ? 'middle_name_ar' then nullif(btrim(p ->> 'middle_name_ar'), '') else middle_name_ar end,
    last_name_ar   = case when p ? 'last_name_ar'   then btrim(p ->> 'last_name_ar') else last_name_ar end,
    first_name_en  = case when p ? 'first_name_en'  then nullif(btrim(p ->> 'first_name_en'), '') else first_name_en end,
    middle_name_en = case when p ? 'middle_name_en' then nullif(btrim(p ->> 'middle_name_en'), '') else middle_name_en end,
    last_name_en   = case when p ? 'last_name_en'   then nullif(btrim(p ->> 'last_name_en'), '') else last_name_en end,
    phone          = case when p ? 'phone'          then nullif(btrim(p ->> 'phone'), '') else phone end,
    academic_status = case when p ? 'academic_status' then nullif(p ->> 'academic_status', '') else academic_status end,
    university_id  = case when p ? 'university_id'  then nullif(p ->> 'university_id', '')::smallint else university_id end,
    major_id       = case when p ? 'major_id'       then nullif(p ->> 'major_id', '')::smallint else major_id end,
    sub_major_id   = case when p ? 'sub_major_id'   then nullif(p ->> 'sub_major_id', '')::smallint else sub_major_id end,
    track_id       = case when p ? 'track_id'       then nullif(p ->> 'track_id', '')::smallint else track_id end
  where id = m.id;

  perform private.write_audit('member.updated_by_staff', 'member', m.id::text, null,
    jsonb_build_object('fields', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.admin_update_member(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_member(uuid, jsonb) to authenticated;
