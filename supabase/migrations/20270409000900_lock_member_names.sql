-- Sprint 17 follow-up: a member can no longer change their own name. The name is set when the membership is accepted
-- and only leadership (members.manage: system administrator and community leader) edits it, through
-- admin_update_member. The member-facing function now refuses any name key with NAME_LOCKED. A member can set their
-- own phone number (private: leadership with members.view_contact only; the database format check still applies).
create or replace function public.update_my_member_profile(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  link_keys constant text[] := array['portfolio_url', 'github_url', 'linkedin_url', 'x_url', 'website_url',
                                     'behance_url', 'dribbble_url', 'youtube_url'];
  open_values text[];
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;

  -- Names are the identity recorded when the membership was accepted: only leadership changes them
  -- (admin_update_member). A member sending any name key is refused, never silently ignored.
  if p ?| array['first_name_ar', 'middle_name_ar', 'last_name_ar', 'first_name_en', 'middle_name_en', 'last_name_en'] then
    raise exception 'NAME_LOCKED' using errcode = 'P0001';
  end if;

  if p ? 'open_to' then
    open_values := array(select jsonb_array_elements_text(p -> 'open_to'));
  end if;

  update public.members set
    headline_ar    = case when p ? 'headline_ar'    then nullif(btrim(p ->> 'headline_ar'), '') else headline_ar end,
    headline_en    = case when p ? 'headline_en'    then nullif(btrim(p ->> 'headline_en'), '') else headline_en end,
    about_ar       = case when p ? 'about_ar'       then nullif(btrim(p ->> 'about_ar'), '') else about_ar end,
    about_en       = case when p ? 'about_en'       then nullif(btrim(p ->> 'about_en'), '') else about_en end,
    open_to        = case when p ? 'open_to'        then open_values else open_to end,
    phone          = case when p ? 'phone'          then nullif(btrim(p ->> 'phone'), '') else phone end,
    academic_status = case when p ? 'academic_status' then nullif(p ->> 'academic_status', '') else academic_status end,
    university_id  = case when p ? 'university_id'  then nullif(p ->> 'university_id', '')::smallint else university_id end,
    major_id       = case when p ? 'major_id'       then nullif(p ->> 'major_id', '')::smallint else major_id end,
    sub_major_id   = case when p ? 'sub_major_id'   then nullif(p ->> 'sub_major_id', '')::smallint else sub_major_id end,
    track_id       = case when p ? 'track_id'       then nullif(p ->> 'track_id', '')::smallint else track_id end,
    portfolio_url  = case when p ? 'portfolio_url'  then nullif(btrim(p ->> 'portfolio_url'), '') else portfolio_url end,
    github_url     = case when p ? 'github_url'     then nullif(btrim(p ->> 'github_url'), '') else github_url end,
    linkedin_url   = case when p ? 'linkedin_url'   then nullif(btrim(p ->> 'linkedin_url'), '') else linkedin_url end,
    x_url          = case when p ? 'x_url'          then nullif(btrim(p ->> 'x_url'), '') else x_url end,
    website_url    = case when p ? 'website_url'    then nullif(btrim(p ->> 'website_url'), '') else website_url end,
    behance_url    = case when p ? 'behance_url'    then nullif(btrim(p ->> 'behance_url'), '') else behance_url end,
    dribbble_url   = case when p ? 'dribbble_url'   then nullif(btrim(p ->> 'dribbble_url'), '') else dribbble_url end,
    youtube_url    = case when p ? 'youtube_url'    then nullif(btrim(p ->> 'youtube_url'), '') else youtube_url end,
    is_directory_visible = case when p ? 'is_directory_visible' then (p ->> 'is_directory_visible')::boolean else is_directory_visible end,
    show_university = case when p ? 'show_university' then (p ->> 'show_university')::boolean else show_university end,
    show_track     = case when p ? 'show_track'     then (p ->> 'show_track')::boolean else show_track end,
    show_photo     = case when p ? 'show_photo'     then (p ->> 'show_photo')::boolean else show_photo end,
    show_participation = case when p ? 'show_participation' then (p ->> 'show_participation')::boolean else show_participation end,
    show_headline  = case when p ? 'show_headline'  then (p ->> 'show_headline')::boolean else show_headline end,
    show_about     = case when p ? 'show_about'     then (p ->> 'show_about')::boolean else show_about end,
    show_skills    = case when p ? 'show_skills'    then (p ->> 'show_skills')::boolean else show_skills end,
    show_projects  = case when p ? 'show_projects'  then (p ->> 'show_projects')::boolean else show_projects end,
    show_open_to   = case when p ? 'show_open_to'   then (p ->> 'show_open_to')::boolean else show_open_to end
  where id = m.id;

  -- Q (links): filling a link is the consent to show it (the design has no separate links switch).
  if p ?| link_keys then
    update public.members set show_links = (
      portfolio_url is not null or github_url is not null or linkedin_url is not null or x_url is not null or
      website_url is not null or behance_url is not null or dribbble_url is not null or youtube_url is not null)
    where id = m.id;
  end if;

  perform private.write_audit('member.profile_updated', 'member', m.id::text, null,
    jsonb_build_object('fields', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.update_my_member_profile(jsonb) from public, anon;
grant execute on function public.update_my_member_profile(jsonb) to authenticated;
