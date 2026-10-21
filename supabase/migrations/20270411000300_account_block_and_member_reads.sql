-- Sprint 18 · ACC-008, MEM-018, MEM-019 — block / unblock accounts (users.block), the members list and detail reads
-- with the new lifecycle (term, "ending soon", pending leave requests) and the one-timeline history.

-- ------------------------------------------------------------------------------------------ 1. permission
insert into public.permissions (key, module, description_ar, description_en) values
  ('users.block', 'users', 'حظر الحسابات ورفع الحظر', 'Block and unblock accounts')
on conflict (key) do nothing;
insert into public.role_permissions (role_key, permission_key) values
  ('system_admin', 'users.block'), ('community_leader', 'users.block')
on conflict do nothing;

-- ------------------------------------------------------------------------------------------ 2. blocked accounts
alter table public.profiles
  add column blocked_at     timestamptz,
  add column blocked_by     uuid references public.profiles (id) on delete set null,
  add column blocked_reason text check (char_length(blocked_reason) <= 500);

-- A blocked person must not read their own block reason through the profile row: it is internal.
-- (The members table no longer holds internal reasons either; see member_lifecycle.)
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
        update auth.users set banned_until = 'infinity' where auth.users.id = id;
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

create or replace function public.unblock_accounts(p_ids uuid[], p_note text default null)
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
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('users.block') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 or char_length(coalesce(p_note, '')) > 500 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  foreach id in array p_ids loop
    select * into pr from public.profiles where public.profiles.id = id for update;
    if not found then code := 'NOT_FOUND';
    elsif pr.blocked_at is null then code := 'INVALID_TRANSITION';
    else
      code := null;
      update public.profiles set blocked_at = null, blocked_by = null, blocked_reason = null where public.profiles.id = id;
      begin
        update auth.users set banned_until = null where auth.users.id = id;
      exception when others then null;
      end;
      select * into m from public.members where public.members.user_id = id;
      if found then perform private.add_member_event(m.id, 'unblocked', jsonb_build_object('note', nullif(btrim(coalesce(p_note, '')), ''))); end if;
      perform private.write_audit('account.unblocked', 'profile', id::text, null, jsonb_build_object('note', nullif(btrim(coalesce(p_note, '')), '')));
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

-- What the signed-in person sees after sign-in (blocked / suspended / expired / ended). Reasons stay internal: only
-- the category of a suspension and the dates are returned.
create or replace function public.my_account_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  pr public.profiles;
  m public.members;
  r public.member_leave_requests;
begin
  if caller is null then return null; end if;
  select * into pr from public.profiles where id = caller;
  select * into m from public.members where user_id = caller;
  select * into r from public.member_leave_requests where member_id = m.id and status = 'pending';
  return jsonb_build_object(
    'blocked', pr.blocked_at is not null,
    'member', case when m.id is null then null else jsonb_build_object(
      'id', m.id, 'status', m.status, 'end_reason', m.end_reason, 'term_starts_at', m.term_starts_at,
      'term_ends_at', m.term_ends_at, 'suspension_category', m.suspension_category, 'suspended_until', m.suspended_until,
      'ended_at', m.ended_at, 'member_no', 'SDC-M-' || lpad(m.member_no::text, 6, '0'), 'joined_at', m.joined_at,
      'onboarded_at', m.onboarded_at, 'onboarding_step', m.onboarding_step, 'renewal_requested_at', m.renewal_requested_at,
      'leaves_on', m.leaves_on,
      'leave_request', case when r.id is null then null else jsonb_build_object(
        'id', r.id, 'created_at', r.created_at, 'preferred_last_day', r.preferred_last_day, 'reason', r.reason) end) end);
end;
$$;
revoke all on function public.my_account_state() from public, anon;
grant execute on function public.my_account_state() to authenticated;

