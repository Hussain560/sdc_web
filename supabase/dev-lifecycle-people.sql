-- LOCAL ONLY: puts the Sprint 18 lifecycle personas (scripts/dev-personas.mjs) into their states and gives the seeded
-- applications known tracking links. Run AFTER `npm run db:personas` and supabase/dev-lifecycle-seed.sql.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-lifecycle-people.sql
-- Safe to run twice.
begin;

-- Names and terms for every persona member.
update public.members m set
  last_name_ar = 'التجريبي', first_name_en = 'Dev', last_name_en = 'Member',
  term_starts_at = coalesce(m.term_starts_at, current_date - 300),
  term_ends_at = coalesce(m.term_ends_at, current_date + 65)
where m.user_id in (select id from public.profiles where email like 'dev.%@example.test');

-- New member: has never seen the welcome tour.
update public.members set onboarded_at = null, onboarding_step = 0, joined_at = now() - interval '2 days',
  term_starts_at = current_date, term_ends_at = current_date + 365
where user_id = (select id from public.profiles where email = 'dev.newmember@example.test');

-- Everyone else has seen it.
update public.members set onboarded_at = coalesce(onboarded_at, now() - interval '30 days'), onboarding_step = 5
where user_id in (select id from public.profiles where email like 'dev.%@example.test')
  and user_id <> (select id from public.profiles where email = 'dev.newmember@example.test');

-- Ending soon (12 days): the member sees the renewal request, leadership sees it in the "ending soon" tab.
update public.members set term_starts_at = current_date - 353, term_ends_at = current_date + 12
where user_id = (select id from public.profiles where email = 'dev.expiring@example.test');

-- Expired yesterday.
update public.members set status = 'expired', term_starts_at = current_date - 366, term_ends_at = current_date - 1
where user_id = (select id from public.profiles where email = 'dev.expired@example.test');

-- Suspended for inactivity until next month (the category is visible to the member; the reason is not).
update public.members set status = 'suspended', suspension_category = 'inactivity',
  suspended_until = current_date + 30, status_reason = 'INTERNAL: no activity for 9 months'
where user_id = (select id from public.profiles where email = 'dev.suspended@example.test');

-- Ended (left).
update public.members set status = 'ended', end_reason = 'left', ended_at = now() - interval '10 days', is_directory_visible = false
where user_id = (select id from public.profiles where email = 'dev.ended@example.test');

-- A pending leave request waiting for leadership.
insert into public.member_leave_requests (member_id, status, reason, preferred_last_day)
select m.id, 'pending', 'أنتقل للعمل خارج المملكة ولن أتمكن من المشاركة.', current_date + 14
from public.members m join public.profiles p on p.id = m.user_id
where p.email = 'dev.leaving@example.test'
  and not exists (select 1 from public.member_leave_requests r where r.member_id = m.id and r.status = 'pending');

-- Blocked account: profile flag + the auth ban (what block_accounts does).
update public.profiles set blocked_at = now() - interval '1 day', blocked_reason = 'INTERNAL: spam reports'
where email = 'dev.blocked@example.test';
update auth.users set banned_until = 'infinity' where email = 'dev.blocked@example.test';

-- Known tracking links: /join/status/<token> with token = sha256("dev-track-<n>") in hex (see docs guide) for every seeded application.
update public.membership_applications
   set tracking_token_hash = private.token_hash(encode(sha256(convert_to('dev-track-' || right(id::text, 4)::int, 'UTF8')), 'hex'))
 where id::text like '00000000-0000-0000-0000-0000000e%';

-- Make application 5 (info requested) say what is asked.
update public.membership_applications set info_request = 'أضف رابطاً لأحد أعمالك (GitHub أو موقعك).',
  info_fields = array['github_url'], info_requested_at = now() - interval '1 day'
where id = '00000000-0000-0000-0000-0000000e0005';

commit;
