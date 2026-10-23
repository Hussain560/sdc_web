-- Sprint 18 · gender and study year.
-- gender (male | female) is collected on the application, copied to the member, never shown publicly, visible to the
-- member and to leadership (members.view_contact), and editable by leadership only (members.manage). The study year
-- (1-7, students only) is academic data the member may also edit. Both are validated by the database.

alter table public.membership_applications
  add column if not exists gender text check (gender in ('male', 'female')),
  add column if not exists study_year smallint check (study_year between 1 and 7);
alter table public.members
  add column if not exists gender text check (gender in ('male', 'female')),
  add column if not exists study_year smallint check (study_year between 1 and 7);

CREATE OR REPLACE FUNCTION private.validate_application(p jsonb, p_questions jsonb)
 RETURNS void
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  q jsonb;
  a jsonb;
  k text;
  ans jsonb := coalesce(p -> 'answers', '{}'::jsonb);
begin
  if p ? 'first_name_ar' then
    -- v2 form: first and last name in both languages (middle optional), phone required.
    if char_length(btrim(coalesce(p ->> 'first_name_ar', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'last_name_ar', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'first_name_en', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'last_name_en', ''))) not between 1 and 100
       or char_length(coalesce(p ->> 'middle_name_ar', '')) > 100
       or char_length(coalesce(p ->> 'middle_name_en', '')) > 100
       or coalesce(p ->> 'phone', '') !~ '^\+?[0-9]{8,15}$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  elsif char_length(btrim(coalesce(p ->> 'full_name_ar', ''))) not between 3 and 100 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if coalesce(p ->> 'academic_status', '') not in ('student', 'graduate', 'employee', 'other')
     or jsonb_typeof(ans) <> 'object' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if nullif(p ->> 'gender', '') is not null and (p ->> 'gender') not in ('male', 'female') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if nullif(p ->> 'study_year', '') is not null
     and (p ->> 'academic_status' <> 'student' or (p ->> 'study_year') !~ '^[1-7]$') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    k := q ->> 'key';
    a := ans -> k;
    if coalesce((q ->> 'required')::boolean, false)
       and (a is null or a = 'null'::jsonb or btrim(a #>> '{}') = '' and jsonb_typeof(a) = 'string'
            or jsonb_typeof(a) = 'array' and jsonb_array_length(a) = 0) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if a is not null and jsonb_typeof(a) = 'string' and char_length(a #>> '{}') > 2000 then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.apply_for_membership(p_cycle uuid, p jsonb, p_ip_hash text DEFAULT NULL::text, p_honeypot text DEFAULT NULL::text, p_elapsed_ms integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.membership_cycles;
  mail text := lower(btrim(coalesce(p ->> 'email', '')));
  mail_hash text;
  v_id uuid;
  v_ref text;
  v_token text := private.new_token();
  loc text := case when p ->> 'lang' = 'en' then 'en' else 'ar' end;
  v2 boolean := p ? 'first_name_ar';
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
      cycle_id, user_id, email, locale, full_name_ar, full_name_en,
      first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en,
      phone, academic_status, university_id, major_id,
      sub_major_id, track_id, preferred_committee_id, bio_ar, bio_en, portfolio_url, github_url, linkedin_url, x_url,
      answers, wants_directory_listing, consent_version, tracking_token_hash, gender, study_year
    ) values (
      c.id, null, mail, loc,
      case when v2 then 'x x' else btrim(p ->> 'full_name_ar') end,
      case when v2 then null else nullif(btrim(p ->> 'full_name_en'), '') end,
      case when v2 then btrim(p ->> 'first_name_ar') end, case when v2 then nullif(btrim(p ->> 'middle_name_ar'), '') end,
      case when v2 then btrim(p ->> 'last_name_ar') end,
      case when v2 then btrim(p ->> 'first_name_en') end, case when v2 then nullif(btrim(p ->> 'middle_name_en'), '') end,
      case when v2 then btrim(p ->> 'last_name_en') end,
      nullif(p ->> 'phone', ''),
      p ->> 'academic_status', nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint,
      nullif(p ->> 'sub_major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint,
      nullif(p ->> 'preferred_committee_id', '')::uuid, nullif(p ->> 'bio_ar', ''), nullif(p ->> 'bio_en', ''),
      nullif(p ->> 'portfolio_url', ''), nullif(p ->> 'github_url', ''), nullif(p ->> 'linkedin_url', ''),
      nullif(p ->> 'x_url', ''), coalesce(p -> 'answers', '{}'::jsonb),
      coalesce((p ->> 'wants_directory_listing')::boolean, false), p ->> 'consent_version',
      private.token_hash(v_token), nullif(p ->> 'gender', ''), nullif(p ->> 'study_year', '')::smallint
    ) returning id, reference into v_id, v_ref;
  exception
    when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
      return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
    when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'ALREADY_APPLIED');
  end;

  perform private.add_application_event(v_id, 'submitted');
  perform private.write_audit('membership_application.submitted', 'membership_application', v_id::text, null,
    jsonb_build_object('cycle_id', c.id, 'guest', true));
  return jsonb_build_object('ok', true, 'id', v_id, 'reference', v_ref, 'token', v_token);
end;
$function$;

CREATE OR REPLACE FUNCTION private.accept_application(a membership_applications, p_actor uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      portfolio_url, github_url, linkedin_url, x_url, is_directory_visible, term_starts_at, term_ends_at, gender, study_year
    ) values (
      a.user_id, 'active', 'application', a.cycle_id, a.id,
      coalesce(a.first_name_ar, split_part(btrim(a.full_name_ar), ' ', 1)),
      a.middle_name_ar,
      coalesce(a.last_name_ar, btrim(substr(btrim(a.full_name_ar), length(split_part(btrim(a.full_name_ar), ' ', 1)) + 1))),
      coalesce(a.first_name_en, nullif(btrim(a.full_name_en), '')), a.middle_name_en, a.last_name_en,
      case when a.phone ~ '^\+[1-9][0-9]{6,14}$' then a.phone end,
      a.academic_status, a.university_id, a.major_id, a.sub_major_id, a.track_id, a.bio_ar, a.bio_en,
      a.portfolio_url, a.github_url, a.linkedin_url, a.x_url, a.wants_directory_listing, today, v_end, a.gender, a.study_year
    ) returning id into v_member;
  end if;
  perform private.add_member_event(v_member, 'joined', jsonb_build_object('application', a.id, 'cycle', a.cycle_id));
  return jsonb_build_object('member', v_member, 'reused', existing.id is not null,
                            'prior_status', existing.status, 'prior_end_reason', existing.end_reason);
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_member(p_id uuid, p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid := (select auth.uid());
  m public.members;
  link_keys constant text[] := array['portfolio_url', 'github_url', 'linkedin_url', 'x_url', 'website_url',
                                     'behance_url', 'dribbble_url', 'youtube_url'];
  open_values text[];
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into m from public.members where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  -- The phone is contact data: changing it needs the same permission as seeing it.
  if p ? 'phone' and not private.has_permission('members.view_contact') then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p ? 'first_name_ar' and nullif(btrim(p ->> 'first_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p ? 'last_name_ar' and nullif(btrim(p ->> 'last_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p ? 'open_to' then
    open_values := array(select jsonb_array_elements_text(p -> 'open_to'));
  end if;

  update public.members set
    first_name_ar  = case when p ? 'first_name_ar'  then btrim(p ->> 'first_name_ar') else first_name_ar end,
    middle_name_ar = case when p ? 'middle_name_ar' then nullif(btrim(p ->> 'middle_name_ar'), '') else middle_name_ar end,
    last_name_ar   = case when p ? 'last_name_ar'   then btrim(p ->> 'last_name_ar') else last_name_ar end,
    first_name_en  = case when p ? 'first_name_en'  then nullif(btrim(p ->> 'first_name_en'), '') else first_name_en end,
    middle_name_en = case when p ? 'middle_name_en' then nullif(btrim(p ->> 'middle_name_en'), '') else middle_name_en end,
    last_name_en   = case when p ? 'last_name_en'   then nullif(btrim(p ->> 'last_name_en'), '') else last_name_en end,
    phone          = case when p ? 'phone'          then nullif(btrim(p ->> 'phone'), '') else phone end,
    academic_status = case when p ? 'academic_status' then nullif(p ->> 'academic_status', '') else academic_status end,
    university_id  = case when p ? 'university_id'  then nullif(p ->> 'university_id', '')::smallint else university_id end,
    major_id       = case when p ? 'major_id'       then nullif(p ->> 'major_id', '')::smallint else major_id end,
    sub_major_id   = case when p ? 'sub_major_id'   then nullif(p ->> 'sub_major_id', '')::smallint else sub_major_id end,
    track_id       = case when p ? 'track_id'       then nullif(p ->> 'track_id', '')::smallint else track_id end,
    gender         = case when p ? 'gender'         then nullif(p ->> 'gender', '') else gender end,
    study_year     = case when p ? 'study_year'     then nullif(p ->> 'study_year', '')::smallint else study_year end,
    headline_ar    = case when p ? 'headline_ar'    then nullif(btrim(p ->> 'headline_ar'), '') else headline_ar end,
    headline_en    = case when p ? 'headline_en'    then nullif(btrim(p ->> 'headline_en'), '') else headline_en end,
    about_ar       = case when p ? 'about_ar'       then nullif(btrim(p ->> 'about_ar'), '') else about_ar end,
    about_en       = case when p ? 'about_en'       then nullif(btrim(p ->> 'about_en'), '') else about_en end,
    open_to        = case when p ? 'open_to'        then open_values else open_to end,
    portfolio_url  = case when p ? 'portfolio_url'  then nullif(btrim(p ->> 'portfolio_url'), '') else portfolio_url end,
    github_url     = case when p ? 'github_url'     then nullif(btrim(p ->> 'github_url'), '') else github_url end,
    linkedin_url   = case when p ? 'linkedin_url'   then nullif(btrim(p ->> 'linkedin_url'), '') else linkedin_url end,
    x_url          = case when p ? 'x_url'          then nullif(btrim(p ->> 'x_url'), '') else x_url end,
    website_url    = case when p ? 'website_url'    then nullif(btrim(p ->> 'website_url'), '') else website_url end,
    behance_url    = case when p ? 'behance_url'    then nullif(btrim(p ->> 'behance_url'), '') else behance_url end,
    dribbble_url   = case when p ? 'dribbble_url'   then nullif(btrim(p ->> 'dribbble_url'), '') else dribbble_url end,
    youtube_url    = case when p ? 'youtube_url'    then nullif(btrim(p ->> 'youtube_url'), '') else youtube_url end
  where id = m.id;

  if p ?| link_keys then
    update public.members set show_links = (
      portfolio_url is not null or github_url is not null or linkedin_url is not null or x_url is not null or
      website_url is not null or behance_url is not null or dribbble_url is not null or youtube_url is not null)
    where id = m.id;
  end if;

  perform private.write_audit('member.updated_by_staff', 'member', m.id::text, null,
    jsonb_build_object('fields', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_my_member_profile(p jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid := (select auth.uid());
  m public.members;
  link_keys constant text[] := array['portfolio_url', 'github_url', 'linkedin_url', 'x_url', 'website_url',
                                     'behance_url', 'dribbble_url', 'youtube_url'];
  open_values text[];
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;

  -- Names are the identity recorded when the membership was accepted. Leadership (members.edit_own_name: system
  -- administrator, community leader and founders) may correct their own; everyone else is refused with NAME_LOCKED,
  -- never silently ignored.
  if p ?| array['first_name_ar', 'middle_name_ar', 'last_name_ar', 'first_name_en', 'middle_name_en', 'last_name_en']
     and not private.has_permission('members.edit_own_name') then
    raise exception 'NAME_LOCKED' using errcode = 'P0001';
  end if;
  if p ? 'first_name_ar' and nullif(btrim(p ->> 'first_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p ? 'last_name_ar' and nullif(btrim(p ->> 'last_name_ar'), '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  if p ? 'gender' then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p ? 'open_to' then
    open_values := array(select jsonb_array_elements_text(p -> 'open_to'));
  end if;

  update public.members set
    first_name_ar  = case when p ? 'first_name_ar'  then btrim(p ->> 'first_name_ar') else first_name_ar end,
    middle_name_ar = case when p ? 'middle_name_ar' then nullif(btrim(p ->> 'middle_name_ar'), '') else middle_name_ar end,
    last_name_ar   = case when p ? 'last_name_ar'   then btrim(p ->> 'last_name_ar') else last_name_ar end,
    first_name_en  = case when p ? 'first_name_en'  then nullif(btrim(p ->> 'first_name_en'), '') else first_name_en end,
    middle_name_en = case when p ? 'middle_name_en' then nullif(btrim(p ->> 'middle_name_en'), '') else middle_name_en end,
    last_name_en   = case when p ? 'last_name_en'   then nullif(btrim(p ->> 'last_name_en'), '') else last_name_en end,
    headline_ar    = case when p ? 'headline_ar'    then nullif(btrim(p ->> 'headline_ar'), '') else headline_ar end,
    headline_en    = case when p ? 'headline_en'    then nullif(btrim(p ->> 'headline_en'), '') else headline_en end,
    about_ar       = case when p ? 'about_ar'       then nullif(btrim(p ->> 'about_ar'), '') else about_ar end,
    about_en       = case when p ? 'about_en'       then nullif(btrim(p ->> 'about_en'), '') else about_en end,
    open_to        = case when p ? 'open_to'        then open_values else open_to end,
    phone          = case when p ? 'phone'          then nullif(btrim(p ->> 'phone'), '') else phone end,
    academic_status = case when p ? 'academic_status' then nullif(p ->> 'academic_status', '') else academic_status end,
    university_id  = case when p ? 'university_id'  then nullif(p ->> 'university_id', '')::smallint else university_id end,
    major_id       = case when p ? 'major_id'       then nullif(p ->> 'major_id', '')::smallint else major_id end,
    sub_major_id   = case when p ? 'sub_major_id'   then nullif(p ->> 'sub_major_id', '')::smallint else sub_major_id end,
    track_id       = case when p ? 'track_id'       then nullif(p ->> 'track_id', '')::smallint else track_id end,
    study_year     = case when p ? 'study_year'     then nullif(p ->> 'study_year', '')::smallint else study_year end,
    portfolio_url  = case when p ? 'portfolio_url'  then nullif(btrim(p ->> 'portfolio_url'), '') else portfolio_url end,
    github_url     = case when p ? 'github_url'     then nullif(btrim(p ->> 'github_url'), '') else github_url end,
    linkedin_url   = case when p ? 'linkedin_url'   then nullif(btrim(p ->> 'linkedin_url'), '') else linkedin_url end,
    x_url          = case when p ? 'x_url'          then nullif(btrim(p ->> 'x_url'), '') else x_url end,
    website_url    = case when p ? 'website_url'    then nullif(btrim(p ->> 'website_url'), '') else website_url end,
    behance_url    = case when p ? 'behance_url'    then nullif(btrim(p ->> 'behance_url'), '') else behance_url end,
    dribbble_url   = case when p ? 'dribbble_url'   then nullif(btrim(p ->> 'dribbble_url'), '') else dribbble_url end,
    youtube_url    = case when p ? 'youtube_url'    then nullif(btrim(p ->> 'youtube_url'), '') else youtube_url end,
    is_directory_visible = case when p ? 'is_directory_visible' then (p ->> 'is_directory_visible')::boolean else is_directory_visible end,
    show_university = case when p ? 'show_university' then (p ->> 'show_university')::boolean else show_university end,
    show_track     = case when p ? 'show_track'     then (p ->> 'show_track')::boolean else show_track end,
    show_photo     = case when p ? 'show_photo'     then (p ->> 'show_photo')::boolean else show_photo end,
    show_participation = case when p ? 'show_participation' then (p ->> 'show_participation')::boolean else show_participation end,
    show_headline  = case when p ? 'show_headline'  then (p ->> 'show_headline')::boolean else show_headline end,
    show_about     = case when p ? 'show_about'     then (p ->> 'show_about')::boolean else show_about end,
    show_skills    = case when p ? 'show_skills'    then (p ->> 'show_skills')::boolean else show_skills end,
    show_projects  = case when p ? 'show_projects'  then (p ->> 'show_projects')::boolean else show_projects end,
    show_open_to   = case when p ? 'show_open_to'   then (p ->> 'show_open_to')::boolean else show_open_to end
  where id = m.id;

  -- Q (links): filling a link is the consent to show it (the design has no separate links switch).
  if p ?| link_keys then
    update public.members set show_links = (
      portfolio_url is not null or github_url is not null or linkedin_url is not null or x_url is not null or
      website_url is not null or behance_url is not null or dribbble_url is not null or youtube_url is not null)
    where id = m.id;
  end if;

  perform private.write_audit('member.profile_updated', 'member', m.id::text, null,
    jsonb_build_object('fields', (select coalesce(jsonb_agg(k), '[]'::jsonb) from jsonb_object_keys(p) k)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_member_detail(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller uuid := (select auth.uid());
  can_contact boolean;
  m public.members;
  pr public.profiles;
  au auth.users;
  result jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not (private.has_permission('members.view') or private.has_permission('members.manage')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  can_contact := private.has_permission('members.view_contact');
  select * into m from public.members where id = p_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if m.user_id is not null then
    select * into pr from public.profiles where id = m.user_id;
    select * into au from auth.users where id = m.user_id;
  end if;

  select jsonb_build_object(
    'member', jsonb_build_object(
      'id', m.id, 'status', m.status, 'joined_at', m.joined_at,
      'member_no', 'SDC-M-' || lpad(m.member_no::text, 6, '0'),
      'term_starts_at', m.term_starts_at, 'term_ends_at', m.term_ends_at, 'end_reason', m.end_reason,
      'suspension_category', m.suspension_category, 'suspended_until', m.suspended_until, 'leaves_on', m.leaves_on,
      'ended_at', m.ended_at, 'activated_at', m.activated_at, 'onboarded_at', m.onboarded_at,
      'renewal_requested_at', m.renewal_requested_at, 'card_active', m.card_token is not null,
      'joined_via', m.joined_via, 'legacy', m.legacy_id is not null,
      'listed', m.is_directory_visible and m.status = 'active',
      'first_name_ar', m.first_name_ar, 'middle_name_ar', m.middle_name_ar, 'last_name_ar', m.last_name_ar,
      'first_name_en', m.first_name_en, 'middle_name_en', m.middle_name_en, 'last_name_en', m.last_name_en,
      'academic_status', m.academic_status,
      'university_ar', (select name_ar from public.universities where id = m.university_id),
      'university_en', (select name_en from public.universities where id = m.university_id),
      'major_ar', (select name_ar from public.majors where id = m.major_id),
      'major_en', (select name_en from public.majors where id = m.major_id),
      'track_ar', (select name_ar from public.tracks where id = m.track_id),
      'track_en', (select name_en from public.tracks where id = m.track_id),
      'headline_ar', m.headline_ar, 'headline_en', m.headline_en, 'about_ar', m.about_ar, 'about_en', m.about_en,
      'open_to', m.open_to, 'photo_path', m.photo_path,
      'gender', case when private.has_permission('members.view_contact') then m.gender end,
      'study_year', m.study_year,
      'links', jsonb_build_object('portfolio', m.portfolio_url, 'github', m.github_url, 'linkedin', m.linkedin_url,
                                  'x', m.x_url, 'website', m.website_url, 'behance', m.behance_url,
                                  'dribbble', m.dribbble_url, 'youtube', m.youtube_url),
      'show', jsonb_build_object('photo', m.show_photo, 'headline', m.show_headline, 'about', m.show_about,
                                 'skills', m.show_skills, 'projects', m.show_projects, 'open_to', m.show_open_to,
                                 'university', m.show_university, 'track', m.show_track, 'links', m.show_links,
                                 'participation', m.show_participation),
      'cycle_name_ar', (select c.name_ar from public.membership_cycles c where c.id = m.joined_cycle_id)),
    'account', case when m.user_id is null then null else jsonb_build_object(
      'user_id', m.user_id,
      'email', case when can_contact then pr.email end,
      'phone', case when can_contact then m.phone end,
      'activated', (m.activated_at is not null or au.last_sign_in_at is not null),
      'blocked', pr.blocked_at is not null,
      'blocked_at', pr.blocked_at,
      'created_at', au.created_at,
      'last_sign_in_at', case when can_contact then au.last_sign_in_at end) end,
    'completeness', private.member_completeness(m),
    'can_contact', can_contact,
    'leave_request', (select jsonb_build_object('id', r.id, 'created_at', r.created_at, 'reason', r.reason, 'preferred_last_day', r.preferred_last_day)
                        from public.member_leave_requests r where r.member_id = m.id and r.status = 'pending'),
    'skills', coalesce((select jsonb_agg(jsonb_build_object('slug', s.slug, 'name_ar', s.name_ar, 'name_en', s.name_en,
                                                           'category', s.category) order by ms.position)
                        from public.member_skills ms join public.skills s on s.id = ms.skill_id
                        where ms.member_id = m.id), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'title_ar', p.title_ar, 'title_en', p.title_en,
                                                             'url', p.url) order by p.position)
                          from public.member_projects p where p.member_id = m.id), '[]'::jsonb),
    'positions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ra.id, 'role_key', ra.role_key, 'role_ar', r.name_ar, 'role_en', r.name_en,
        'committee_slug', c.slug, 'committee_ar', c.name_ar, 'committee_en', coalesce(c.name_en, c.name_ar),
        'starts_at', ra.starts_at, 'ends_at', ra.ends_at, 'end_reason', ra.end_reason,
        'active', ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now()),
        'assigned_by_ar', (select full_name_ar from public.profiles x where x.id = ra.assigned_by)
      ) order by ra.starts_at desc)
      from public.role_assignments ra
      join public.roles r on r.key = ra.role_key
      left join public.committees c on c.id = ra.committee_id
      where ra.user_id = m.user_id), '[]'::jsonb),
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object('id', er.id, 'event_slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en,
                                          'start_date', e.start_date, 'status', er.status,
                                          'attendance', er.attendance_result) order by e.start_date desc)
      from (select * from public.event_registrations where user_id = m.user_id order by created_at desc limit 50) er
      join public.events e on e.id = er.event_id), '[]'::jsonb),
    'applications', coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'reference', a.reference, 'cycle_ar', c.name_ar, 'cycle_en', c.name_en, 'status', a.status,
                                          'submitted_at', a.submitted_at, 'decided_at', a.decided_at,
                                          'score_average', (select s.average from private.application_score(a.id) s)) order by a.created_at desc)
      from public.membership_applications a join public.membership_cycles c on c.id = a.cycle_id
      where a.user_id = m.user_id or a.id = m.application_id), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'at', e.created_at, 'kind', e.kind, 'data', e.data,
                                          'actor_ar', (select full_name_ar from public.profiles x where x.id = e.actor_id)) order by e.created_at desc, e.id desc)
      from (select * from public.member_events where member_id = m.id order by created_at desc, id desc limit 200) e), '[]'::jsonb),
    'log', coalesce((
      select jsonb_agg(jsonb_build_object('at', l.occurred_at, 'action', l.action,
                                          'actor_ar', (select full_name_ar from public.profiles x where x.id = l.actor_id)) order by l.occurred_at desc)
      from (select * from public.audit_logs
            where (entity_type = 'member' and entity_id = m.id::text)
               or (m.user_id is not null and entity_type = 'role_assignment' and (summary ->> 'user_id') = m.user_id::text)
            order by occurred_at desc limit 50) l), '[]'::jsonb)
  ) into result;
  return result;
