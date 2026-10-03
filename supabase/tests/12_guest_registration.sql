-- Guest registration: the seat rules, validation, the anti-spam layers (honeypot, fill time, throttles), duplicates.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.event_registrations;
delete from public.events where legacy_id is not null;

create temp table _e (k text primary key, id uuid);
grant select on _e to anon, authenticated;
with ins as (
  insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, start_time, end_time,
                             location_mode, seats, requires_approval, waitlist_enabled, audience, published_at)
  select s.slug, (select id from public.committees where slug = 'ai'), 'workshop', 'published', 'فعالية ' || s.slug, 'Event ' || s.slug,
         'single_day', (now() at time zone 'Asia/Riyadh')::date + s.days, '18:00', '20:00', 'online', s.seats, s.approval, s.waitlist, s.audience, now()
  from (
    select 'g-auto' as slug, 10 as seats, false as approval, false as waitlist, 'public' as audience, 30 as days
    union all select 'g-approval', 10, true,  false, 'public',       30
    union all select 'g-one',      1,  false, true,  'public',       30
    union all select 'g-full',     1,  false, false, 'public',       30
    union all select 'g-members',  null, false, false, 'members_only', 30
    union all select 'g-past',     null, false, false, 'public',       -5
  ) s
  returning slug, id
)
insert into _e select slug, id from ins;

set local role anon;

select is((public.register_guest((select id from _e where k = 'g-auto'), 'Guest Visitor One', 'Guest.One@Example.test', '+966 50 123 4567', '{"university":"KSU"}', 'ip-a', null, 5000, 'v1') ->> 'status'),
  'accepted', 'an automatic event accepts a guest at once');
reset role;
select is((select email_snapshot from public.event_registrations where full_name_snapshot = 'Guest Visitor One'), 'guest.one@example.test', 'the e-mail is stored in lower case');
select is((select user_id from public.event_registrations where full_name_snapshot = 'Guest Visitor One'), null, 'a guest has no account');
select is((select answers ->> 'phone' from public.event_registrations where full_name_snapshot = 'Guest Visitor One'), '+966 50 123 4567', 'the phone is kept with the answers');
select is((select answers ->> 'university' from public.event_registrations where full_name_snapshot = 'Guest Visitor One'), 'KSU', 'and the university');
select is((select summary ->> 'guest' from public.audit_logs where action = 'registration.created' order by id desc limit 1), 'true', 'the registration is audited as a guest');

set local role anon;
select is((public.register_guest((select id from _e where k = 'g-approval'), 'Guest Visitor Two', 'two@example.test', '0501234567', '{}', 'ip-b', null, 5000, 'v1') ->> 'status'),
  'pending', 'an approval event keeps the guest pending');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Guest Visitor One', 'GUEST.one@example.test', '0501234567', '{}', 'ip-c', null, 5000, 'v1') ->> 'code'),
  'ALREADY_REGISTERED', 'the same e-mail cannot register twice (case-insensitive)');

-- seats: one seat, waitlist enabled
select is((public.register_guest((select id from _e where k = 'g-one'), 'First Guest', 'first@example.test', '0501234567', '{}', 'ip-d', null, 5000, 'v1') ->> 'status'), 'accepted', 'the first guest takes the last seat');
select is((public.register_guest((select id from _e where k = 'g-one'), 'Second Guest', 'second@example.test', '0501234567', '{}', 'ip-e', null, 5000, 'v1') ->> 'status'), 'waitlisted', 'the next one is waitlisted');
select is((public.register_guest((select id from _e where k = 'g-full'), 'First Guest', 'first@example.test', '0501234567', '{}', 'ip-f', null, 5000, 'v1') ->> 'status'), 'accepted', 'the single seat of the full event');
select is((public.register_guest((select id from _e where k = 'g-full'), 'Late Guest', 'late@example.test', '0501234567', '{}', 'ip-g', null, 5000, 'v1') ->> 'code'), 'EVENT_FULL', 'a full event without a waitlist refuses');

