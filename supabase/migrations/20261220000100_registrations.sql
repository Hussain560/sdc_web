-- Sprint 06 · REG-001…005, SEC-008 — registrations v2 (expand–contract from the legacy table).
-- Authoritative design: docs/05-database/entities/events.md §5, docs/11-modules/registrations/README.md,
-- docs/03-business-domain/registration-lifecycle.md. The legacy anonymous policies disappear with the old table.

-- ------------------------------------------------------------------------------------------ 1. set the legacy table aside
alter table public.event_registrations rename to event_registrations_legacy;
alter table public.event_registrations_legacy rename constraint event_registrations_pkey to event_registrations_legacy_pkey;
alter sequence public.event_registrations_id_seq rename to event_registrations_legacy_id_seq;
drop policy if exists "Allow read registrations" on public.event_registrations_legacy;
drop policy if exists "Allow insert registrations" on public.event_registrations_legacy;
drop policy if exists "Allow update registrations" on public.event_registrations_legacy;
drop policy if exists registrations_select_own on public.event_registrations_legacy;
drop policy if exists registrations_select_reviewers on public.event_registrations_legacy;
drop policy if exists registrations_insert_own on public.event_registrations_legacy;
drop policy if exists registrations_update_reviewers on public.event_registrations_legacy;
revoke all on table public.event_registrations_legacy from anon, authenticated;
comment on table public.event_registrations_legacy is
  'Pre-Sprint-06 registrations, kept read-only for audit (no grants, no policies). Drop in the hardening sprint after the reconciliation sign-off.';

-- ------------------------------------------------------------------------------------------ 2. the new table
create table public.event_registrations (
  id                  uuid primary key default gen_random_uuid(),
  legacy_id           integer unique,
  event_id            uuid not null references public.events (id) on delete restrict,
  user_id             uuid references public.profiles (id) on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending', 'accepted', 'rejected', 'waitlisted', 'cancelled')),
  attendance_result   text check (attendance_result in ('attended', 'absent')),
  attendance_percent  smallint check (attendance_percent between 0 and 100),
  full_name_snapshot  text not null,
  email_snapshot      text not null,
  was_member          boolean not null default false,
  answers             jsonb not null default '{}'::jsonb,
  decided_by          uuid references public.profiles (id) on delete set null,
  decided_at          timestamptz,
  decision_note       text,
  notify_status       text not null default 'not_sent' check (notify_status in ('not_sent', 'sending', 'sent', 'failed')),
  cancelled_by        uuid references public.profiles (id) on delete set null,
  cancelled_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint event_registrations_one_per_user unique (event_id, user_id)
);
comment on table public.event_registrations is 'One row per account per event; written only through register_for_event / decide_registrations / cancel_*.';
create index event_registrations_event_status_idx on public.event_registrations (event_id, status);
create index event_registrations_user_idx on public.event_registrations (user_id);
create trigger event_registrations_touch before update on public.event_registrations
  for each row execute function private.touch_updated_at();

-- ------------------------------------------------------------------------------------------ 3. migrate the legacy rows (by legacy_id)
-- Status is mapped; people who already got an answer are marked as notified so nothing is re-sent.
insert into public.event_registrations (
  legacy_id, event_id, user_id, status, full_name_snapshot, email_snapshot, notify_status, created_at, updated_at
)
select distinct on (e.id, coalesce(l.user_id::text, 'legacy-' || l.id))
  l.id, e.id, (select p.id from public.profiles p where p.id = l.user_id),
  case when l.status in ('accepted', 'rejected') then l.status else 'pending' end,
  coalesce(nullif(btrim(l.full_name), ''), '—'), coalesce(nullif(btrim(l.email), ''), ''),
  case when l.status in ('accepted', 'rejected') then 'sent' else 'not_sent' end,
  coalesce(l.created_at, now()), coalesce(l.created_at, now())
from public.event_registrations_legacy l
join public.events e on e.legacy_id = l.event_id
order by e.id, coalesce(l.user_id::text, 'legacy-' || l.id), l.created_at
on conflict do nothing;

