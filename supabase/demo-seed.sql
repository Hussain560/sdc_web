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
