-- Sprint 18 · MEM-016, ACC-009, MBR-013, NOT-004 — the daily job (expiry, reminders, lapse, waitlist), the outbox that
-- holds decision e-mails back for the undo window, and the leadership digest. All of it is idempotent: running a job
-- twice changes nothing the second time. Only the service role can call these functions.

-- ------------------------------------------------------------------------------------------ 1. outbox (not-before)
create table public.email_outbox (
  id               uuid primary key default gen_random_uuid(),
  template_key     text not null,
  entity_type      text not null,
  entity_id        text not null,
  state            text not null,
  recipient_email  text not null,
  recipient_user_id uuid,
  locale           text not null check (locale in ('ar', 'en')),
  data             jsonb not null default '{}'::jsonb,
  not_before       timestamptz not null default now(),
  status           text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'cancelled', 'failed')),
  created_at       timestamptz not null default now(),
  processed_at     timestamptz,
  constraint email_outbox_event_uq unique (template_key, entity_id, state)
);
create index email_outbox_due_idx on public.email_outbox (not_before) where status = 'pending';
alter table public.email_outbox enable row level security;
revoke all on table public.email_outbox from anon, authenticated;

-- Atomically takes the due rows (several workers never take the same row).
create or replace function public.claim_due_outbox(p_limit integer default 50)
returns setof public.email_outbox
language sql
security definer
set search_path = ''
as $$
  update public.email_outbox o set status = 'processing', processed_at = now()
   where o.id in (select id from public.email_outbox where status = 'pending' and not_before <= now()
                   order by not_before limit greatest(p_limit, 1) for update skip locked)
  returning o.*
$$;
revoke all on function public.claim_due_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_due_outbox(integer) to service_role;

-- Cancels what has not been released yet (the undo of a decision). Returns how many were cancelled.
create or replace function public.cancel_outbox(p_entity_type text, p_entity_id text)
returns integer
language sql
security definer
set search_path = ''
as $$
  with c as (
    update public.email_outbox set status = 'cancelled', processed_at = now()
     where entity_type = p_entity_type and entity_id = p_entity_id and status = 'pending' returning 1
  ) select count(*)::integer from c
$$;
revoke all on function public.cancel_outbox(text, text) from public, anon, authenticated;
grant execute on function public.cancel_outbox(text, text) to service_role;

