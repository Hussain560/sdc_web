-- Membership without an account (owner decision, 2026-10-03): non-members never sign up or log in. During an
-- intake cycle (دورة استقبال) anyone applies with a form; when leadership accepts, the member's account is created
-- and an e-mail carries the link to activate it. Same anti-spam layers as guest event registration.

alter table public.membership_applications alter column user_id drop not null;
alter table public.membership_applications add column email text;
alter table public.membership_applications add column locale text not null default 'ar' check (locale in ('ar', 'en'));
update public.membership_applications a set email = lower(p.email) from public.profiles p where p.id = a.user_id;
alter table public.membership_applications alter column email set not null;
alter table public.membership_applications
  add constraint membership_applications_email_check check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(email) <= 160);
create unique index membership_applications_email_cycle_uq
  on public.membership_applications (cycle_id, lower(email)) where status <> 'withdrawn';

-- Existing code paths that create an application for a signed-in person keep working: they must now fill the e-mail.
create or replace function private.application_email_default() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is not null then
    select coalesce(new.email, lower(email)), preferred_locale into new.email, new.locale from public.profiles where id = new.user_id;
  end if;
  return new;
end;
$$;
create trigger membership_applications_email_default before insert on public.membership_applications
  for each row execute function private.application_email_default();

-- Reviewers read the applicant's e-mail from the application itself (the person may have no account yet).
create or replace view public.membership_review_queue as
select a.id, a.cycle_id, a.user_id, a.status, a.full_name_ar, a.full_name_en, a.academic_status, a.university_id,
       a.major_id, a.track_id, a.preferred_committee_id, a.submitted_at, a.decided_at, a.reviewer_id, a.decision_note,
       a.wants_directory_listing, a.email
from public.membership_applications a
where private.has_permission('membership.review');

create table public.application_attempts (
  id         bigint generated always as identity primary key,
  cycle_id   uuid not null references public.membership_cycles (id) on delete cascade,
  email_hash text not null,
  ip_hash    text,
  at         timestamptz not null default now()
);
create index application_attempts_email_idx on public.application_attempts (cycle_id, email_hash, at desc);
create index application_attempts_ip_idx on public.application_attempts (ip_hash, at desc);
alter table public.application_attempts enable row level security;
revoke all on table public.application_attempts from anon, authenticated;
comment on table public.application_attempts is 'Public membership application attempts (hashed e-mail and IP), only to throttle abuse; purged after a day.';

-- Expected failures are RETURNED (not raised) so the throttle rows persist.
create or replace function public.apply_for_membership(
  p_cycle uuid,
  p jsonb,
  p_ip_hash text default null,
  p_honeypot text default null,
  p_elapsed_ms integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.membership_cycles;
  mail text := lower(btrim(coalesce(p ->> 'email', '')));
  mail_hash text;
  v_id uuid;
  loc text := case when p ->> 'lang' = 'en' then 'en' else 'ar' end;
begin
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    return jsonb_build_object('ok', true, 'id', null);   -- a bot: pretend, store nothing
  end if;

  select * into c from public.membership_cycles where id = p_cycle and status = 'published';
  if not found then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND'); end if;
  -- MB-1: the database clock decides, not the browser.
  if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'CYCLE_CLOSED');
  end if;

  mail_hash := encode(extensions.digest(mail || ':' || p_cycle::text, 'sha256'), 'hex');
  delete from public.application_attempts where at < now() - interval '1 day';
  if (select count(*) from public.application_attempts where cycle_id = p_cycle and email_hash = mail_hash and at > now() - interval '3 minutes') >= 3
     or (p_ip_hash is not null and (select count(*) from public.application_attempts where ip_hash = p_ip_hash and at > now() - interval '10 minutes') >= 6) then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  insert into public.application_attempts (cycle_id, email_hash, ip_hash) values (p_cycle, mail_hash, p_ip_hash);

  if p_elapsed_ms is not null and p_elapsed_ms < 5000 then return jsonb_build_object('ok', false, 'code', 'TOO_FAST'); end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or char_length(mail) > 160 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'email');
  end if;
  if coalesce(btrim(p ->> 'consent_version'), '') = '' or coalesce((p ->> 'consent')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;
  begin
    perform private.validate_application(p, c.questions);
  exception when sqlstate 'P0001' then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end;

  if exists (select 1 from public.members m join public.profiles pr on pr.id = m.user_id
              where lower(pr.email) = mail and m.status = 'active') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_MEMBER');
  end if;
  if exists (select 1 from public.membership_applications where cycle_id = c.id and lower(email) = mail and status <> 'withdrawn') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_APPLIED');
  end if;

  begin
    insert into public.membership_applications (
      cycle_id, user_id, email, locale, full_name_ar, full_name_en, phone, academic_status, university_id, major_id,
      sub_major_id, track_id, preferred_committee_id, bio_ar, bio_en, portfolio_url, github_url, linkedin_url, x_url,
      answers, wants_directory_listing, consent_version
    ) values (
      c.id, null, mail, loc, btrim(p ->> 'full_name_ar'), nullif(btrim(p ->> 'full_name_en'), ''), nullif(p ->> 'phone', ''),
      p ->> 'academic_status', nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint,
      nullif(p ->> 'sub_major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint,
      nullif(p ->> 'preferred_committee_id', '')::uuid, nullif(p ->> 'bio_ar', ''), nullif(p ->> 'bio_en', ''),
      nullif(p ->> 'portfolio_url', ''), nullif(p ->> 'github_url', ''), nullif(p ->> 'linkedin_url', ''),
      nullif(p ->> 'x_url', ''), coalesce(p -> 'answers', '{}'::jsonb),
      coalesce((p ->> 'wants_directory_listing')::boolean, false), p ->> 'consent_version'
    ) returning id into v_id;
  exception
    when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
      return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
    when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'ALREADY_APPLIED');
  end;

  perform private.write_audit('membership_application.submitted', 'membership_application', v_id::text, null,
    jsonb_build_object('cycle_id', c.id, 'guest', true));
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;
revoke all on function public.apply_for_membership(uuid, jsonb, text, text, integer) from public;
grant execute on function public.apply_for_membership(uuid, jsonb, text, text, integer) to anon, authenticated;
