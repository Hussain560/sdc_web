-- MEM-015 (Sprint 17): the dashboard list and the member detail with the complete picture.
-- Reads that cross tables (account, last sign-in, positions, skills) run with the owner's rights behind explicit
-- permission checks. E-mail and phone need the new key `members.view_contact`; without it the contact column is
-- absent, not hidden by the page.

insert into public.permissions (key, module, description_ar, description_en) values
  ('members.view_contact', 'members', 'عرض البريد الإلكتروني والجوال للأعضاء', 'See the e-mail and phone of members')
on conflict (key) do nothing;
insert into public.role_permissions (role_key, permission_key) values
  ('system_admin', 'members.view_contact'), ('community_leader', 'members.view_contact')
on conflict do nothing;

-- ------------------------------------------------------------------------------------------ completeness
-- The same five checks as src/modules/members/completeness.ts, 20 % each: a photo, a headline, an about text, three or
-- more skills, one or more links. Both are tested against tests/fixtures/completeness-cases.json.
create or replace function private.member_completeness(m public.members)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select 20 * (
    (nullif(btrim(coalesce(m.photo_path, '')), '') is not null)::int
    + (coalesce(nullif(btrim(coalesce(m.headline_ar, '')), ''), nullif(btrim(coalesce(m.headline_en, '')), '')) is not null)::int
    + (coalesce(nullif(btrim(coalesce(m.about_ar, '')), ''), nullif(btrim(coalesce(m.about_en, '')), '')) is not null)::int
    + ((select count(*) from public.member_skills ms where ms.member_id = m.id) >= 3)::int
    + ((select count(*) from unnest(array[m.portfolio_url, m.github_url, m.linkedin_url, m.x_url, m.website_url,
                                          m.behance_url, m.dribbble_url, m.youtube_url]) u
         where nullif(btrim(coalesce(u, '')), '') is not null) >= 1)::int
  );