-- ------------------------------------------------------------------------------------------ 4. RLS (no write grants)
create or replace function private.registration_committee(p_registration uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.committee_id from public.event_registrations r join public.events e on e.id = r.event_id where r.id = p_registration
$$;
revoke all on function private.registration_committee(uuid) from public;
grant execute on function private.registration_committee(uuid) to authenticated;

alter table public.event_registrations enable row level security;
revoke all on table public.event_registrations from anon, authenticated;
grant select on table public.event_registrations to authenticated;

create policy registrations_select_own on public.event_registrations
  for select to authenticated using (user_id = (select auth.uid()));
create policy registrations_select_reviewers on public.event_registrations
  for select to authenticated
  using (private.has_permission('registrations.review', private.event_committee(event_id)));

-- Accepted registrants may read the private links of their event (EV-7).
create policy event_private_select_accepted on public.event_private_details
  for select to authenticated
  using (exists (
    select 1 from public.event_registrations r
    where r.event_id = event_private_details.event_id and r.user_id = (select auth.uid()) and r.status = 'accepted'
  ));

-- ------------------------------------------------------------------------------------------ 5. helpers + views
create or replace function private.accepted_count(p_event uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$ select count(*)::integer from public.event_registrations where event_id = p_event and status = 'accepted' $$;
revoke all on function private.accepted_count(uuid) from public;
grant execute on function private.accepted_count(uuid) to anon, authenticated;

-- public_events now carries real counts (same columns as before, so CREATE OR REPLACE is enough).
create or replace view public.public_events as
select
  e.id, e.legacy_id, e.slug, e.committee_id,
  c.slug as committee_slug, c.name_ar as committee_name_ar, c.name_en as committee_name_en,
  e.type, e.status,
  e.title_ar, e.title_en, e.summary_ar, e.summary_en, e.description_ar, e.description_en,
  e.schedule_type, e.start_date, e.end_date, e.start_time, e.end_time,
  coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date) as last_date,
  e.location_mode, e.location_ar, e.location_en, e.map_url,
  e.seats, e.registration_start_at, e.registration_end_at, e.requires_approval, e.waitlist_enabled, e.audience,
  e.goals, e.faq, e.details, e.display_config,
  e.cover_image_path, e.awards_ar, e.awards_en, e.certificate_available, e.contact_email, e.contact_phone,
  e.published_at, e.cancelled_at, e.cancel_reason,
  private.accepted_count(e.id) as accepted_count,
  case when e.seats is null then null else greatest(e.seats - private.accepted_count(e.id), 0) end as seats_left,
  private.event_phase(
    e.status, e.start_date,
    coalesce((select max(d.event_date) from public.event_dates d where d.event_id = e.id), e.end_date, e.start_date),
    e.start_time, e.end_time, e.registration_start_at, e.registration_end_at, e.seats,
    private.accepted_count(e.id), (e.display_config ->> 'auto_close_registration')::boolean
  ) as phase
from public.events e
join public.committees c on c.id = e.committee_id
where e.status in ('published', 'cancelled', 'completed', 'archived');

create view public.event_registration_counts with (security_invoker = true) as
select event_id, status, count(*)::integer as total from public.event_registrations group by event_id, status;
revoke all on public.event_registration_counts from anon;
grant select on public.event_registration_counts to authenticated;

-- My registrations with the event facts; private links only once accepted. Owner rights on purpose, filtered by auth.uid().
create view public.my_registrations as
select
  r.id, r.event_id, r.status, r.attendance_result, r.created_at, r.decided_at, r.cancelled_at,
  e.slug, e.title_ar, e.title_en, e.status as event_status, e.start_date, e.end_date, e.start_time,
  e.location_mode, e.location_ar, e.location_en, e.cover_image_path,
  case when r.status = 'accepted' then d.group_link end as group_link,
  case when r.status = 'accepted' then d.meeting_url end as meeting_url,
  case when r.status = 'accepted' then d.meeting_notes end as meeting_notes
from public.event_registrations r
join public.events e on e.id = r.event_id
left join public.event_private_details d on d.event_id = e.id
where r.user_id = (select auth.uid());
revoke all on public.my_registrations from anon, authenticated;
grant select on public.my_registrations to authenticated;

-- ------------------------------------------------------------------------------------------ 6. write paths
create or replace function public.register_for_event(p_event uuid, p_answers jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  confirmed timestamptz;
  e public.events;
  prof public.profiles;
  r public.event_registrations;
  last_d date;
  accepted integer;
  phase text;
  v_status text;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select email_confirmed_at into confirmed from auth.users where id = caller;
  if confirmed is null then raise exception 'EMAIL_NOT_CONFIRMED' using errcode = 'P0001'; end if;

  select * into e from public.events where id = p_event for update;   -- the row lock serialises seat decisions (RE-6)
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if e.status <> 'published' then raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001'; end if;

  accepted := private.accepted_count(e.id);
  select max(event_date) into last_d from public.event_dates where event_id = e.id;
  phase := private.event_phase(e.status, e.start_date, coalesce(last_d, e.end_date, e.start_date), e.start_time, e.end_time,
                               e.registration_start_at, e.registration_end_at, e.seats, accepted, false);
  -- auto-close is deliberately ignored here: a full event answers EVENT_FULL or waitlists, it is not "closed".

  select * into r from public.event_registrations where event_id = e.id and user_id = caller;
  if found and r.status <> 'cancelled' then raise exception 'ALREADY_REGISTERED' using errcode = 'P0001'; end if;
  if phase is distinct from 'registration_open' then raise exception 'REGISTRATION_CLOSED' using errcode = 'P0001'; end if;
  if e.audience = 'members_only' and not private.is_active_member(caller) then raise exception 'MEMBERS_ONLY' using errcode = 'P0001'; end if;

  if e.requires_approval then
    v_status := 'pending';
  elsif e.seats is null or accepted < e.seats then
    v_status := 'accepted';
  elsif e.waitlist_enabled then
    v_status := 'waitlisted';
  else
    raise exception 'EVENT_FULL' using errcode = 'P0001';
  end if;

  select * into prof from public.profiles where id = caller;
  if r.id is not null then
    update public.event_registrations
       set status = v_status, created_at = now(), cancelled_at = null, cancelled_by = null, decided_at = null, decided_by = null,
           decision_note = null, notify_status = 'not_sent', answers = coalesce(p_answers, '{}'::jsonb),
           full_name_snapshot = prof.full_name_ar, email_snapshot = prof.email, was_member = private.is_active_member(caller)
     where id = r.id returning id into v_id;
  else
    insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot, was_member, answers)
    values (e.id, caller, v_status, prof.full_name_ar, prof.email, private.is_active_member(caller), coalesce(p_answers, '{}'::jsonb))
    returning id into v_id;
  end if;

  perform private.write_audit('registration.created', 'registration', v_id::text, e.committee_id,
    jsonb_build_object('event_id', e.id, 'status', v_status));
  return jsonb_build_object('id', v_id, 'status', v_status);
end;
$$;

create or replace function public.cancel_registration(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  r public.event_registrations;
  e public.events;
  first_start timestamp;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into r from public.event_registrations where id = p_id and user_id = caller for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if r.status not in ('pending', 'accepted', 'waitlisted') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  select * into e from public.events where id = r.event_id;
  if e.start_date is not null then
    first_start := e.start_date + coalesce(e.start_time, time '00:00');
    if (now() at time zone 'Asia/Riyadh') >= first_start then raise exception 'TOO_LATE_TO_CANCEL' using errcode = 'P0001'; end if;
  end if;
  update public.event_registrations set status = 'cancelled', cancelled_by = caller, cancelled_at = now() where id = r.id;
  perform private.write_audit('registration.cancelled', 'registration', r.id::text, e.committee_id,
    jsonb_build_object('event_id', e.id, 'from', r.status, 'by', 'participant'));
end;
$$;

-- Bulk decision. Returns [{id, ok, status|code}] — a per-row outcome so one full event never blocks the others (RE-6).
create or replace function public.decide_registrations(p_ids uuid[], p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  rec record;
  results jsonb := '[]'::jsonb;
  to_status text;
  accepted integer;
  code text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  to_status := case p_decision when 'accept' then 'accepted' when 'reject' then 'rejected' when 'waitlist' then 'waitlisted' end;
  if to_status is null then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) = 0 or array_length(p_ids, 1) > 200 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;

  -- lock the affected events in a stable order (no deadlocks between reviewers)
  perform 1 from public.events
   where id in (select event_id from public.event_registrations where id = any(p_ids)) order by id for update;

  for rec in
    select r.id, r.status, r.event_id, e.committee_id, e.seats
    from public.event_registrations r join public.events e on e.id = r.event_id
    where r.id = any(p_ids) order by r.created_at, r.id
  loop
    code := null;
    if not private.has_permission('registrations.review', rec.committee_id) then
      code := 'FORBIDDEN';
    elsif rec.status = 'cancelled' or rec.status = to_status
          or (rec.status = 'accepted' and to_status = 'waitlisted')
          or (rec.status = 'rejected' and to_status = 'waitlisted') then
      code := 'INVALID_TRANSITION';
    elsif to_status = 'accepted' then
      accepted := private.accepted_count(rec.event_id);
      if rec.seats is not null and accepted >= rec.seats then code := 'CAPACITY_REACHED'; end if;
    end if;

    if code is null then
      update public.event_registrations
         set status = to_status, decided_by = caller, decided_at = now(), decision_note = nullif(btrim(coalesce(p_note, '')), ''),
             notify_status = 'not_sent'
       where id = rec.id;
      perform private.write_audit('registration.' || p_decision || 'ed', 'registration', rec.id::text, rec.committee_id,
        jsonb_build_object('event_id', rec.event_id, 'from', rec.status, 'to', to_status, 'note', p_note));
      results := results || jsonb_build_object('id', rec.id, 'ok', true, 'status', to_status);
    else
      results := results || jsonb_build_object('id', rec.id, 'ok', false, 'code', code);
    end if;
  end loop;

  -- ids that matched no row at all
  select results || coalesce(jsonb_agg(jsonb_build_object('id', x, 'ok', false, 'code', 'NOT_FOUND')), '[]'::jsonb) into results
    from unnest(p_ids) x where not exists (select 1 from public.event_registrations where id = x);
  return results;
end;
$$;

create or replace function public.cancel_registration_by_organizer(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  r public.event_registrations;
  committee uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into r from public.event_registrations where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  committee := private.event_committee(r.event_id);
  if not private.has_permission('registrations.review', committee) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if btrim(coalesce(p_reason, '')) = '' then raise exception 'REASON_REQUIRED' using errcode = 'P0001'; end if;
  if r.status not in ('pending', 'accepted', 'waitlisted') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  update public.event_registrations
     set status = 'cancelled', cancelled_by = caller, cancelled_at = now(), decision_note = btrim(p_reason), notify_status = 'not_sent'
   where id = r.id;
  perform private.write_audit('registration.cancelled', 'registration', r.id::text, committee,
    jsonb_build_object('event_id', r.event_id, 'from', r.status, 'by', 'organizer', 'reason', p_reason));
end;
$$;

revoke all on function public.register_for_event(uuid, jsonb) from public, anon;
revoke all on function public.cancel_registration(uuid) from public, anon;
revoke all on function public.decide_registrations(uuid[], text, text) from public, anon;
revoke all on function public.cancel_registration_by_organizer(uuid, text) from public, anon;
grant execute on function public.register_for_event(uuid, jsonb) to authenticated;
grant execute on function public.cancel_registration(uuid) to authenticated;
grant execute on function public.decide_registrations(uuid[], text, text) to authenticated;
grant execute on function public.cancel_registration_by_organizer(uuid, text) to authenticated;
