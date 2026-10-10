-- Demo events for LOCAL development only (npm run db:demo). Not part of migrations or the e2e seed.
-- Covers the event page states: open, closes soon, full with a waiting list, full, members only, running now,
-- announced without a date, finished and cancelled. Dates are relative to today so the states stay true.
-- Idempotent: re-running changes nothing.
do $$
declare
  c uuid := (select id from public.committees where status = 'active' order by display_order limit 1);
  d date := current_date;
begin
  insert into public.events
    (slug, committee_id, type, status, title_ar, title_en, summary_ar, summary_en, description_ar, description_en,
     schedule_type, start_date, end_date, start_time, end_time, location_mode, location_ar, location_en, seats,
     registration_start_at, registration_end_at, requires_approval, waitlist_enabled, audience, certificate_available,
     published_at, cancelled_at, cancel_reason)
  values
    ('demo-open', c, 'workshop', 'published', 'ورشة بناء واجهات متجاوبة', 'Responsive interfaces workshop',
     'ورشة عملية لبناء واجهات تعمل على كل الشاشات.', 'A hands-on workshop on interfaces that work on every screen.',
     'نتعلم معاً أسس التصميم المتجاوب باستخدام CSS الحديث.', 'We learn responsive design with modern CSS.',
     'single_day', d + 12, d + 12, '18:00', '20:00', 'in_person', 'الأحساء · جامعة الملك فيصل', 'Al-Ahsa · King Faisal University', 60,
     now() - interval '3 days', now() + interval '10 days', false, false, 'public', true, now(), null, null),
    ('demo-closes-soon', c, 'talk', 'published', 'لقاء: مستقبل الذكاء الاصطناعي', 'Talk: the future of AI',
     'حوار مفتوح مع مختصين.', 'An open conversation with specialists.', null, null,
     'single_day', d + 3, d + 3, '19:00', '21:00', 'online', null, null, 100,
     now() - interval '10 days', now() + interval '20 hours', false, false, 'public', false, now(), null, null),
    ('demo-waitlist', c, 'bootcamp', 'published', 'معسكر الأمن السيبراني', 'Cybersecurity bootcamp',
     'ثلاثة أيام مكثفة.', 'Three intensive days.', null, null,
     'consecutive_range', d + 20, d + 22, '10:00', '16:00', 'in_person', 'الرياض', 'Riyadh', 1,
     now() - interval '5 days', now() + interval '15 days', false, true, 'public', true, now(), null, null),
    ('demo-members-only', c, 'meeting', 'published', 'لقاء الأعضاء الشهري', 'Monthly members meeting',
     'لقاء مخصص لأعضاء المجتمع.', 'A meeting for community members.', null, null,
     'single_day', d + 8, d + 8, '20:00', '21:00', 'online', null, null, 40,
     now() - interval '1 day', now() + interval '7 days', false, false, 'members_only', false, now(), null, null),
    ('demo-running', c, 'hackathon', 'published', 'هاكاثون المجتمع', 'Community hackathon',
     'ثمانٍ وأربعون ساعة من البناء.', 'Forty-eight hours of building.', null, null,
     'consecutive_range', d - 1, d + 1, '09:00', '23:00', 'in_person', 'جدة', 'Jeddah', 80,
     now() - interval '20 days', now() - interval '2 days', false, false, 'public', true, now(), null, null),
    ('demo-announced', c, 'workshop', 'published', 'ورشة قادمة، الموعد قريباً', 'Upcoming workshop, date soon',
     null, null, null, null,
     'single_day', null, null, null, null, 'in_person', null, null, null,
     null, null, false, false, 'public', false, now(), null, null),
    ('demo-finished', c, 'workshop', 'published', 'ورشة Git و GitHub', 'Git and GitHub workshop',
     'ورشة منتهية.', 'A finished workshop.', null, null,
     'single_day', d - 30, d - 30, '18:00', '20:00', 'online', null, null, 50,
     now() - interval '40 days', now() - interval '31 days', false, false, 'public', true, now() - interval '35 days', null, null)
  on conflict (slug) do nothing;
end $$;

-- Fuller content so every section of the event page shows: seats bar, goals, audience, what to bring, FAQ, details
-- and presenters. The FAQ item with an empty question and the "None." entries are kept on purpose: the page leaves
-- them out. Re-running resets these demo rows to the same values.
update public.events
set display_config = display_config || '{"show_seats_remaining": true, "show_presenters": true, "show_goals": true}'::jsonb
where slug like 'demo-%';

