-- Sprint 18 · MBR-010, MBR-011, MBR-012, MBR-013 — review v2: claim, decisions (with a short undo window), info
-- requests, reviewer scoring, cycle settings (term end, activation deadline, rubric), funnel and waitlist reads.

-- ------------------------------------------------------------------------------------------ 1. rubric validation, cycle save v3
create or replace function private.validate_rubric(p_rubric jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  q jsonb;
  keys text[] := '{}';
begin
  if jsonb_typeof(p_rubric) <> 'array' or jsonb_array_length(p_rubric) > 6 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  for q in select * from jsonb_array_elements(p_rubric) loop
    if jsonb_typeof(q) <> 'object'
       or coalesce(q ->> 'key', '') !~ '^[a-z][a-z0-9_]{0,23}$'
       or (q ->> 'key') = any (keys)
       or char_length(btrim(coalesce(q ->> 'label_ar', ''))) not between 2 and 80
       or char_length(coalesce(q ->> 'label_en', '')) > 80
       or coalesce(q ->> 'weight', '') !~ '^[123]$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    keys := keys || (q ->> 'key');
  end loop;
end;
$$;

create table public.application_scores (
  application_id uuid not null references public.membership_applications (id) on delete cascade,
  reviewer_id    uuid not null references public.profiles (id) on delete cascade,
  scores         jsonb not null check (jsonb_typeof(scores) = 'object'),
  comment        text check (char_length(comment) <= 500),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (application_id, reviewer_id)
);
alter table public.application_scores enable row level security;
revoke all on table public.application_scores from anon, authenticated;
grant select on table public.application_scores to authenticated;
-- Reviewers only. Applicants have no account until accepted and never read this table.
create policy application_scores_select_reviewers on public.application_scores
  for select to authenticated using (private.has_permission('membership.review'));

create or replace function public.save_membership_cycle(p_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  c public.membership_cycles;
  v_opens timestamptz;
  v_closes timestamptz;
  v_review timestamptz;
  v_questions jsonb;
  v_rubric jsonb := coalesce(p -> 'rubric', '[]'::jsonb);
  v_term date;
  v_days smallint;
  v_id uuid;
  has_apps boolean;
  dates_changed boolean;
  reset_early boolean := false;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.manage_cycles') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;

  begin
    v_opens := (p ->> 'opens_at')::timestamptz;
    v_closes := (p ->> 'closes_at')::timestamptz;
    v_review := nullif(p ->> 'review_ends_at', '')::timestamptz;
    v_term := nullif(p ->> 'term_ends_at', '')::date;
    v_days := coalesce(nullif(p ->> 'activation_deadline_days', '')::smallint, 7);
  exception when others then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end;
  if v_opens is null or v_closes is null or v_closes <= v_opens or (v_review is not null and v_review < v_closes) then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end if;
  if v_term is not null and v_term <= (v_closes at time zone 'Asia/Riyadh')::date then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end if;
  v_questions := coalesce(p -> 'questions', '[]'::jsonb);
  perform private.validate_questions(v_questions);
  perform private.validate_rubric(v_rubric);

  if p_id is null then
    insert into public.membership_cycles (name_ar, name_en, description_ar, description_en, opens_at, closes_at,
                                          review_ends_at, capacity, questions, created_by, term_ends_at,
                                          activation_deadline_days, rubric)
    values (btrim(p ->> 'name_ar'), nullif(btrim(p ->> 'name_en'), ''), nullif(p ->> 'description_ar', ''),
            nullif(p ->> 'description_en', ''), v_opens, v_closes, v_review,
            nullif(p ->> 'capacity', '')::integer, v_questions, caller, v_term, v_days, v_rubric)
    returning id into v_id;
    perform private.write_audit('membership_cycle.created', 'membership_cycle', v_id::text, null, '{}'::jsonb);
    return jsonb_build_object('id', v_id);
  end if;

  select * into c from public.membership_cycles where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if c.status = 'completed' then raise exception 'NOT_EDITABLE' using errcode = 'P0001'; end if;
  has_apps := exists (select 1 from public.membership_applications where cycle_id = c.id);
  dates_changed := date_trunc('minute', v_opens) <> date_trunc('minute', c.opens_at)
                or date_trunc('minute', v_closes) <> date_trunc('minute', c.closes_at);
  if not dates_changed then
    v_opens := c.opens_at;
    v_closes := c.closes_at;
  elsif c.status = 'published'
        and private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'scheduled' then
    if has_apps then
      if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open'
         or date_trunc('minute', v_opens) <> date_trunc('minute', c.opens_at) or v_closes <= now() then
        raise exception 'NOT_EDITABLE' using errcode = 'P0001';
      end if;
      v_opens := c.opens_at;
    else
      reset_early := true;
    end if;
  end if;
  if v_questions <> c.questions and has_apps then
    raise exception 'QUESTIONS_LOCKED' using errcode = 'P0001';
  end if;
  -- The rubric is fixed once any reviewer has scored (scores refer to its keys).
  if v_rubric <> c.rubric and exists (select 1 from public.application_scores s
                                       join public.membership_applications a on a.id = s.application_id where a.cycle_id = c.id) then
    raise exception 'RUBRIC_LOCKED' using errcode = 'P0001';
  end if;

  update public.membership_cycles
     set name_ar = btrim(p ->> 'name_ar'), name_en = nullif(btrim(p ->> 'name_en'), ''),
         description_ar = nullif(p ->> 'description_ar', ''), description_en = nullif(p ->> 'description_en', ''),
         opens_at = v_opens, closes_at = v_closes, review_ends_at = v_review,
         capacity = nullif(p ->> 'capacity', '')::integer, questions = v_questions,
         term_ends_at = v_term, activation_deadline_days = v_days, rubric = v_rubric,
         closed_early_at = case when reset_early then null else closed_early_at end
   where id = c.id;
  perform private.write_audit('membership_cycle.updated', 'membership_cycle', c.id::text, null, '{}'::jsonb);
  return jsonb_build_object('id', c.id);
exception
  when exclusion_violation then raise exception 'CYCLE_OVERLAP' using errcode = 'P0001';
  when check_violation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  when invalid_text_representation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;

-- ------------------------------------------------------------------------------------------ 2. scoring
-- Weighted mean per reviewer, then the mean across reviewers. Reads only through the guarded view/functions below.
create or replace function private.application_score(p_app uuid)
returns table (average numeric, reviewers integer)
language sql
stable
security definer
set search_path = ''
as $$
  with a as (
    select ap.id, c.rubric from public.membership_applications ap join public.membership_cycles c on c.id = ap.cycle_id where ap.id = p_app
  ), per as (
    select s.reviewer_id,
           sum((e.value)::numeric * coalesce((r ->> 'weight')::numeric, 1)) / nullif(sum(coalesce((r ->> 'weight')::numeric, 1)), 0) as v
      from a
      join public.application_scores s on s.application_id = a.id
      cross join lateral jsonb_each_text(s.scores) e
      join lateral (select x as r from jsonb_array_elements(a.rubric) x where x ->> 'key' = e.key) rr on true
     group by s.reviewer_id
  )
  select round(avg(v), 1), count(*)::integer from per
$$;
revoke all on function private.application_score(uuid) from public, anon, authenticated;

-- The same numbers for the views leadership reads: the caller must hold membership.review.
create or replace function private.application_score_visible(p_app uuid)
returns table (average numeric, reviewers integer)
language sql
stable
security definer
set search_path = ''
as $$ select s.average, s.reviewers from private.application_score(p_app) s where private.has_permission('membership.review') $$;
revoke all on function private.application_score_visible(uuid) from public, anon;
grant execute on function private.application_score_visible(uuid) to authenticated;

create or replace function public.save_application_score(p_app uuid, p_scores jsonb, p_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
  k text;
  crit jsonb;
  mine text;
  res record;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_app for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select lower(email) into mine from public.profiles where id = caller;
  if a.user_id = caller or lower(a.email) = mine then raise exception 'SELF_DECISION' using errcode = 'P0001'; end if;
  if a.status not in ('submitted', 'under_review', 'waitlisted') then raise exception 'NOT_EDITABLE' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if jsonb_array_length(c.rubric) = 0 then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_scores) <> 'object' or char_length(coalesce(p_comment, '')) > 500 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  for crit in select * from jsonb_array_elements(c.rubric) loop
    k := crit ->> 'key';
    if coalesce(p_scores ->> k, '') !~ '^[1-5]$' then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  end loop;
  if (select count(*) from jsonb_object_keys(p_scores)) <> jsonb_array_length(c.rubric) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  insert into public.application_scores (application_id, reviewer_id, scores, comment)
  values (a.id, caller, p_scores, nullif(btrim(coalesce(p_comment, '')), ''))
  on conflict (application_id, reviewer_id) do update
    set scores = excluded.scores, comment = excluded.comment, updated_at = now();
  select * into res from private.application_score(a.id);
  perform private.add_application_event(a.id, 'scored', jsonb_build_object('average', res.average));
  perform private.write_audit('membership_application.scored', 'membership_application', a.id::text, null, jsonb_build_object('average', res.average));
  return jsonb_build_object('average', res.average, 'reviewers', res.reviewers);
end;
$$;

-- ------------------------------------------------------------------------------------------ 3. accept core (shared by reviewers and the system)
alter table public.membership_applications add column lapsed_at timestamptz;

create or replace function private.accept_application(a public.membership_applications, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.membership_cycles;
  existing public.members;
  v_member uuid;
  v_end date;
  today date := private.today_riyadh();
begin
  select * into c from public.membership_cycles where id = a.cycle_id;
  v_end := coalesce(c.term_ends_at, (today + interval '1 year')::date);
  select * into existing from public.members where user_id = a.user_id;
  if found then
    update public.members
       set status = 'active', status_reason = null, ended_at = null, end_reason = null, joined_cycle_id = a.cycle_id,
           application_id = a.id, term_starts_at = today, term_ends_at = v_end, activated_at = null,
           card_token = coalesce(card_token, private.new_token()),
           is_directory_visible = a.wants_directory_listing or is_directory_visible
     where id = existing.id returning id into v_member;
  else
    insert into public.members (
      user_id, status, joined_via, joined_cycle_id, application_id,
      first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en, phone,
      academic_status, university_id, major_id, sub_major_id, track_id, bio_ar, bio_en,
      portfolio_url, github_url, linkedin_url, x_url, is_directory_visible, term_starts_at, term_ends_at
    ) values (
      a.user_id, 'active', 'application', a.cycle_id, a.id,
      coalesce(a.first_name_ar, split_part(btrim(a.full_name_ar), ' ', 1)),
      a.middle_name_ar,
      coalesce(a.last_name_ar, btrim(substr(btrim(a.full_name_ar), length(split_part(btrim(a.full_name_ar), ' ', 1)) + 1))),
      coalesce(a.first_name_en, nullif(btrim(a.full_name_en), '')), a.middle_name_en, a.last_name_en,
      case when a.phone ~ '^\+[1-9][0-9]{6,14}$' then a.phone end,
      a.academic_status, a.university_id, a.major_id, a.sub_major_id, a.track_id, a.bio_ar, a.bio_en,
      a.portfolio_url, a.github_url, a.linkedin_url, a.x_url, a.wants_directory_listing, today, v_end
    ) returning id into v_member;
  end if;
  perform private.add_member_event(v_member, 'joined', jsonb_build_object('application', a.id, 'cycle', a.cycle_id));
  return jsonb_build_object('member', v_member, 'reused', existing.id is not null,
                            'prior_status', existing.status, 'prior_end_reason', existing.end_reason);
end;
$$;
revoke all on function private.accept_application(public.membership_applications, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ 4. claim, info request, decisions
create or replace function public.claim_membership_application(p_id uuid, p_release boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if p_release then
    if a.status <> 'under_review' or (a.reviewer_id is distinct from caller and not private.is_system_admin()) then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
    update public.membership_applications set status = 'submitted', reviewer_id = null where id = a.id;
  else
    if a.status = 'under_review' and a.reviewer_id is distinct from caller and not private.is_system_admin() then
      raise exception 'ALREADY_CLAIMED' using errcode = 'P0001';
    end if;
    if a.status not in ('submitted', 'under_review') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
    update public.membership_applications set status = 'under_review', reviewer_id = caller where id = a.id;
  end if;
  perform private.add_application_event(a.id, case when p_release then 'released' else 'claimed' end);
  perform private.write_audit('membership_application.' || case when p_release then 'released' else 'claimed' end,
    'membership_application', a.id::text, null, '{}'::jsonb);
end;
$$;

-- Ask the applicant to correct or add something (MBR-011). The fields say which parts may be edited.
create or replace function public.request_application_info(p_id uuid, p_message text, p_fields text[] default '{}')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
  msg text := nullif(btrim(coalesce(p_message, '')), '');
  f text;
  mine text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if msg is null or char_length(msg) > 1000 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select lower(email) into mine from public.profiles where id = caller;
  if a.user_id = caller or lower(a.email) = mine then raise exception 'SELF_DECISION' using errcode = 'P0001'; end if;
  if a.status not in ('submitted', 'under_review') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if a.status = 'under_review' and a.reviewer_id is distinct from caller and not private.is_system_admin() then
    raise exception 'ALREADY_CLAIMED' using errcode = 'P0001';
  end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if c.status = 'completed' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  foreach f in array coalesce(p_fields, '{}') loop
    if f not in ('portfolio_url', 'github_url', 'linkedin_url', 'x_url', 'bio_ar', 'bio_en')
       and not (f like 'q:%' and exists (select 1 from jsonb_array_elements(c.questions) x where x ->> 'key' = substr(f, 3))) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end loop;
  update public.membership_applications
     set status = 'info_requested', info_request = msg, info_fields = coalesce(p_fields, '{}'),
         info_requested_at = now(), reviewer_id = caller
   where id = a.id;
  perform private.add_application_event(a.id, 'info_requested', jsonb_build_object('fields', to_jsonb(coalesce(p_fields, '{}'::text[]))));
  perform private.write_audit('membership_application.info_requested', 'membership_application', a.id::text, null, '{}'::jsonb);
end;
$$;

-- Accept / reject / waitlist, one transaction per application, per-id results (MB-6, MB-7, MB-8, MB-11).
-- A rejection carries no reason to the applicant; the optional note stays internal.
create or replace function public.decide_membership_applications(p_ids uuid[], p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  to_status text;
  rec record;
  results jsonb := '[]'::jsonb;
  code text;
  cap integer;
  accepted integer;
  info jsonb;
  mine text;
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  to_status := case p_decision when 'accept' then 'accepted' when 'reject' then 'rejected' when 'waitlist' then 'waitlisted' end;
  if to_status is null or coalesce(array_length(p_ids, 1), 0) not between 1 and 200 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if note is not null and char_length(note) > 1000 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select lower(email) into mine from public.profiles where id = caller;

  -- lock the cycles in a stable order: capacity checks cannot race between reviewers
  perform 1 from public.membership_cycles
   where id in (select cycle_id from public.membership_applications where id = any (p_ids)) order by id for update;

  for rec in
    select a.* from public.membership_applications a where a.id = any (p_ids) order by a.submitted_at, a.id
  loop
    code := null;
    info := null;
    if rec.user_id = caller or lower(rec.email) = mine then
      code := 'SELF_DECISION';
    elsif rec.status not in ('submitted', 'under_review', 'waitlisted') then
      code := 'INVALID_TRANSITION';
    elsif rec.status = 'waitlisted' and to_status = 'waitlisted' then
      code := 'INVALID_TRANSITION';
    elsif rec.status = 'under_review' and rec.reviewer_id is distinct from caller and not private.is_system_admin() then
      code := 'ALREADY_CLAIMED';
    elsif to_status = 'accepted' then
      select capacity into cap from public.membership_cycles where id = rec.cycle_id;
      select count(*) into accepted from public.membership_applications where cycle_id = rec.cycle_id and status = 'accepted';
      if cap is not null and accepted >= cap then code := 'CAPACITY_REACHED'; end if;
      if code is null and rec.user_id is null then code := 'NO_ACCOUNT'; end if;
    end if;

    if code is null then
      update public.membership_applications
         set status = to_status, decided_by = caller, decided_at = now(), decision_note = note,
             reviewer_id = coalesce(reviewer_id, caller),
             accepted_at = case when to_status = 'accepted' then now() end
       where id = rec.id;
      if to_status = 'accepted' then
        info := private.accept_application((select a from public.membership_applications a where a.id = rec.id), caller);
      end if;
      perform private.add_application_event(rec.id, to_status, jsonb_build_object('from', rec.status) || coalesce(info, '{}'::jsonb));
      perform private.write_audit('membership_application.' || to_status, 'membership_application', rec.id::text, null,
        jsonb_build_object('cycle_id', rec.cycle_id, 'from', rec.status));
      results := results || jsonb_build_object('id', rec.id, 'ok', true, 'status', to_status);
    else
      results := results || jsonb_build_object('id', rec.id, 'ok', false, 'code', code);
    end if;
  end loop;

  select results || coalesce(jsonb_agg(jsonb_build_object('id', x, 'ok', false, 'code', 'NOT_FOUND')), '[]'::jsonb) into results
    from unnest(p_ids) x where not exists (select 1 from public.membership_applications where id = x);
  return results;
end;
$$;

-- Undo a decision within a few seconds (the e-mail is held back by the outbox for the same time).
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
     or a.decided_at < now() - interval '30 seconds' or (a.decided_by is distinct from caller and not private.is_system_admin()) then
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

-- ------------------------------------------------------------------------------------------ 5. reads for leadership
create or replace view public.membership_review_queue as
select a.id, a.cycle_id, a.user_id, a.status, a.full_name_ar, a.full_name_en, a.academic_status, a.university_id,
       a.major_id, a.track_id, a.preferred_committee_id, a.submitted_at, a.decided_at, a.reviewer_id, a.decision_note,
       a.wants_directory_listing, a.email,
       a.reference, a.first_name_ar, a.middle_name_ar, a.last_name_ar, a.first_name_en, a.middle_name_en, a.last_name_en,
       a.phone, a.locale, a.resubmitted_at, a.info_requested_at, a.info_request, a.accepted_at, a.lapsed_at,
       (select s.average from private.application_score_visible(a.id) s) as score_average,
       coalesce((select s.reviewers from private.application_score_visible(a.id) s), 0) as score_reviewers,
       (select p.full_name_ar from public.profiles p where p.id = a.reviewer_id) as reviewer_name,
       (select count(*) from public.membership_applications o where lower(o.email) = lower(a.email) and o.id <> a.id)::integer as earlier_count,
       (select count(*) from public.membership_applications o where lower(o.email) = lower(a.email) and o.id <> a.id and o.status = 'rejected')::integer as earlier_rejected,
       exists (select 1 from public.members m join public.profiles pr on pr.id = m.user_id
                where lower(pr.email) = lower(a.email) and m.status in ('active', 'suspended', 'expired')) as is_member,
       exists (select 1 from public.profiles pr where lower(pr.email) = lower(a.email) and pr.blocked_at is not null) as is_blocked,
       a.sub_major_id, a.portfolio_url, a.github_url, a.linkedin_url, a.x_url,
       a.bio_ar, a.bio_en, a.answers, a.consent_version, a.consent_at, a.info_fields
from public.membership_applications a
where private.has_permission('membership.review');
revoke all on public.membership_review_queue from anon, authenticated;
grant select on public.membership_review_queue to authenticated;

-- The cycle funnel: applied, in review, accepted, activated, lapsed, waitlisted.
create or replace view public.membership_cycle_funnel as
select c.id as cycle_id,
       count(a.id) filter (where a.status <> 'withdrawn')::integer as applied,
       count(a.id) filter (where a.status in ('submitted', 'under_review', 'info_requested'))::integer as in_review,
       count(a.id) filter (where a.status in ('accepted', 'lapsed'))::integer as accepted,
       count(a.id) filter (where a.status = 'accepted' and m.activated_at is not null)::integer as activated,
       count(a.id) filter (where a.status = 'lapsed')::integer as lapsed,
       count(a.id) filter (where a.status = 'waitlisted')::integer as waitlisted
  from public.membership_cycles c
  left join public.membership_applications a on a.cycle_id = c.id
  left join public.members m on m.application_id = a.id
 where private.has_permission('membership.manage_cycles') or private.has_permission('membership.review')
 group by c.id;
revoke all on public.membership_cycle_funnel from anon, authenticated;
grant select on public.membership_cycle_funnel to authenticated;

-- Waitlist order: best score first when the cycle has a rubric, otherwise order of submission (Q-L9).
create or replace view public.membership_waitlist as
select a.id as application_id, a.cycle_id, a.full_name_ar, a.full_name_en, a.reference, a.submitted_at,
       (select s.average from private.application_score_visible(a.id) s) as score_average,
       row_number() over (partition by a.cycle_id order by
         case when jsonb_array_length(c.rubric) > 0 then (select s.average from private.application_score_visible(a.id) s) end desc nulls last,
         a.submitted_at, a.id)::integer as position
  from public.membership_applications a
  join public.membership_cycles c on c.id = a.cycle_id
 where a.status = 'waitlisted' and private.has_permission('membership.review');
revoke all on public.membership_waitlist from anon, authenticated;
grant select on public.membership_waitlist to authenticated;

do $$
declare f text;
begin
  foreach f in array array[
    'save_application_score(uuid, jsonb, text)', 'request_application_info(uuid, text, text[])',
    'undo_application_decision(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