$$;
revoke all on function private.member_completeness(public.members) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ the list
create or replace function public.admin_list_members(
  p_status text default null,        -- active | inactive | suspended | not_activated | unclaimed
  p_q text default null,             -- any part of a name in either language (and the e-mail with members.view_contact)
  p_committee text default null,     -- a committee slug, or 'none'
  p_track integer default null,
  p_completeness text default null,  -- complete | low (under 40 %)
  p_from integer default 0,
  p_to integer default 19
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  can_contact boolean;
  q text := btrim(coalesce(p_q, ''));
  pattern text;
  result jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not (private.has_permission('members.view') or private.has_permission('members.manage')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  can_contact := private.has_permission('members.view_contact');
  pattern := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  with base as (
    select
      m.id, m.user_id, m.status, m.status_reason, m.joined_at, m.track_id, m.photo_path,
      (m.is_directory_visible and m.status = 'active') as listed,
      btrim(concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar)) as name_ar,
      nullif(btrim(concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en)), '') as name_en,
      p.email,
      (m.user_id is not null and au.last_sign_in_at is not null) as activated,
      private.member_completeness(m) as pct,
      cm.committee_slug, cm.committee_ar, cm.committee_en, cm.role_ar, cm.role_en
    from public.members m
    left join public.profiles p on p.id = m.user_id
    left join auth.users au on au.id = m.user_id
    left join lateral (
      select c.slug as committee_slug, c.name_ar as committee_ar, coalesce(c.name_en, c.name_ar) as committee_en,
             r.name_ar as role_ar, r.name_en as role_en
      from public.role_assignments ra
      join public.roles r on r.key = ra.role_key
      left join public.committees c on c.id = ra.committee_id
      where ra.user_id = m.user_id and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())
      order by r.display_order, c.display_order nulls last
      limit 1
    ) cm on true
  ),
  filtered as (
    select * from base b
    where (p_status is null
           or (p_status = 'not_activated' and b.status = 'active' and b.user_id is not null and not b.activated)
           or (p_status = 'unclaimed' and b.user_id is null)
           or (p_status in ('active', 'inactive', 'suspended') and b.status = p_status))
      and (p_committee is null
           or (p_committee = 'none' and not exists (
                 select 1 from public.role_assignments ra where ra.user_id = b.user_id and ra.committee_id is not null
                   and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())))
           or (p_committee <> 'none' and exists (
                 select 1 from public.role_assignments ra join public.committees c on c.id = ra.committee_id
                 where ra.user_id = b.user_id and c.slug = p_committee
                   and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now()))))
      and (p_track is null or b.track_id = p_track)
      and (p_completeness is null or (p_completeness = 'complete' and b.pct = 100) or (p_completeness = 'low' and b.pct < 40))
      and (q = '' or b.name_ar ilike pattern or b.name_en ilike pattern or (can_contact and b.email ilike pattern))
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'user_id', f.user_id, 'status', f.status, 'name_ar', f.name_ar, 'name_en', f.name_en,
        'email', case when can_contact then f.email end, 'photo_path', f.photo_path,
        'activated', f.activated, 'linked', f.user_id is not null, 'listed', f.listed,
        'completeness', f.pct, 'joined_at', f.joined_at,
        'committee_ar', f.committee_ar, 'committee_en', f.committee_en, 'role_ar', f.role_ar, 'role_en', f.role_en
      ) order by f.name_ar, f.id)
      from (select * from filtered order by name_ar, id offset greatest(p_from, 0) limit greatest(p_to - p_from + 1, 0)) f
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'all', (select count(*) from base),
      'active', (select count(*) from base where status = 'active'),
      'inactive', (select count(*) from base where status = 'inactive'),
      'suspended', (select count(*) from base where status = 'suspended'),
      'not_activated', (select count(*) from base where status = 'active' and user_id is not null and not activated),
      'unclaimed', (select count(*) from base where user_id is null)),
    'kpis', jsonb_build_object(
      'active', (select count(*) from base where status = 'active'),
      'listed', (select count(*) from base where listed),
      'avg_completeness', coalesce((select round(avg(pct))::int from base where status = 'active'), 0),
      'low_completeness', (select count(*) from base where status = 'active' and pct < 40)),
    'can_contact', can_contact
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_list_members(text, text, text, integer, text, integer, integer) from public, anon;
grant execute on function public.admin_list_members(text, text, text, integer, text, integer, integer) to authenticated;