-- A decision can be undone only while its e-mail has not been released.
create or replace function public.undo_application_decision(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  ev public.application_events;
  prev text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if a.status not in ('accepted', 'rejected', 'waitlisted') or a.decided_at is null
     or a.decided_at < now() - interval '15 seconds' or (a.decided_by is distinct from caller and not private.is_system_admin())
     or exists (select 1 from public.email_outbox o where o.entity_type = 'membership_application' and o.entity_id = a.id::text
                   and o.status in ('processing', 'sent')) then
    raise exception 'UNDO_EXPIRED' using errcode = 'P0001';
  end if;
  select * into ev from public.application_events where application_id = a.id and kind = a.status order by id desc limit 1;
  prev := coalesce(ev.data ->> 'from', 'submitted');
  if a.status = 'accepted' then
    if (ev.data ->> 'reused')::boolean is true then
      update public.members set status = coalesce(ev.data ->> 'prior_status', 'ended'), end_reason = ev.data ->> 'prior_end_reason',
             application_id = null where application_id = a.id;
    else
      delete from public.members where application_id = a.id and activated_at is null;
    end if;
  end if;
  update public.membership_applications
     set status = prev, decided_at = null, decided_by = null, decision_note = null, accepted_at = null
   where id = a.id;
  perform private.add_application_event(a.id, 'decision_undone', jsonb_build_object('was', a.status));
  perform private.write_audit('membership_application.decision_undone', 'membership_application', a.id::text, null, jsonb_build_object('was', a.status));
  return prev;
end;
$$;
revoke all on function public.undo_application_decision(uuid) from public, anon;
grant execute on function public.undo_application_decision(uuid) to authenticated;

-- ------------------------------------------------------------------------------------------ 2. reminder bookkeeping
create table public.term_reminders (
  member_id    uuid not null references public.members (id) on delete cascade,
  term_ends_at date not null,
  days         smallint not null check (days in (30, 7, 1)),
  created_at   timestamptz not null default now(),
  primary key (member_id, term_ends_at, days)
);
create table public.activation_reminders (
  application_id uuid not null references public.membership_applications (id) on delete cascade,
  day            smallint not null check (day in (3, 6)),
  created_at     timestamptz not null default now(),
  primary key (application_id, day)
);
alter table public.term_reminders enable row level security;
alter table public.activation_reminders enable row level security;
revoke all on table public.term_reminders, public.activation_reminders from anon, authenticated;

-- The activation list for leadership: accepted people who have not activated yet and the lapsed ones (restorable).
create or replace view public.membership_activation_queue as
select a.id as application_id, a.cycle_id, a.status, a.reference, a.full_name_ar, a.full_name_en, a.accepted_at, a.lapsed_at,
       c.activation_deadline_days,
       coalesce((select array_agg(r.day order by r.day) from public.activation_reminders r where r.application_id = a.id), '{}'::smallint[]) as reminders,
       (m.activated_at is not null) as activated
  from public.membership_applications a
  join public.membership_cycles c on c.id = a.cycle_id
  left join public.members m on m.application_id = a.id
 where a.status in ('accepted', 'lapsed') and private.has_permission('membership.review')
   and (a.status = 'lapsed' or m.activated_at is null);
revoke all on public.membership_activation_queue from anon, authenticated;
grant select on public.membership_activation_queue to authenticated;

-- ------------------------------------------------------------------------------------------ 3. the system accept (waitlist promotion)
create or replace function public.system_accept_applications(p_ids uuid[], p_reason text default 'activation_lapsed')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  rec public.membership_applications;
  id uuid;
  cap integer;
  accepted integer;
  info jsonb;
  results jsonb := '[]'::jsonb;
  code text;
begin
  foreach id in array coalesce(p_ids, '{}') loop
    code := null;
    select * into rec from public.membership_applications a where a.id = id for update;
    if not found then code := 'NOT_FOUND';
    elsif rec.status <> 'waitlisted' then code := 'INVALID_TRANSITION';
    elsif rec.user_id is null then code := 'NO_ACCOUNT';
    else
      select capacity into cap from public.membership_cycles where public.membership_cycles.id = rec.cycle_id for update;
      select count(*) into accepted from public.membership_applications a where a.cycle_id = rec.cycle_id and a.status = 'accepted';
      if cap is not null and accepted >= cap then code := 'CAPACITY_REACHED'; end if;
    end if;
    if code is null then
      update public.membership_applications set status = 'accepted', decided_at = now(), decided_by = null,
             decision_note = p_reason, accepted_at = now() where public.membership_applications.id = id;
      info := private.accept_application((select a from public.membership_applications a where a.id = id), null);
      perform private.add_application_event(id, 'accepted', jsonb_build_object('from', 'waitlisted', 'reason', p_reason) || coalesce(info, '{}'::jsonb));
      perform private.write_audit('membership_application.accepted', 'membership_application', id::text, null,
        jsonb_build_object('cycle_id', rec.cycle_id, 'from', 'waitlisted', 'reason', p_reason));
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;
revoke all on function public.system_accept_applications(uuid[], text) from public, anon, authenticated;
grant execute on function public.system_accept_applications(uuid[], text) to service_role;

-- Leadership restores a lapsed person while a place remains.
create or replace function public.restore_application(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
  m public.members;
  accepted integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if a.status <> 'lapsed' or a.user_id is null then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = a.cycle_id for update;
  select count(*) into accepted from public.membership_applications where cycle_id = c.id and status = 'accepted';
  if c.capacity is not null and accepted >= c.capacity then raise exception 'CAPACITY_REACHED' using errcode = 'P0001'; end if;
  update public.membership_applications set status = 'accepted', accepted_at = now(), lapsed_at = null where id = a.id;
  select * into m from public.members where application_id = a.id;
  if found then
    update public.members set status = 'active', end_reason = null, ended_at = null, status_reason = null, activated_at = null,
           card_token = coalesce(card_token, private.new_token()) where id = m.id;
    perform private.add_member_event(m.id, 'restored', jsonb_build_object('application', a.id));
  else
    perform private.accept_application((select x from public.membership_applications x where x.id = a.id), caller);
  end if;
  perform private.add_application_event(a.id, 'restored');
  perform private.write_audit('membership_application.restored', 'membership_application', a.id::text, null, jsonb_build_object('cycle_id', c.id));
  return jsonb_build_object('ok', true, 'application', a.id);
end;
$$;
revoke all on function public.restore_application(uuid) from public, anon;
grant execute on function public.restore_application(uuid) to authenticated;

-- A signed-in person's first visit marks their account as activated at once (the daily job is the safety net).
create or replace function public.sync_my_activation()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.members set activated_at = now()
   where user_id = (select auth.uid()) and activated_at is null
$$;
revoke all on function public.sync_my_activation() from public, anon;
grant execute on function public.sync_my_activation() to authenticated;

-- ------------------------------------------------------------------------------------------ 4. the daily job
-- Returns what the server has to e-mail and what it has to promote. With p_dry = true nothing is written.
create or replace function public.run_membership_daily(p_dry boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := private.today_riyadh();
  r record;
  code text;
  synced integer := 0;
  expired jsonb := '[]'::jsonb;
  ended jsonb := '[]'::jsonb;
  reinstated jsonb := '[]'::jsonb;
  term jsonb := '[]'::jsonb;
  act jsonb := '[]'::jsonb;
  lapsed jsonb := '[]'::jsonb;
  promote jsonb := '[]'::jsonb;
  mark smallint;
begin
  -- 1. activation: an account with a password or a sign-in counts as activated
  if not p_dry then
    update public.members m set activated_at = coalesce(au.last_sign_in_at, now())
      from auth.users au
     where au.id = m.user_id and m.activated_at is null and (au.last_sign_in_at is not null or coalesce(au.encrypted_password, '') <> '');
    get diagnostics synced = row_count;
  end if;

  -- 2. expiry: the day after the term end
  for r in select id from public.members where status = 'active' and term_ends_at is not null and term_ends_at < today order by id loop
    if not p_dry then code := private.member_transition(r.id, 'expired', null, 'term_end', '{}'::jsonb, null); end if;
    expired := expired || to_jsonb(r.id);
  end loop;

  -- 3. approved leave requests that fall due
  for r in select id from public.members where status in ('active', 'suspended', 'expired') and leaves_on is not null and leaves_on <= today order by id loop
    if not p_dry then code := private.member_transition(r.id, 'ended', 'left', 'leave request approved', '{}'::jsonb, null); end if;
    ended := ended || to_jsonb(r.id);
  end loop;

  -- 4. suspensions that reach their end date
  for r in select id from public.members where status = 'suspended' and suspended_until is not null and suspended_until <= today order by id loop
    if not p_dry then code := private.member_transition(r.id, 'active', null, 'suspension ended', '{}'::jsonb, null); end if;
    reinstated := reinstated || to_jsonb(r.id);
  end loop;

  -- 5. term reminders: the smallest mark (30 / 7 / 1) that is due and has not been sent for this term
  for r in
    select m.id, m.term_ends_at, (m.term_ends_at - today) as left_days from public.members m
     where m.status = 'active' and m.term_ends_at is not null and m.term_ends_at >= today and (m.term_ends_at - today) <= 30 order by m.id
  loop
    mark := case when r.left_days <= 1 then 1 when r.left_days <= 7 then 7 else 30 end;
    if p_dry then
      if not exists (select 1 from public.term_reminders t where t.member_id = r.id and t.term_ends_at = r.term_ends_at and t.days = mark) then
        term := term || jsonb_build_object('member', r.id, 'days', mark, 'term_ends_at', r.term_ends_at);
      end if;
    else
      insert into public.term_reminders (member_id, term_ends_at, days) values (r.id, r.term_ends_at, mark) on conflict do nothing;
      if found then term := term || jsonb_build_object('member', r.id, 'days', mark, 'term_ends_at', r.term_ends_at); end if;
    end if;
  end loop;

  -- 6. activation reminders on day 3 and day 6 (only the latest due one)
  for r in
    select a.id, a.accepted_at, c.activation_deadline_days
      from public.membership_applications a
      join public.membership_cycles c on c.id = a.cycle_id
      join public.members m on m.application_id = a.id
     where a.status = 'accepted' and a.accepted_at is not null and m.activated_at is null
       and a.accepted_at + interval '3 days' <= now() and a.accepted_at + make_interval(days => c.activation_deadline_days) > now()
     order by a.id
  loop
    mark := case when r.accepted_at + interval '6 days' <= now() and r.activation_deadline_days > 6 then 6 else 3 end;
    if p_dry then
      if not exists (select 1 from public.activation_reminders x where x.application_id = r.id and x.day = mark) then
        act := act || jsonb_build_object('application', r.id, 'day', mark);
      end if;
    else
      insert into public.activation_reminders (application_id, day) values (r.id, mark) on conflict do nothing;
      if found then act := act || jsonb_build_object('application', r.id, 'day', mark); end if;
    end if;
  end loop;

  -- 7. lapse: an acceptance not activated within the cycle's deadline loses the place (held 24 h before it is offered on)
  for r in
    select a.id, a.cycle_id from public.membership_applications a
      join public.membership_cycles c on c.id = a.cycle_id
      join public.members m on m.application_id = a.id
     where a.status = 'accepted' and a.accepted_at is not null and m.activated_at is null
       and a.accepted_at + make_interval(days => c.activation_deadline_days) <= now() order by a.id
  loop
    if not p_dry then
      update public.membership_applications set status = 'lapsed', lapsed_at = now() where id = r.id;
      perform private.member_transition((select id from public.members where application_id = r.id), 'ended', 'lapsed', 'activation_lapsed', '{}'::jsonb, null);
      perform private.add_application_event(r.id, 'lapsed');
      perform private.write_audit('membership_application.lapsed', 'membership_application', r.id::text, null, jsonb_build_object('reason', 'activation_lapsed'));
    end if;
    lapsed := lapsed || jsonb_build_object('application', r.id, 'cycle', r.cycle_id);
  end loop;

  -- 8. promotion: free places (not counting places still held for a person who just lapsed) go to the waitlist
  for r in
    select c.id as cycle_id,
           c.capacity - (select count(*) from public.membership_applications a where a.cycle_id = c.id and a.status = 'accepted')
                      - (select count(*) from public.membership_applications a where a.cycle_id = c.id and a.status = 'lapsed' and a.lapsed_at > now() - interval '24 hours')
             as free,
           (jsonb_array_length(c.rubric) > 0) as ranked
      from public.membership_cycles c
     where c.status = 'published' and c.capacity is not null order by c.id
  loop
    if r.free > 0 then
      promote := promote || coalesce((
        select jsonb_agg(jsonb_build_object('application', w.application_id, 'cycle', r.cycle_id))
          from (select a.id as application_id from public.membership_applications a
                 where a.cycle_id = r.cycle_id and a.status = 'waitlisted' and a.user_id is not null
                 order by case when r.ranked then (select s.average from private.application_score(a.id) s) end desc nulls last, a.submitted_at, a.id
                 limit r.free) w), '[]'::jsonb);
    end if;
  end loop;

  return jsonb_build_object('dry', p_dry, 'today', today, 'activation_synced', synced, 'expired', expired, 'ended', ended,
    'reinstated', reinstated, 'term_reminders', term, 'activation_reminders', act, 'lapsed', lapsed, 'promote', promote);
end;
$$;
revoke all on function public.run_membership_daily(boolean) from public, anon, authenticated;
grant execute on function public.run_membership_daily(boolean) to service_role;

-- ------------------------------------------------------------------------------------------ 5. the leadership digest
create or replace function public.leadership_digest()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := private.today_riyadh();
begin
  return jsonb_build_object(
    'today', today,
    'recipients', coalesce((
      select jsonb_agg(distinct jsonb_build_object('id', p.id, 'email', p.email, 'locale', p.preferred_locale, 'name', p.full_name_ar))
        from public.role_assignments ra
        join public.role_permissions rp on rp.role_key = ra.role_key and rp.permission_key in ('members.manage', 'membership.review')
        join public.roles r on r.key = ra.role_key and r.scope = 'global'
        join public.profiles p on p.id = ra.user_id
       where ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now()) and p.blocked_at is null), '[]'::jsonb),
    'lapsed', coalesce((select jsonb_agg(jsonb_build_object('name_ar', a.full_name_ar, 'name_en', coalesce(a.full_name_en, a.full_name_ar), 'reference', a.reference))
                          from public.membership_applications a where a.status = 'lapsed' and a.lapsed_at > now() - interval '24 hours'), '[]'::jsonb),
    'promoted', coalesce((select jsonb_agg(jsonb_build_object('name_ar', a.full_name_ar, 'name_en', coalesce(a.full_name_en, a.full_name_ar), 'reference', a.reference))
                            from public.membership_applications a where a.status = 'accepted' and a.decision_note = 'activation_lapsed'
                             and a.accepted_at > now() - interval '24 hours'), '[]'::jsonb),
    'ending_this_week', (select count(*) from public.members where status = 'active' and term_ends_at between today and today + 7),
    'pending_leave', (select count(*) from public.member_leave_requests where status = 'pending'),
    'oldest_leave_days', (select coalesce(max(extract(day from now() - created_at)::integer), 0) from public.member_leave_requests where status = 'pending'),
    'renewal_requests', (select count(*) from public.members where renewal_requested_at is not null and status in ('active', 'expired')),
    'waiting_activation', (select count(*) from public.membership_applications a join public.members m on m.application_id = a.id
                            where a.status = 'accepted' and m.activated_at is null),
    'new_applications', (select count(*) from public.membership_applications where submitted_at > now() - interval '24 hours')
  );
end;
$$;
revoke all on function public.leadership_digest() from public, anon, authenticated;
grant execute on function public.leadership_digest() to service_role;
