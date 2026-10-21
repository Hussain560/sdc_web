-- Team test data for the SHARED, HOSTED "develop" Supabase project. Run it in the Supabase SQL editor (project:
-- develop) after the migrations are applied. NEVER run it on production, and never commit a real password into it.
--
--   1. Set v_password and v_confirm_develop below (the script refuses to run until both are changed).
--   2. Run this whole file once. It is idempotent: running it again adds nothing that already exists.
--   3. Run supabase/demo-seed.sql after it for the demo events (every event page state, filled seats, check-in
--      records). If you run demo-seed.sql first, section 5 here also adds registrations for the member accounts.
--
-- What it creates (all @example.test, fictional):
--   accounts for every role, members (listed / hidden / suspended / inactive), applicants in each review state,
--   one open intake cycle, sample articles in each editorial state, and registrations in each member-side state.
-- Accounts are confirmed, so they sign in at once. Password reset e-mails go nowhere (example.test), so a
-- forgotten password is fixed by re-running section 1 after deleting the user in Authentication -> Users.

do $seed$
declare
  -- ---- edit these two lines before running -------------------------------------------------------------------------
  v_password          constant text    := 'CHANGE-ME';  -- one shared password for every team account (12+ chars)
  v_confirm_develop   constant boolean := false;        -- set to true ONLY if this is the develop project
  -- -----------------------------------------------------------------------------------------------------------------
  v_domain            constant text := '@example.test';
  p                   record;
  v_id                uuid;
  v_admin             uuid;
  v_cycle             uuid;
  v_ev                uuid;
  v_committee         uuid;
