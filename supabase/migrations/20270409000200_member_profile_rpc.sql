-- MEM-011 / MEM-013 (Sprint 17): the member writes their own profile through functions, one editor section at a time.
-- A key that is absent from the payload is left untouched, so each section of the editor saves only its own fields.
-- Ownership rule: the caller must be an active member; there is no permission key (a member edits their own profile).

-- ------------------------------------------------------------------------------------------ 1. the profile
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

  -- Names: a first and a last name in Arabic are required whenever the Arabic name is sent.
  if p ? 'first_name_ar' and nullif(btrim(p ->> 'first_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p ? 'last_name_ar' and nullif(btrim(p ->> 'last_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  if p ? 'open_to' then
    open_values := array(select jsonb_array_elements_text(p -> 'open_to'));
  end if;

  update public.members set
    first_name_ar  = case when p ? 'first_name_ar'  then btrim(p ->> 'first_name_ar') else first_name_ar end,
    middle_name_ar = case when p ? 'middle_name_ar' then nullif(btrim(p ->> 'middle_name_ar'), '') else middle_name_ar end,
    last_name_ar   = case when p ? 'last_name_ar'   then btrim(p ->> 'last_name_ar') else last_name_ar end,
    first_name_en  = case when p ? 'first_name_en'  then nullif(btrim(p ->> 'first_name_en'), '') else first_name_en end,
    middle_name_en = case when p ? 'middle_name_en' then nullif(btrim(p ->> 'middle_name_en'), '') else middle_name_en end,
    last_name_en   = case when p ? 'last_name_en'   then nullif(btrim(p ->> 'last_name_en'), '') else last_name_en end,
    headline_ar    = case when p ? 'headline_ar'    then nullif(btrim(p ->> 'headline_ar'), '') else headline_ar end,
    headline_en    = case when p ? 'headline_en'    then nullif(btrim(p ->> 'headline_en'), '') else headline_en end,
    about_ar       = case when p ? 'about_ar'       then nullif(btrim(p ->> 'about_ar'), '') else about_ar end,
    about_en       = case when p ? 'about_en'       then nullif(btrim(p ->> 'about_en'), '') else about_en end,
    open_to        = case when p ? 'open_to'        then open_values else open_to end,
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

-- ------------------------------------------------------------------------------------------ 2. skills (ordered, up to 12)
create or replace function public.set_my_skills(p_slugs text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  wanted text[] := coalesce(p_slugs, '{}'::text[]);
  found_count int;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if cardinality(wanted) > 12 then raise exception 'LIMIT_REACHED' using errcode = 'P0001'; end if;
  if (select count(distinct x) from unnest(wanted) x) <> cardinality(wanted) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  select count(*) into found_count from public.skills where slug = any (wanted) and is_active;
  if found_count <> cardinality(wanted) then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;

  delete from public.member_skills where member_id = m.id;
  insert into public.member_skills (member_id, skill_id, position)
  select m.id, s.id, (w.ord - 1)::smallint
  from unnest(wanted) with ordinality as w(slug, ord)
  join public.skills s on s.slug = w.slug;

  perform private.write_audit('member.skills_updated', 'member', m.id::text, null,
    jsonb_build_object('count', cardinality(wanted)));
end;
$$;
revoke all on function public.set_my_skills(text[]) from public, anon;
grant execute on function public.set_my_skills(text[]) to authenticated;

-- ------------------------------------------------------------------------------------------ 3. projects (up to 6)
create or replace function public.save_my_project(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_cover text := nullif(btrim(p ->> 'cover_path'), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  -- A cover image must live in the member's own folder.
  if v_cover is not null and v_cover not like caller::text || '/%' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.member_projects (member_id, position, title_ar, title_en, description_ar, description_en, url, cover_path)
    values (m.id, coalesce((select max(position) + 1 from public.member_projects where member_id = m.id), 0),
            btrim(p ->> 'title_ar'), nullif(btrim(p ->> 'title_en'), ''), nullif(btrim(p ->> 'description_ar'), ''),
            nullif(btrim(p ->> 'description_en'), ''), btrim(p ->> 'url'), v_cover)
    returning id into v_id;
  else
    update public.member_projects set
      title_ar = btrim(p ->> 'title_ar'), title_en = nullif(btrim(p ->> 'title_en'), ''),
      description_ar = nullif(btrim(p ->> 'description_ar'), ''), description_en = nullif(btrim(p ->> 'description_en'), ''),
      url = btrim(p ->> 'url'),
      cover_path = case when p ? 'cover_path' then v_cover else cover_path end
    where id = v_id and member_id = m.id;
    if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  end if;
  return v_id;
exception
  when check_violation or invalid_text_representation or not_null_violation then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.save_my_project(jsonb) from public, anon;
grant execute on function public.save_my_project(jsonb) to authenticated;

create or replace function public.delete_my_project(p_id uuid)
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
  select * into m from public.members where user_id = caller;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  delete from public.member_projects where id = p_id and member_id = m.id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
end;
$$;
revoke all on function public.delete_my_project(uuid) from public, anon;
grant execute on function public.delete_my_project(uuid) to authenticated;

create or replace function public.reorder_my_projects(p_ids uuid[])
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
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if cardinality(p_ids) <> (select count(*) from public.member_projects where member_id = m.id)
     or exists (select 1 from unnest(p_ids) i where not exists
                (select 1 from public.member_projects x where x.id = i and x.member_id = m.id)) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  update public.member_projects x set position = (o.ord - 1)::smallint
  from unnest(p_ids) with ordinality as o(id, ord)
  where x.id = o.id and x.member_id = m.id;
end;
$$;
revoke all on function public.reorder_my_projects(uuid[]) from public, anon;
grant execute on function public.reorder_my_projects(uuid[]) to authenticated;