-- ------------------------------------------------------------------------------------------ 3. the members list v2
create or replace function public.admin_list_members(
  p_status text default null,        -- active | ending_soon | not_activated | suspended | expired | ended | unclaimed | leave_requests
  p_q text default null,
  p_committee text default null,
  p_track integer default null,
  p_completeness text default null,
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
  today date := private.today_riyadh();
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not (private.has_permission('members.view') or private.has_permission('members.manage')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  can_contact := private.has_permission('members.view_contact');
  pattern := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';

  with base as (
    select
      m.id, m.user_id, m.status, m.joined_at, m.track_id, m.photo_path, m.member_no, m.term_ends_at, m.end_reason,
      m.suspension_category, m.suspended_until, m.leaves_on,
      (m.is_directory_visible and m.status = 'active') as listed,
      btrim(concat_ws(' ', m.first_name_ar, m.middle_name_ar, m.last_name_ar)) as name_ar,
      nullif(btrim(concat_ws(' ', m.first_name_en, m.middle_name_en, m.last_name_en)), '') as name_en,
      p.email,
      (m.user_id is not null and (m.activated_at is not null or au.last_sign_in_at is not null)) as activated,
      (m.status = 'active' and m.term_ends_at is not null and m.term_ends_at - today <= 30) as ending_soon,
      (m.term_ends_at - today) as days_left,
      lr.id as leave_request_id, lr.created_at as leave_requested_at, lr.reason as leave_reason, lr.preferred_last_day,
      private.member_completeness(m) as pct,
      cm.committee_slug, cm.committee_ar, cm.committee_en, cm.role_ar, cm.role_en
    from public.members m
    left join public.profiles p on p.id = m.user_id
    left join auth.users au on au.id = m.user_id
    left join public.member_leave_requests lr on lr.member_id = m.id and lr.status = 'pending'
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
           or (p_status = 'ending_soon' and b.ending_soon)
           or (p_status = 'leave_requests' and b.leave_request_id is not null)
           or (p_status in ('active', 'suspended', 'expired', 'ended') and b.status = p_status))
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
      and (q = '' or b.name_ar ilike pattern or b.name_en ilike pattern or (can_contact and b.email ilike pattern)
           or ('SDC-M-' || lpad(b.member_no::text, 6, '0')) ilike pattern)
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'user_id', f.user_id, 'status', f.status, 'name_ar', f.name_ar, 'name_en', f.name_en,
        'email', case when can_contact then f.email end, 'photo_path', f.photo_path,
        'member_no', 'SDC-M-' || lpad(f.member_no::text, 6, '0'),
        'term_ends_at', f.term_ends_at, 'days_left', f.days_left, 'ending_soon', f.ending_soon,
        'end_reason', f.end_reason, 'suspension_category', f.suspension_category, 'suspended_until', f.suspended_until,
        'leaves_on', f.leaves_on,
        'leave_request', case when f.leave_request_id is null then null else jsonb_build_object(
          'id', f.leave_request_id, 'created_at', f.leave_requested_at, 'reason', f.leave_reason, 'preferred_last_day', f.preferred_last_day) end,
        'activated', f.activated, 'linked', f.user_id is not null, 'listed', f.listed,
        'completeness', f.pct, 'joined_at', f.joined_at,
        'committee_ar', f.committee_ar, 'committee_en', f.committee_en, 'role_ar', f.role_ar, 'role_en', f.role_en
      ) order by f.name_ar, f.id)
      from (select * from filtered order by name_ar, id offset greatest(p_from, 0) limit greatest(p_to - p_from + 1, 0)) f
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'all', (select count(*) from base),
      'active', (select count(*) from base where status = 'active'),
      'ending_soon', (select count(*) from base where ending_soon),
      'not_activated', (select count(*) from base where status = 'active' and user_id is not null and not activated),
      'suspended', (select count(*) from base where status = 'suspended'),
      'expired', (select count(*) from base where status = 'expired'),
      'ended', (select count(*) from base where status = 'ended'),
      'unclaimed', (select count(*) from base where user_id is null),
      'leave_requests', (select count(*) from base where leave_request_id is not null)),
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

-- ------------------------------------------------------------------------------------------ 4. the detail v2 (one timeline)
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
      'id', m.id, 'status', m.status, 'joined_at', m.joined_at,
      'member_no', 'SDC-M-' || lpad(m.member_no::text, 6, '0'),
      'term_starts_at', m.term_starts_at, 'term_ends_at', m.term_ends_at, 'end_reason', m.end_reason,
      'suspension_category', m.suspension_category, 'suspended_until', m.suspended_until, 'leaves_on', m.leaves_on,
      'ended_at', m.ended_at, 'activated_at', m.activated_at, 'onboarded_at', m.onboarded_at,
      'renewal_requested_at', m.renewal_requested_at, 'card_active', m.card_token is not null,
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
      'activated', (m.activated_at is not null or au.last_sign_in_at is not null),
      'blocked', pr.blocked_at is not null,
      'blocked_at', pr.blocked_at,
      'created_at', au.created_at,
      'last_sign_in_at', case when can_contact then au.last_sign_in_at end) end,
    'completeness', private.member_completeness(m),
    'can_contact', can_contact,
    'leave_request', (select jsonb_build_object('id', r.id, 'created_at', r.created_at, 'reason', r.reason, 'preferred_last_day', r.preferred_last_day)
                        from public.member_leave_requests r where r.member_id = m.id and r.status = 'pending'),
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
      select jsonb_agg(jsonb_build_object('id', a.id, 'reference', a.reference, 'cycle_ar', c.name_ar, 'cycle_en', c.name_en, 'status', a.status,
                                          'submitted_at', a.submitted_at, 'decided_at', a.decided_at,
                                          'score_average', (select s.average from private.application_score(a.id) s)) order by a.created_at desc)
      from public.membership_applications a join public.membership_cycles c on c.id = a.cycle_id
      where a.user_id = m.user_id or a.id = m.application_id), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'at', e.created_at, 'kind', e.kind, 'data', e.data,
                                          'actor_ar', (select full_name_ar from public.profiles x where x.id = e.actor_id)) order by e.created_at desc, e.id desc)
      from (select * from public.member_events where member_id = m.id order by created_at desc, id desc limit 200) e), '[]'::jsonb),
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

do $$
declare f text;
begin
  foreach f in array array['block_accounts(uuid[], text)', 'unblock_accounts(uuid[], text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
