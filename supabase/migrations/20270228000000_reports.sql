-- Sprint 11 · RPT-001, RPT-002 — reports derived from operational data, ONE definition per metric
-- (docs/11-modules/reports/README.md §5, docs/03-business-domain/reporting-model.md). Q-008 (the exact KPI set) is open:
-- the proposed catalogue is implemented; public statistics are not (RP-2 would need a decision first).
-- Every function checks its own permission, so a count can never include rows the caller may not see.

-- The metrics of one period, optionally for one committee. Used for the period and for the previous one (the deltas).
create or replace function private.report_metrics(p_from date, p_to date, p_committee uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ev as (
    select e.id, e.committee_id, e.attendance_finalized_at,
           coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date) as last_date
    from public.events e
    where e.status in ('published', 'completed') and (p_committee is null or e.committee_id = p_committee)
  ),
  held as (select id from ev where last_date between p_from and p_to),
  reg as (
    select r.* from public.event_registrations r join public.events e on e.id = r.event_id
    where (r.created_at at time zone 'Asia/Riyadh')::date between p_from and p_to
      and (p_committee is null or e.committee_id = p_committee)
  ),
  att as (
    select r.attendance_percent from public.event_registrations r join ev on ev.id = r.event_id
    where r.status = 'accepted' and r.attendance_percent is not null and ev.attendance_finalized_at is not null
      and ev.last_date between p_from and p_to
  )
  select jsonb_build_object(
    'events_held', (select count(*) from held),
    'registrations', (select count(*) from reg),
    'accepted', (select count(*) from reg where status = 'accepted'),
    'rejected', (select count(*) from reg where status = 'rejected'),
    'acceptance_rate', (select case when count(*) filter (where status in ('accepted', 'rejected')) = 0 then null
        else round(100.0 * count(*) filter (where status = 'accepted') / count(*) filter (where status in ('accepted', 'rejected'))) end from reg),
    -- RP-4: events without finalized attendance are left out ("not recorded"), never counted as 0 %.
    'attendance_rate', (select round(avg(attendance_percent)) from att),
    'attendance_events', (select count(*) from ev where attendance_finalized_at is not null and last_date between p_from and p_to),
    'member_share', (select case when count(*) = 0 then null else round(100.0 * count(*) filter (where was_member) / count(*)) end from reg),
    'articles_published', (select count(*) from public.articles a
        where a.published_at is not null and (a.published_at at time zone 'Asia/Riyadh')::date between p_from and p_to
          and (p_committee is null or a.committee_id = p_committee)),
    'certificates_sent', (select count(*) from public.certificates c join public.events e on e.id = c.event_id
        where c.delivery_status = 'sent' and (c.sent_at at time zone 'Asia/Riyadh')::date between p_from and p_to
          and (p_committee is null or e.committee_id = p_committee)),
    -- Members at the period end (community) / active committee positions at the period end (one committee).
    'active_members', case when p_committee is null then
        (select count(*) from public.members m where m.joined_at::date <= p_to and (m.ended_at is null or m.ended_at::date > p_to) and m.status = 'active')
      else null end,
    'new_members', case when p_committee is null then
        (select count(*) from public.members m where m.joined_at::date between p_from and p_to) else null end,
    'committee_size', case when p_committee is not null then
        (select count(*) from public.role_assignments a where a.committee_id = p_committee and a.starts_at::date <= p_to
           and (a.ends_at is null or a.ends_at::date > p_to)) else null end
  )
$$;
revoke all on function private.report_metrics(date, date, uuid) from public, anon, authenticated;

create or replace function private.report_period(p_from date, p_to date)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 1830 then
    raise exception 'INVALID_PERIOD' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function private.report_period(date, date) from public, anon, authenticated;