update public.events
set goals = '{"ar": ["تقسيم الواجهة إلى مكوّنات قابلة لإعادة الاستخدام.", "بناء تخطيط متجاوب يعمل من الجوال إلى الشاشات الكبيرة."], "en": ["Split an interface into reusable components.", "Build a layout that responds from phones to large screens."]}'::jsonb,
    details = '{
      "target_audience": {"ar": ["طلاب، خريجون، موظفون", "من لديه معرفة أساسية بـ HTML وCSS"], "en": ["Students, graduates, employees", "Anyone with basic HTML and CSS"]},
      "what_to_bring": {"ar": ["حاسوب محمول مثبّت عليه Node.js", "حساب على GitHub"], "en": ["A laptop with Node.js installed", "A GitHub account"]},
      "responsibilities": {"ar": ["الحضور والالتزام بوقت الورشة.", "المشاركة الفعالة أثناء التطبيق العملي."], "en": ["Arrive on time.", "Take part in the hands-on session."]},
      "deliverables": {"ar": ["واجهة متجاوبة منشورة على رابط عام."], "en": ["A responsive interface published at a public link."]},
      "requirements": {"ar": ["لا يوجد."], "en": ["None."]},
      "benefits": {"ar": ["لا يوجد."], "en": ["None."]}
    }'::jsonb,
    faq = '[
      {"q_ar": "هل أحتاج إلى حساب في الموقع للتسجيل؟", "q_en": "Do I need an account to register?", "a_ar": "لا. يكفي الاسم والبريد الإلكتروني ورقم الجوال، ويصلك التأكيد على بريدك.", "a_en": "No. Your name, e-mail and mobile number are enough; the confirmation arrives by e-mail."},
      {"q_ar": "", "q_en": "", "a_ar": "إجابة بلا سؤال، لا تظهر في الصفحة.", "a_en": "An answer with no question; it does not show on the page."}
    ]'::jsonb,
    map_url = 'https://maps.google.com/?q=King+Faisal+University',
    contact_email = 'events@example.com'
where slug = 'demo-open';

insert into public.event_presenters (event_id, guest_name_ar, guest_name_en, guest_title_ar, guest_title_en, role, sort_order)
select e.id, v.n_ar, v.n_en, v.t_ar, v.t_en, v.role, v.ord
from public.events e,
  (values ('سارة العتيبي', 'Sara Al Otaibi', 'مهندسة واجهات', 'Front-end engineer', 'presenter', 0),
          ('خالد الدوسري', 'Khalid Al Dossary', 'مرشد تقني', 'Technical mentor', 'mentor', 1)) as v(n_ar, n_en, t_ar, t_en, role, ord)
where e.slug = 'demo-open'
  and not exists (select 1 from public.event_presenters p where p.event_id = e.id);

-- The remaining states of the event page canvas (S1, S4, S5, S6, S9, S12) and filled seats, so the seats bar and the
-- full and waiting-list states are real. S8 (registered, under review, on the waiting list) needs a signed-in member:
-- sign in locally and register for demo-open (or demo-waitlist for the waiting list).
do $$
declare
  c uuid := (select id from public.committees where status = 'active' order by display_order limit 1);
  d date := current_date;
