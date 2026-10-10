-- RDS-020: the member sets what the public card shows (university, track, links, photo, participation).
create or replace function public.update_my_member_profile(p jsonb)
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
  select * into m from public.members where user_id = caller for update;
  if not found then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  update public.members set
    first_name_ar = coalesce(nullif(btrim(p ->> 'first_name_ar'), ''), first_name_ar),
    last_name_ar = coalesce(btrim(p ->> 'last_name_ar'), last_name_ar),
    first_name_en = nullif(btrim(p ->> 'first_name_en'), ''), last_name_en = nullif(btrim(p ->> 'last_name_en'), ''),
    academic_status = coalesce(nullif(p ->> 'academic_status', ''), academic_status),
    university_id = nullif(p ->> 'university_id', '')::smallint, major_id = nullif(p ->> 'major_id', '')::smallint,
    sub_major_id = nullif(p ->> 'sub_major_id', '')::smallint, track_id = nullif(p ->> 'track_id', '')::smallint,
    bio_ar = nullif(p ->> 'bio_ar', ''), bio_en = nullif(p ->> 'bio_en', ''),
    portfolio_url = nullif(p ->> 'portfolio_url', ''), github_url = nullif(p ->> 'github_url', ''),
    linkedin_url = nullif(p ->> 'linkedin_url', ''), x_url = nullif(p ->> 'x_url', ''),
    is_directory_visible = coalesce((p ->> 'is_directory_visible')::boolean, is_directory_visible),
    show_university = coalesce((p ->> 'show_university')::boolean, show_university),
    show_track = coalesce((p ->> 'show_track')::boolean, show_track),
    show_links = coalesce((p ->> 'show_links')::boolean, show_links),
    show_photo = coalesce((p ->> 'show_photo')::boolean, show_photo),
    show_participation = coalesce((p ->> 'show_participation')::boolean, show_participation)
  where id = m.id;
  perform private.write_audit('member.profile_updated', 'member', m.id::text, null,
    jsonb_build_object('visible', coalesce((p ->> 'is_directory_visible')::boolean, m.is_directory_visible)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