begin
  if not v_confirm_develop or v_password = 'CHANGE-ME' or char_length(v_password) < 12 then
    raise exception 'Set v_password (12+ characters) and v_confirm_develop = true first. Do not run this on production.';
  end if;

  -- ------------------------------------------------------------------------------------------------ 1. accounts
  -- kind: role = holds a position; member = community member without a position; applicant = applied to the open
  -- cycle; plain = signed-up user only. status/listed apply to member rows.
  for p in
    select * from (values
      ('team.admin',        'مدير النظام (فريق)',            'system_admin',     null,               'role',      'active',    false),
      ('team.leader',       'قائد المجتمع (فريق)',           'community_leader', null,               'role',      'active',    false),
      ('team.founder',      'مؤسس (فريق)',                   'founder',          null,               'role',      'active',    false),
      ('team.advisor',      'مستشار (فريق)',                 'advisor',          null,               'role',      'active',    false),
      ('team.head.ai',      'قائد لجنة الذكاء الاصطناعي (فريق)', 'committee_head', 'ai',              'role',      'active',    false),
      ('team.deputy.ai',    'نائب قائد لجنة الذكاء الاصطناعي (فريق)', 'committee_deputy', 'ai',       'role',      'active',    false),
      ('team.member.ai',    'عضو لجنة الذكاء الاصطناعي (فريق)', 'committee_member', 'ai',            'role',      'active',    false),
      ('team.head.cyber',   'قائد لجنة الأمن السيبراني (فريق)', 'committee_head', 'cybersecurity',   'role',      'active',    false),
      ('team.member.cyber', 'عضو لجنة الأمن السيبراني (فريق)', 'committee_member', 'cybersecurity',  'role',      'active',    false),
      ('team.head.tech',    'قائد لجنة التقنية والتطوير (فريق)', 'committee_head', 'tech-development','role',     'active',    false),
      ('team.regular.1',    'عضو مجتمع ظاهر في الدليل (فريق)', null,             null,               'member',    'active',    true),
      ('team.regular.2',    'عضو مجتمع مخفي من الدليل (فريق)', null,             null,               'member',    'active',    false),
      ('team.suspended',    'عضو موقوف (فريق)',               null,               null,               'member',    'suspended', false),
      ('team.inactive',     'عضو غير نشط (فريق)',             null,               null,               'member',    'inactive',  false),
      ('team.applicant.1',  'متقدم بطلب جديد (فريق)',         null,               null,               'applicant', 'submitted', false),
      ('team.applicant.2',  'متقدم قيد المراجعة (فريق)',      null,               null,               'applicant', 'under_review', false),
      ('team.applicant.3',  'متقدم في قائمة الانتظار (فريق)', null,               null,               'applicant', 'waitlisted', false),
      ('team.applicant.4',  'متقدم مرفوض (فريق)',             null,               null,               'applicant', 'rejected', false),
      ('team.plain',        'مستخدم عادي بلا طلب (فريق)',     null,               null,               'plain',     null,        false)
    ) as t(handle, name_ar, role_key, committee_slug, kind, state, listed)
  loop
    select id into v_id from auth.users where lower(email) = p.handle || v_domain;
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        p.handle || v_domain, extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p.name_ar, 'locale', 'ar'),
        now(), now(), '', '', '', ''
      );
      insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      values (
        gen_random_uuid(), v_id,
        jsonb_build_object('sub', v_id::text, 'email', p.handle || v_domain, 'email_verified', true, 'phone_verified', false),
        'email', v_id::text, now(), now(), now()
      );
    end if;
    -- The on_auth_user_created trigger has made the profile; make sure the name is the team label.
    update public.profiles set full_name_ar = p.name_ar where id = v_id and full_name_ar is distinct from p.name_ar;
  end loop;

  select id into v_admin from public.profiles where lower(email) = 'team.admin' || v_domain;

  -- ------------------------------------------------------------------------------------------------ 2. members
  -- Position holders must be active members (committee roles check it), so every role account gets a members row.
  for p in
    select * from (values
      ('team.admin', 'active', false), ('team.leader', 'active', false), ('team.founder', 'active', false),
      ('team.advisor', 'active', false), ('team.head.ai', 'active', false), ('team.deputy.ai', 'active', false),
      ('team.member.ai', 'active', false), ('team.head.cyber', 'active', false),
      ('team.member.cyber', 'active', false), ('team.head.tech', 'active', false),
      ('team.regular.1', 'active', true), ('team.regular.2', 'active', false),
      ('team.suspended', 'suspended', false), ('team.inactive', 'inactive', false)
    ) as t(handle, status, listed)
  loop
    insert into public.members (
      user_id, joined_via, status, status_reason, first_name_ar, last_name_ar, first_name_en, last_name_en,
      academic_status, bio_ar, bio_en, is_directory_visible, show_university, show_track, show_links
    )
    select pr.id, 'manual', p.status,
           case p.status when 'suspended' then 'حساب تجريبي موقوف لاختبار الحالة' end,
           split_part(pr.full_name_ar, ' ', 1), nullif(btrim(substr(pr.full_name_ar, length(split_part(pr.full_name_ar, ' ', 1)) + 1)), ''),
           'Team', replace(p.handle, 'team.', ''),
           case when p.listed then 'student' else 'employee' end,
           case when p.listed then 'عضو تجريبي يظهر في الدليل العام.' end,
           case when p.listed then 'A test member listed in the public directory.' end,
           p.listed, true, true, true
    from public.profiles pr
    where lower(pr.email) = p.handle || v_domain
    on conflict (user_id) do nothing;
  end loop;

  -- ------------------------------------------------------------------------------------------------ 3. roles
  for p in
    select * from (values
      ('team.admin', 'system_admin', null), ('team.leader', 'community_leader', null),
      ('team.founder', 'founder', null), ('team.advisor', 'advisor', null),
      ('team.head.ai', 'committee_head', 'ai'), ('team.deputy.ai', 'committee_deputy', 'ai'),
      ('team.member.ai', 'committee_member', 'ai'), ('team.head.cyber', 'committee_head', 'cybersecurity'),
      ('team.member.cyber', 'committee_member', 'cybersecurity'), ('team.head.tech', 'committee_head', 'tech-development')
    ) as t(handle, role_key, committee_slug)
  loop
    -- One community leader and one head per committee at a time: if a real one is already seated, this is skipped.
    insert into public.role_assignments (user_id, role_key, committee_id, assigned_by)
    select pr.id, p.role_key, (select id from public.committees where slug = p.committee_slug), v_admin
    from public.profiles pr
    where lower(pr.email) = p.handle || v_domain
      and not exists (
        select 1 from public.role_assignments ra
        where ra.user_id = pr.id and ra.role_key = p.role_key and (ra.ends_at is null or ra.ends_at > now()))
    on conflict do nothing;
  end loop;

  -- ------------------------------------------------------------------------------------------------ 4. intake
  -- One open cycle (applications are accepted for 30 more days). If another published cycle already overlaps, the
  -- insert is skipped and the applications below are skipped with it.
  insert into public.membership_cycles (name_ar, name_en, description_ar, description_en, opens_at, closes_at, status, created_by)
  select 'دورة الفريق التجريبية', 'Team test cycle', 'دورة مفتوحة لاختبار التقديم والمراجعة.',
         'An open cycle for testing applying and review.', now() - interval '7 days', now() + interval '30 days',
         'published', v_admin
  where not exists (select 1 from public.membership_cycles where name_ar = 'دورة الفريق التجريبية')
  on conflict do nothing;
  select id into v_cycle from public.membership_cycles where name_ar = 'دورة الفريق التجريبية';

  if v_cycle is not null then
    for p in
      select * from (values
        ('team.applicant.1', 'submitted',    'ai'),
        ('team.applicant.2', 'under_review', 'cybersecurity'),
        ('team.applicant.3', 'waitlisted',   'tech-development'),
        ('team.applicant.4', 'rejected',     'ai')
      ) as t(handle, status, committee_slug)
    loop
      insert into public.membership_applications (
        cycle_id, user_id, status, full_name_ar, full_name_en, phone, academic_status, preferred_committee_id,
        bio_ar, consent_version, reviewer_id, decided_by, decided_at, decision_note
      )
      select v_cycle, pr.id, p.status, pr.full_name_ar, 'Team applicant', '+966500000000', 'student',
             (select id from public.committees where slug = p.committee_slug),
             'طلب تجريبي لاختبار المراجعة.', '2026-1',
             case when p.status <> 'submitted' then v_admin end,
             case when p.status in ('waitlisted', 'rejected') then v_admin end,
             case when p.status in ('waitlisted', 'rejected') then now() - interval '1 day' end,
             case when p.status = 'rejected' then 'قرار تجريبي: لم تكتمل المتطلبات.' end
      from public.profiles pr
      where lower(pr.email) = p.handle || v_domain
      on conflict (cycle_id, user_id) do nothing;
    end loop;
  end if;

  -- ------------------------------------------------------------------------------------------------ 4b. articles
  select id into v_committee from public.committees where slug = 'ai';
  for p in
    select * from (values
      ('team-published-article', 'published',         'مقال منشور للفريق',            'A published team article'),
      ('team-in-review-article', 'in_review',         'مقال قيد المراجعة للفريق',     'A team article in review'),
      ('team-changes-article',   'changes_requested', 'مقال مطلوب تعديله للفريق',      'A team article with changes requested'),
      ('team-draft-article',     'draft',             'مسودة مقال للفريق',            'A team draft article')
    ) as t(slug, status, title_ar, title_en)
  loop
    insert into public.articles (
      slug, committee_id, status, title_ar, title_en, excerpt_ar, excerpt_en, body_ar, body_en, reading_minutes,
      submitted_by, submitted_at, reviewed_by, reviewed_at, review_note, published_at, created_by
    )
    select p.slug, v_committee, p.status, p.title_ar, p.title_en,
           'ملخص تجريبي للمقال.', 'A short test excerpt.',
           'نص تجريبي للمقال يكفي لاختبار الصفحة والقراءة.', 'Test body text, enough to check the page and reading view.',
           2,
           case when p.status <> 'draft' then pr.id end,
           case when p.status <> 'draft' then now() - interval '2 days' end,
           case when p.status in ('published', 'changes_requested') then v_admin end,
           case when p.status in ('published', 'changes_requested') then now() - interval '1 day' end,
           case when p.status = 'changes_requested' then 'يرجى إضافة مثال عملي.' end,
           case when p.status = 'published' then now() - interval '1 day' end,
           pr.id
    from public.profiles pr
    where lower(pr.email) = 'team.member.ai' || v_domain
    on conflict (slug) do nothing;

    insert into public.article_authors (article_id, position, user_id, display_name_ar, display_name_en)
    select a.id, 0, pr.id, pr.full_name_ar, 'Team member'
    from public.articles a, public.profiles pr
    where a.slug = p.slug and lower(pr.email) = 'team.member.ai' || v_domain
    on conflict (article_id, position) do nothing;
  end loop;

  -- ------------------------------------------------------------------------------------------------ 5. registrations
  -- Member-side states on the demo events (they exist after supabase/demo-seed.sql; missing events are skipped).
  for p in
    select * from (values
      ('team.regular.1', 'demo-open',     'accepted'),
      ('team.regular.2', 'demo-open',     'pending'),
      ('team.plain',     'demo-waitlist', 'waitlisted'),
      ('team.regular.1', 'demo-finished', 'accepted')
    ) as t(handle, slug, status)
  loop
    select id into v_ev from public.events where slug = p.slug;
    if v_ev is not null then
      insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot, was_member)
      select v_ev, pr.id, p.status, pr.full_name_ar, pr.email, exists (select 1 from public.members m where m.user_id = pr.id)
      from public.profiles pr
      where lower(pr.email) = p.handle || v_domain
      on conflict (event_id, user_id) do nothing;
    end if;
  end loop;

  raise notice 'Team seed done. Accounts: team.*% (password = the one you set).', v_domain;
end
$seed$;

-- Check what was created (read-only):
-- select p.email, p.full_name_ar, coalesce(string_agg(ra.role_key, ', '), '-') as roles
--   from public.profiles p left join public.role_assignments ra on ra.user_id = p.id and ra.ends_at is null
--  where p.email like 'team.%@example.test' group by p.email, p.full_name_ar order by p.email;