-- Aggregates under 5 people are shown as "<5" (RP-2 spirit applied to the internal demographic breakdowns).
create or replace function private.mask_small(p_count bigint)
returns jsonb
language sql
immutable
set search_path = ''
as $$ select case when p_count < 5 then 'null'::jsonb else to_jsonb(p_count) end $$;
revoke all on function private.mask_small(bigint) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ community
create or replace function public.community_stats(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  len integer;
  prev_to date;
  prev_from date;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('reports.view_community') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  perform private.report_period(p_from, p_to);
  len := p_to - p_from + 1;
  prev_to := p_from - 1;
  prev_from := prev_to - (len - 1);

  return jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'current', private.report_metrics(p_from, p_to),
    'previous', private.report_metrics(prev_from, prev_to),
    -- Applications submitted in the period, by their current status (the funnel).
    'funnel', (
      select jsonb_build_object(
        'submitted', count(*),
        'accepted', count(*) filter (where status = 'accepted'),
        'rejected', count(*) filter (where status = 'rejected'),
        'waitlisted', count(*) filter (where status = 'waitlisted'),
        'withdrawn', count(*) filter (where status = 'withdrawn'),
        'in_review', count(*) filter (where status in ('submitted', 'under_review')))
      from public.membership_applications a
      where (a.submitted_at at time zone 'Asia/Riyadh')::date between p_from and p_to),
    -- Registrations and attendance by month (attendance only for events with finalized attendance).
    'monthly', coalesce((
      select jsonb_agg(jsonb_build_object(
        'month', to_char(m.month, 'YYYY-MM'),
        'registrations', (select count(*) from public.event_registrations r
            where date_trunc('month', r.created_at at time zone 'Asia/Riyadh') = m.month
              and (r.created_at at time zone 'Asia/Riyadh')::date between p_from and p_to),
        'attendance', (select round(avg(r.attendance_percent)) from public.event_registrations r
            join public.events e on e.id = r.event_id
            where r.status = 'accepted' and r.attendance_percent is not null and e.attendance_finalized_at is not null
              and date_trunc('month', coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date)::timestamp) = m.month
              and coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date) between p_from and p_to)
      ) order by m.month)
      from (select generate_series(date_trunc('month', p_from::timestamp), date_trunc('month', p_to::timestamp), interval '1 month') as month) m
    ), '[]'::jsonb),
    'committees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'slug', c.slug, 'name_ar', c.name_ar, 'name_en', c.name_en, 'status', c.status,
        'metrics', private.report_metrics(p_from, p_to, c.id)) order by c.display_order, c.name_ar)
      from public.committees c where c.status = 'active' or exists (select 1 from public.events e where e.committee_id = c.id)
    ), '[]'::jsonb),
    'academic_status', coalesce((
      select jsonb_agg(jsonb_build_object('key', k, 'count', private.mask_small(n)) order by n desc)
      from (select m.academic_status as k, count(*) as n from public.members m
             where m.status = 'active' and m.joined_at::date <= p_to group by m.academic_status) x), '[]'::jsonb),
    'universities', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name_ar', name_ar, 'name_en', name_en, 'count', private.mask_small(n)) order by n desc)
      from (select u.id, u.name_ar, u.name_en, count(*) as n from public.members m join public.universities u on u.id = m.university_id
             where m.status = 'active' and m.joined_at::date <= p_to group by u.id, u.name_ar, u.name_en order by count(*) desc limit 5) x), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------------------------------------ committee
create or replace function public.committee_stats(p_committee uuid, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.committees;
  len integer;
  prev_to date;
  prev_from date;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into c from public.committees where id = p_committee;
  if not found or not private.has_permission('reports.view_committee', p_committee) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  perform private.report_period(p_from, p_to);
  len := p_to - p_from + 1;
  prev_to := p_from - 1;
  prev_from := prev_to - (len - 1);

  return jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'committee', jsonb_build_object('id', c.id, 'slug', c.slug, 'name_ar', c.name_ar, 'name_en', c.name_en),
    'current', private.report_metrics(p_from, p_to, p_committee),
    'previous', private.report_metrics(prev_from, prev_to, p_committee),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en, 'status', e.status, 'last_date', x.last_date,
        'registrations', (select count(*) from public.event_registrations r where r.event_id = e.id),
        'accepted', (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'accepted'),
        'attendance', case when e.attendance_finalized_at is null then null
          else (select round(avg(r.attendance_percent)) from public.event_registrations r where r.event_id = e.id and r.status = 'accepted' and r.attendance_percent is not null) end
      ) order by x.last_date desc)
      from public.events e
      cross join lateral (select coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date) as last_date) x
      where e.committee_id = p_committee and e.status in ('published', 'completed') and x.last_date between p_from and p_to
    ), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------------------------------------------ work waiting for the caller