end;
$function$;

create or replace view public.membership_review_queue as
SELECT id,
    cycle_id,
    user_id,
    status,
    full_name_ar,
    full_name_en,
    academic_status,
    university_id,
    major_id,
    track_id,
    preferred_committee_id,
    submitted_at,
    decided_at,
    reviewer_id,
    decision_note,
    wants_directory_listing,
    email,
    reference,
    first_name_ar,
    middle_name_ar,
    last_name_ar,
    first_name_en,
    middle_name_en,
    last_name_en,
    phone,
    locale,
    resubmitted_at,
    info_requested_at,
    info_request,
    accepted_at,
    lapsed_at,
    ( SELECT s.average
           FROM private.application_score_visible(a.id) s(average, reviewers)) AS score_average,
    COALESCE(( SELECT s.reviewers
           FROM private.application_score_visible(a.id) s(average, reviewers)), 0) AS score_reviewers,
    ( SELECT p.full_name_ar
           FROM profiles p
          WHERE (p.id = a.reviewer_id)) AS reviewer_name,
    (( SELECT count(*) AS count
           FROM membership_applications o
          WHERE ((lower(o.email) = lower(a.email)) AND (o.id <> a.id))))::integer AS earlier_count,
    (( SELECT count(*) AS count
           FROM membership_applications o
          WHERE ((lower(o.email) = lower(a.email)) AND (o.id <> a.id) AND (o.status = 'rejected'::text))))::integer AS earlier_rejected,
    (EXISTS ( SELECT 1
           FROM (members m
             JOIN profiles pr ON ((pr.id = m.user_id)))
          WHERE ((lower(pr.email) = lower(a.email)) AND (m.status = ANY (ARRAY['active'::text, 'suspended'::text, 'expired'::text]))))) AS is_member,
    (EXISTS ( SELECT 1
           FROM profiles pr
          WHERE ((lower(pr.email) = lower(a.email)) AND (pr.blocked_at IS NOT NULL)))) AS is_blocked,
    sub_major_id,
    portfolio_url,
    github_url,
    linkedin_url,
    x_url,
    bio_ar,
    bio_en,
    answers,
    consent_version,
    consent_at,
    info_fields,
    gender,
    study_year
   FROM membership_applications a
  WHERE private.has_permission('membership.review'::text);
