-- Sprint 18 · leadership edits the whole member profile (owner decision after Q-M8): names, phone, study, headline,
-- about text, "open to", links, skills and projects. The visibility switches (what is public) and the photo stay with
-- the member. Everything needs members.manage, is audited, and refuses unknown members.

create or replace function public.admin_update_member(p_id uuid, p jsonb)
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
    phone          = case when p ? 'phone'          then nullif(btrim(p ->> 'phone'), '') else phone end,
    academic_status = case when p ? 'academic_status' then nullif(p ->> 'academic_status', '') else academic_status end,
    university_id  = case when p ? 'university_id'  then nullif(p ->> 'university_id', '')::smallint else university_id end,
    major_id       = case when p ? 'major_id'       then nullif(p ->> 'major_id', '')::smallint else major_id end,
    sub_major_id   = case when p ? 'sub_major_id'   then nullif(p ->> 'sub_major_id', '')::smallint else sub_major_id end,
    track_id       = case when p ? 'track_id'       then nullif(p ->> 'track_id', '')::smallint else track_id end,
    headline_ar    = case when p ? 'headline_ar'    then nullif(btrim(p ->> 'headline_ar'), '') else headline_ar end,
    headline_en    = case when p ? 'headline_en'    then nullif(btrim(p ->> 'headline_en'), '') else headline_en end,
    about_ar       = case when p ? 'about_ar'       then nullif(btrim(p ->> 'about_ar'), '') else about_ar end,
    about_en       = case when p ? 'about_en'       then nullif(btrim(p ->> 'about_en'), '') else about_en end,
    open_to        = case when p ? 'open_to'        then open_values else open_to end,
    portfolio_url  = case when p ? 'portfolio_url'  then nullif(btrim(p ->> 'portfolio_url'), '') else portfolio_url end,
    github_url     = case when p ? 'github_url'     then nullif(btrim(p ->> 'github_url'), '') else github_url end,
    linkedin_url   = case when p ? 'linkedin_url'   then nullif(btrim(p ->> 'linkedin_url'), '') else linkedin_url end,
    x_url          = case when p ? 'x_url'          then nullif(btrim(p ->> 'x_url'), '') else x_url end,
    website_url    = case when p ? 'website_url'    then nullif(btrim(p ->> 'website_url'), '') else website_url end,
    behance_url    = case when p ? 'behance_url'    then nullif(btrim(p ->> 'behance_url'), '') else behance_url end,
    dribbble_url   = case when p ? 'dribbble_url'   then nullif(btrim(p ->> 'dribbble_url'), '') else dribbble_url end,
    youtube_url    = case when p ? 'youtube_url'    then nullif(btrim(p ->> 'youtube_url'), '') else youtube_url end
  where id = m.id;

  if p ?| link_keys then
    update public.members set show_links = (
      portfolio_url is not null or github_url is not null or linkedin_url is not null or x_url is not null or
      website_url is not null or behance_url is not null or dribbble_url is not null or youtube_url is not null)
    where id = m.id;
  end if;

  perform private.write_audit('member.updated_by_staff', 'member', m.id::text, null,
    jsonb_build_object('fields', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.admin_update_member(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_member(uuid, jsonb) to authenticated;

-- Skills, in order (at most 12, no duplicates, only active ones).
create or replace function public.admin_set_member_skills(p_id uuid, p_slugs text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text[] := coalesce(p_slugs, '{}'::text[]);
  found_count int;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.members where id = p_id) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if cardinality(wanted) > 12 then raise exception 'LIMIT_REACHED' using errcode = 'P0001'; end if;
  if (select count(distinct x) from unnest(wanted) x) <> cardinality(wanted) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  select count(*) into found_count from public.skills where slug = any (wanted) and is_active;
  if found_count <> cardinality(wanted) then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;

  delete from public.member_skills where member_id = p_id;
  insert into public.member_skills (member_id, skill_id, position)
  select p_id, s.id, (w.ord - 1)::smallint
  from unnest(wanted) with ordinality as w(slug, ord)
  join public.skills s on s.slug = w.slug;

  perform private.write_audit('member.skills_updated_by_staff', 'member', p_id::text, null,
    jsonb_build_object('count', cardinality(wanted)));
end;
$$;
revoke all on function public.admin_set_member_skills(uuid, text[]) from public, anon;
grant execute on function public.admin_set_member_skills(uuid, text[]) to authenticated;

-- Projects: the text and the link (covers stay with the member).
create or replace function public.admin_member_projects(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'title_ar', p.title_ar, 'title_en', p.title_en,
                      'description_ar', p.description_ar, 'description_en', p.description_en, 'url', p.url) order by p.position)
                    from public.member_projects p where p.member_id = p_id), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_member_projects(uuid) from public, anon;
grant execute on function public.admin_member_projects(uuid) to authenticated;

create or replace function public.admin_save_member_project(p_member uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := nullif(p ->> 'id', '')::uuid;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.members where id = p_member) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;

  if v_id is null then
    if (select count(*) from public.member_projects where member_id = p_member) >= 6 then
      raise exception 'LIMIT_REACHED' using errcode = 'P0001';
    end if;
    insert into public.member_projects (member_id, position, title_ar, title_en, description_ar, description_en, url)
    values (p_member, coalesce((select max(position) + 1 from public.member_projects where member_id = p_member), 0),
            btrim(p ->> 'title_ar'), nullif(btrim(p ->> 'title_en'), ''), nullif(btrim(p ->> 'description_ar'), ''),
            nullif(btrim(p ->> 'description_en'), ''), btrim(p ->> 'url'))
    returning id into v_id;
  else
    update public.member_projects set
      title_ar = btrim(p ->> 'title_ar'), title_en = nullif(btrim(p ->> 'title_en'), ''),
      description_ar = nullif(btrim(p ->> 'description_ar'), ''), description_en = nullif(btrim(p ->> 'description_en'), ''),
      url = btrim(p ->> 'url')
    where id = v_id and member_id = p_member;
    if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  end if;
  perform private.write_audit('member.project_saved_by_staff', 'member', p_member::text, null, jsonb_build_object('project', v_id));
  return v_id;
exception
  when check_violation or invalid_text_representation or not_null_violation then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;
revoke all on function public.admin_save_member_project(uuid, jsonb) from public, anon;
grant execute on function public.admin_save_member_project(uuid, jsonb) to authenticated;

create or replace function public.admin_delete_member_project(p_member uuid, p_project uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  delete from public.member_projects where id = p_project and member_id = p_member;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  perform private.write_audit('member.project_deleted_by_staff', 'member', p_member::text, null, jsonb_build_object('project', p_project));
end;
$$;
revoke all on function public.admin_delete_member_project(uuid, uuid) from public, anon;
grant execute on function public.admin_delete_member_project(uuid, uuid) to authenticated;