-- Counts only what this person may act on (RLS-equivalent checks per committee), plus the first items of the queue.
create or replace function public.pending_queues()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  ev_n integer := 0;
  art_n integer := 0;
  app_n integer := 0;
  reg_n integer := 0;
  changes_n integer := 0;
  mail_n integer := 0;
  items jsonb;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;

  select count(*) into ev_n from public.events e where e.status = 'pending_review' and private.has_permission('events.approve', e.committee_id);
  select count(*) into art_n from public.articles a where a.status = 'in_review' and private.has_permission('articles.publish', a.committee_id);
  if private.has_permission_any_scope('membership.review') then
    select count(*) into app_n from public.membership_applications where status in ('submitted', 'under_review');
  end if;
  select count(*) into reg_n from public.event_registrations r join public.events e on e.id = r.event_id
   where r.status = 'pending' and private.has_permission('registrations.review', e.committee_id);
  select count(*) into changes_n from public.events e where e.status = 'changes_requested' and private.has_permission('events.create', e.committee_id);
  if private.has_permission_any_scope('email_logs.view') then
    select count(*) into mail_n from public.admin_email_logs where state in ('retrying', 'abandoned');
  end if;

  select coalesce(jsonb_agg(i order by (i ->> 'at') desc), '[]'::jsonb) into items from (
    (select jsonb_build_object('kind', 'event', 'id', e.id, 'title_ar', e.title_ar, 'title_en', e.title_en, 'at', e.submitted_at) as i
       from public.events e where e.status = 'pending_review' and private.has_permission('events.approve', e.committee_id)
       order by e.submitted_at desc nulls last limit 6)
    union all
    (select jsonb_build_object('kind', 'article', 'id', a.id, 'title_ar', a.title_ar, 'title_en', a.title_en, 'at', a.submitted_at)
       from public.articles a where a.status = 'in_review' and private.has_permission('articles.publish', a.committee_id)
       order by a.submitted_at desc nulls last limit 6)
    union all
    (select jsonb_build_object('kind', 'event_changes', 'id', e.id, 'title_ar', e.title_ar, 'title_en', e.title_en, 'at', e.reviewed_at)
       from public.events e where e.status = 'changes_requested' and private.has_permission('events.create', e.committee_id)
       order by e.reviewed_at desc nulls last limit 6)
  ) q;

  return jsonb_build_object(
    'events_pending_review', ev_n, 'articles_in_review', art_n, 'applications_open', app_n,
    'registrations_pending', reg_n, 'changes_requested', changes_n, 'failed_emails', mail_n, 'items', items);
end;
$$;

-- ------------------------------------------------------------------------------------------ dashboard overview
create or replace function public.dashboard_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := private.today_riyadh();
  year_start date := date_trunc('year', private.today_riyadh()::timestamp)::date;
  upcoming jsonb;
  members_total integer;
  members_new integer;
  up_n integer;
  open_cycle jsonb;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;

  -- Published events that have not finished yet, in the caller's scope (events.view_drafts) — 3 of them for the card.
  select coalesce(jsonb_agg(u order by (u ->> 'last_date') nulls first), '[]'::jsonb), count(*)::integer into upcoming, up_n from (
    select jsonb_build_object('id', e.id, 'slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en,
             'committee_ar', c.name_ar, 'committee_en', c.name_en, 'last_date', x.last_date, 'start_date', e.start_date,
             'seats', e.seats,
             'accepted', (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'accepted')) as u
    from public.events e join public.committees c on c.id = e.committee_id
    cross join lateral (select coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date) as last_date) x
    where e.status = 'published' and (x.last_date is null or x.last_date >= today)
      and private.has_permission('events.view_drafts', e.committee_id)
    order by e.start_date nulls first limit 3) q;

  if private.has_permission('reports.view_community') then
    select count(*)::integer into members_total from public.members m where m.status = 'active';
    select count(*)::integer into members_new from public.members m where m.joined_at::date >= year_start;
  end if;

  select to_jsonb(p) into open_cycle from (
    select name_ar, name_en, closes_at from public.membership_cycle_phase where phase = 'open' order by closes_at limit 1) p;

  return jsonb_build_object(
    'active_members', case when private.has_permission('reports.view_community') then members_total end,
    'new_members_year', case when private.has_permission('reports.view_community') then members_new end,
    'upcoming_events', up_n,
    'upcoming', upcoming,
    'open_cycle', open_cycle);
end;
$$;

-- ------------------------------------------------------------------------------------------ my activity
create or replace function public.my_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'status', r.status, 'slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en,
        'start_date', e.start_date, 'attendance_percent', r.attendance_percent, 'certificate_id', c.id) order by e.start_date desc nulls first)
      from (select * from public.event_registrations where user_id = caller order by created_at desc limit 30) r
      join public.events e on e.id = r.event_id
      left join public.certificates c on c.registration_id = r.id), '[]'::jsonb),
    'application', (
      select jsonb_build_object('status', a.status, 'cycle_ar', mc.name_ar, 'cycle_en', mc.name_en, 'submitted_at', a.submitted_at)
      from public.membership_applications a join public.membership_cycles mc on mc.id = a.cycle_id
      where a.user_id = caller order by a.submitted_at desc nulls last limit 1),
    'member', (select jsonb_build_object('status', m.status, 'joined_at', m.joined_at) from public.members m where m.user_id = caller),
    'threads', (select count(*)::integer from public.articles a where a.created_by = caller and a.status = 'published')
  );
end;
$$;

revoke all on function public.community_stats(date, date), public.committee_stats(uuid, date, date),
  public.pending_queues(), public.dashboard_summary(), public.my_activity() from public, anon;
grant execute on function public.community_stats(date, date), public.committee_stats(uuid, date, date),
  public.pending_queues(), public.dashboard_summary(), public.my_activity() to authenticated;