-- ------------------------------------------------------------------------------------------ the detail
create or replace function public.admin_member_detail(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  can_contact boolean;
  m public.members;
  pr public.profiles;
  au auth.users;
  result jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not (private.has_permission('members.view') or private.has_permission('members.manage')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  can_contact := private.has_permission('members.view_contact');
  select * into m from public.members where id = p_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if m.user_id is not null then
    select * into pr from public.profiles where id = m.user_id;
    select * into au from auth.users where id = m.user_id;
  end if;

  select jsonb_build_object(
    'member', jsonb_build_object(
      'id', m.id, 'status', m.status, 'status_reason', m.status_reason, 'joined_at', m.joined_at,
      'joined_via', m.joined_via, 'legacy', m.legacy_id is not null,
      'listed', m.is_directory_visible and m.status = 'active',
      'first_name_ar', m.first_name_ar, 'middle_name_ar', m.middle_name_ar, 'last_name_ar', m.last_name_ar,
      'first_name_en', m.first_name_en, 'middle_name_en', m.middle_name_en, 'last_name_en', m.last_name_en,
      'academic_status', m.academic_status,
      'university_ar', (select name_ar from public.universities where id = m.university_id),
      'university_en', (select name_en from public.universities where id = m.university_id),
      'major_ar', (select name_ar from public.majors where id = m.major_id),
      'major_en', (select name_en from public.majors where id = m.major_id),
      'track_ar', (select name_ar from public.tracks where id = m.track_id),
      'track_en', (select name_en from public.tracks where id = m.track_id),
      'headline_ar', m.headline_ar, 'headline_en', m.headline_en, 'about_ar', m.about_ar, 'about_en', m.about_en,
      'open_to', m.open_to, 'photo_path', m.photo_path,
      'links', jsonb_build_object('portfolio', m.portfolio_url, 'github', m.github_url, 'linkedin', m.linkedin_url,
                                  'x', m.x_url, 'website', m.website_url, 'behance', m.behance_url,
                                  'dribbble', m.dribbble_url, 'youtube', m.youtube_url),
      'show', jsonb_build_object('photo', m.show_photo, 'headline', m.show_headline, 'about', m.show_about,
                                 'skills', m.show_skills, 'projects', m.show_projects, 'open_to', m.show_open_to,
                                 'university', m.show_university, 'track', m.show_track, 'links', m.show_links,
                                 'participation', m.show_participation),
      'cycle_name_ar', (select c.name_ar from public.membership_cycles c where c.id = m.joined_cycle_id)),
    'account', case when m.user_id is null then null else jsonb_build_object(
      'user_id', m.user_id,
      'email', case when can_contact then pr.email end,
      'phone', case when can_contact then m.phone end,
      'activated', au.last_sign_in_at is not null,
      'created_at', au.created_at,
      'last_sign_in_at', case when can_contact then au.last_sign_in_at end) end,
    'completeness', private.member_completeness(m),
    'can_contact', can_contact,
    'skills', coalesce((select jsonb_agg(jsonb_build_object('slug', s.slug, 'name_ar', s.name_ar, 'name_en', s.name_en,
                                                           'category', s.category) order by ms.position)
                        from public.member_skills ms join public.skills s on s.id = ms.skill_id
                        where ms.member_id = m.id), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'title_ar', p.title_ar, 'title_en', p.title_en,
                                                             'url', p.url) order by p.position)
                          from public.member_projects p where p.member_id = m.id), '[]'::jsonb),
    'positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ra.id, 'role_key', ra.role_key, 'role_ar', r.name_ar, 'role_en', r.name_en,
        'committee_slug', c.slug, 'committee_ar', c.name_ar, 'committee_en', coalesce(c.name_en, c.name_ar),
        'starts_at', ra.starts_at, 'ends_at', ra.ends_at, 'end_reason', ra.end_reason,
        'active', ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now()),
        'assigned_by_ar', (select full_name_ar from public.profiles x where x.id = ra.assigned_by)
      ) order by ra.starts_at desc)
      from public.role_assignments ra
      join public.roles r on r.key = ra.role_key
      left join public.committees c on c.id = ra.committee_id
      where ra.user_id = m.user_id), '[]'::jsonb),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', er.id, 'event_slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en,
                                          'start_date', e.start_date, 'status', er.status,
                                          'attendance', er.attendance_result) order by e.start_date desc)
      from (select * from public.event_registrations where user_id = m.user_id order by created_at desc limit 50) er
      join public.events e on e.id = er.event_id), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'cycle_ar', c.name_ar, 'cycle_en', c.name_en, 'status', a.status,
                                          'submitted_at', a.submitted_at, 'decided_at', a.decided_at) order by a.created_at desc)
      from public.membership_applications a join public.membership_cycles c on c.id = a.cycle_id
      where a.user_id = m.user_id), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(jsonb_build_object('at', l.occurred_at, 'action', l.action,
                                          'actor_ar', (select full_name_ar from public.profiles x where x.id = l.actor_id)) order by l.occurred_at desc)
      from (select * from public.audit_logs
            where (entity_type = 'member' and entity_id = m.id::text)
               or (m.user_id is not null and entity_type = 'role_assignment' and (summary ->> 'user_id') = m.user_id::text)
            order by occurred_at desc limit 50) l), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_member_detail(uuid) from public, anon;
grant execute on function public.admin_member_detail(uuid) to authenticated;