begin
  insert into public.events
    (slug, committee_id, type, status, title_ar, title_en, summary_ar, summary_en,
     schedule_type, start_date, end_date, start_time, end_time, location_mode, location_ar, location_en, seats,
     registration_start_at, registration_end_at, requires_approval, waitlist_enabled, audience, certificate_available,
     published_at, cancelled_at, cancel_reason)
  values
    ('demo-opens-soon', c, 'workshop', 'published', 'ورشة تفتح للتسجيل قريباً', 'Workshop opening soon',
     'التسجيل لم يبدأ بعد.', 'Registration has not started yet.',
     'single_day', d + 25, d + 25, '17:00', '19:00', 'in_person', 'الدمام', 'Dammam', 40,
     now() + interval '3 days', now() + interval '20 days', false, false, 'public', true, now(), null, null),
    ('demo-full', c, 'meetup', 'published', 'لقاء اكتمل عدده', 'A meetup that is full',
     'اكتملت المقاعد ولا توجد قائمة انتظار.', 'Every seat is taken and there is no waiting list.',
     'single_day', d + 9, d + 9, '19:00', '21:00', 'online', null, null, 2,
     now() - interval '6 days', now() + interval '6 days', false, false, 'public', false, now(), null, null),
    ('demo-closed', c, 'talk', 'published', 'محاضرة أُغلق التسجيل فيها', 'A talk with registration closed',
     'انتهت فترة التسجيل.', 'The registration period has ended.',
     'single_day', d + 5, d + 5, '18:00', '19:30', 'online', null, null, 80,
     now() - interval '12 days', now() - interval '1 day', false, false, 'public', false, now(), null, null),
    ('demo-checkin', c, 'workshop', 'published', 'ورشة جارية وتسجيل الحضور مفتوح', 'Workshop running, check-in open',
     'يمكن للحاضرين تسجيل حضورهم الآن.', 'Attendees can check in now.',
     'consecutive_range', d - 1, d + 1, '09:00', '23:00', 'in_person', 'الأحساء', 'Al-Ahsa', 50,
     now() - interval '15 days', now() - interval '2 days', false, false, 'public', true, now(), null, null),
    ('demo-cancelled', c, 'workshop', 'cancelled', 'ورشة أُلغيت', 'A cancelled workshop',
     'ورشة ملغاة.', 'A cancelled workshop.',
     'single_day', d + 14, d + 14, '18:00', '20:00', 'in_person', 'الرياض', 'Riyadh', 30,
     now() - interval '8 days', now() + interval '10 days', false, false, 'public', false, now() - interval '9 days',
     now() - interval '1 day', 'تعذّر حضور المدرّب، وسنعلن موعداً بديلاً قريباً.')
  on conflict (slug) do nothing;

  update public.events set display_config = display_config || '{"show_seats_remaining": true}'::jsonb
  where slug in ('demo-opens-soon', 'demo-full', 'demo-closed', 'demo-checkin', 'demo-cancelled');

  -- Full events only stay "open" (S4 waiting list, S5 full) when auto-close is off; with it on they read as closed.
  update public.events set display_config = display_config || '{"auto_close_registration": false}'::jsonb
  where slug in ('demo-waitlist', 'demo-full');

  -- Fill seats with guest registrations: demo-open 48/60 (12 left), demo-waitlist 1/1 (full, waiting list), demo-full 2/2.
  insert into public.event_registrations (event_id, status, full_name_snapshot, email_snapshot)
  select e.id, 'accepted', 'Demo guest ' || n, 'demo-' || e.slug || '-' || n || '@example.test'
  from public.events e
  join (values ('demo-open', 48), ('demo-waitlist', 1), ('demo-full', 2)) as f(slug, cnt) on f.slug = e.slug
  cross join lateral generate_series(1, f.cnt) as n
  where not exists (
    select 1 from public.event_registrations r
    where r.event_id = e.id and r.email_snapshot = 'demo-' || e.slug || '-' || n || '@example.test'
  );

  -- An open check-in session for today on demo-checkin (S9); demo-running has none (S10).
  insert into public.attendance_sessions (event_id, event_date_id, status)
  select ed.event_id, ed.id, 'open'
  from public.event_dates ed
  join public.events e on e.id = ed.event_id
  where e.slug = 'demo-checkin' and ed.event_date = d
    and not exists (select 1 from public.attendance_sessions s where s.event_date_id = ed.id);
end $$;

-- Attendance states on demo-checkin (the event with today's check-in session open):
-- 4 accepted and checked in today (QR, online and manual), 3 accepted and not yet checked in, 1 pending and
-- 1 on the waiting list (they cannot check in). Re-running adds nothing new.
do $$
declare
  ev uuid := (select id from public.events where slug = 'demo-checkin');
  today date := current_date;
  sess uuid := (
    select s.id from public.attendance_sessions s
    join public.event_dates d on d.id = s.event_date_id
    where s.event_id = (select id from public.events where slug = 'demo-checkin') and d.event_date = today
    limit 1
  );
  r record;
begin
  for r in
    select * from (values
      ('attend-1', 'سارة العتيبي', 'accepted', 'qr'),
      ('attend-2', 'خالد الدوسري', 'accepted', 'qr'),
      ('attend-3', 'نورة القحطاني', 'accepted', 'online'),
      ('attend-4', 'عبدالله الشمري', 'accepted', 'manual'),
      ('wait-1', 'ريم الحربي', 'accepted', null),
      ('wait-2', 'فهد المطيري', 'accepted', null),
      ('wait-3', 'لمى العنزي', 'accepted', null),
      ('pending-1', 'يوسف الزهراني', 'pending', null),
      ('waitlist-1', 'هند السبيعي', 'waitlisted', null)
    ) as v(tag, name, st, method)
  loop
    insert into public.event_registrations (event_id, status, full_name_snapshot, email_snapshot)
    select ev, r.st, r.name, 'demo-' || r.tag || '@example.test'
    where not exists (
      select 1 from public.event_registrations x where x.event_id = ev and x.email_snapshot = 'demo-' || r.tag || '@example.test'
    );

    if r.method is not null and sess is not null then
      insert into public.attendance_records (session_id, registration_id, method, checked_in_at)
      select sess, x.id, r.method, now() - interval '20 minutes'
      from public.event_registrations x
      where x.event_id = ev and x.email_snapshot = 'demo-' || r.tag || '@example.test'
        and not exists (select 1 from public.attendance_records a where a.session_id = sess and a.registration_id = x.id);
    end if;
  end loop;
end $$;