-- consent
select is((public.register_guest((select id from _e where k = 'g-auto'), 'No Consent', 'noconsent@example.test', '0501234567', '{}', 'ip-z', null, 5000) ->> 'code'), 'CONSENT_REQUIRED', 'registering without accepting the privacy notice is refused');

-- audience and phase
select is((public.register_guest((select id from _e where k = 'g-members'), 'Guest Member', 'mem@example.test', '0501234567', '{}', 'ip-h', null, 5000, 'v1') ->> 'code'), 'MEMBERS_ONLY', 'members-only events need an account');
select is((public.register_guest((select id from _e where k = 'g-past'), 'Guest Past', 'past@example.test', '0501234567', '{}', 'ip-i', null, 5000, 'v1') ->> 'code'), 'REGISTRATION_CLOSED', 'a past event is closed');
select is((public.register_guest(gen_random_uuid(), 'Guest Nowhere', 'no@example.test', '0501234567', '{}', 'ip-j', null, 5000, 'v1') ->> 'code'), 'REGISTRATION_CLOSED', 'an unknown event is closed');

-- validation
select is((public.register_guest((select id from _e where k = 'g-auto'), 'AB', 'ok@example.test', '0501234567', '{}', 'ip-k', null, 5000, 'v1') ->> 'field'), 'name', 'a too-short name is refused');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Valid Name', 'not-an-email', '0501234567', '{}', 'ip-l', null, 5000, 'v1') ->> 'field'), 'email', 'a malformed e-mail is refused');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Valid Name', 'ok2@example.test', '12', '{}', 'ip-m', null, 5000, 'v1') ->> 'field'), 'phone', 'a short phone is refused');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Valid Name', 'ok3@example.test', 'abcdefghij', '{}', 'ip-n', null, 5000, 'v1') ->> 'field'), 'phone', 'letters are not a phone');

-- anti-spam
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Bot Name', 'bot@example.test', '0501234567', '{}', 'ip-o', 'http://spam.test', 5000, 'v1') ->> 'ok'), 'true', 'a filled honeypot looks like success to the bot');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Fast Name', 'fast@example.test', '0501234567', '{}', 'ip-p', null, 300, 'v1') ->> 'code'), 'TOO_FAST', 'a form filled in under 1.5 s is refused');
reset role;
select is((select count(*)::int from public.event_registrations where email_snapshot in ('bot@example.test', 'fast@example.test')), 0, 'neither the bot nor the fast form stored a registration');

set local role anon;
select public.register_guest((select id from _e where k = 'g-auto'), 'Spam Name', 'spam@example.test', 'x', '{}', 'ip-q', null, 5000, 'v1');
select public.register_guest((select id from _e where k = 'g-auto'), 'Spam Name', 'spam@example.test', 'x', '{}', 'ip-r', null, 5000, 'v1');
select public.register_guest((select id from _e where k = 'g-auto'), 'Spam Name', 'spam@example.test', 'x', '{}', 'ip-s', null, 5000, 'v1');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Spam Name', 'spam@example.test', '0501234567', '{}', 'ip-t', null, 5000, 'v1') ->> 'code'), 'RATE_LIMITED', 'the fourth attempt for one e-mail in three minutes is throttled');
select is((select count(*)::int from (select public.register_guest((select id from _e where k = 'g-auto'), 'Many ' || g, 'many' || g || '@example.test', 'x', '{}', 'same-ip', null, 5000, 'v1') from generate_series(1, 8) g) x), 8, 'eight attempts from one address are answered');
select is((public.register_guest((select id from _e where k = 'g-auto'), 'Many Nine', 'many9@example.test', '0501234567', '{}', 'same-ip', null, 5000, 'v1') ->> 'code'), 'RATE_LIMITED', 'the ninth from the same address is throttled');
select throws_ok($$select * from public.registration_attempts$$, '42501', null, 'the attempt log is not readable by visitors');
select throws_ok($$insert into public.event_registrations (event_id, status, full_name_snapshot, email_snapshot) values ((select id from _e where k = 'g-auto'), 'accepted', 'Direct', 'direct@example.test')$$, '42501', null, 'registrations cannot be written directly');

select * from finish();
rollback;
