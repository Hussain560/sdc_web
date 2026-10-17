-- MEM-011 (Sprint 17): the public member views. A field leaves the database only when the member turned it on.
-- With every flag off a listed member shows only the name. E-mail and phone are never in any public view.
-- Columns are appended at the end so the old readers keep working.

-- ------------------------------------------------------------------------------------------ 1. directory
create or replace view public.member_directory as
select
  m.id, m.legacy_id,
  m.first_name_ar as first_name, m.last_name_ar as last_name, m.first_name_en, m.last_name_en,
  case when m.show_university then mj.name_ar end as major,
  case when m.show_university then mj.name_en end as major_en,
  case when m.show_university then sm.name_ar end as sub_major,
  case when m.show_university then sm.name_en end as sub_major_en,
  case when m.show_university then
    case m.academic_status when 'student' then 'طالب' when 'graduate' then 'خريج' when 'employee' then 'موظف' when 'other' then 'أخرى' end
  end as status,
  case when m.show_university then
    case m.academic_status when 'student' then 'Student' when 'graduate' then 'Graduate' when 'employee' then 'Employee' when 'other' then 'Other' end
  end as status_en,
  case when m.show_university then u.name_ar end as university,
  case when m.show_university then u.name_en end as university_en,
  case when m.show_track then t.name_ar end as track,
  case when m.show_track then t.name_en end as track_en,
  case when m.show_about then m.about_ar end as bio,
  case when m.show_about then m.about_en end as bio_en,
  case when m.show_links then m.portfolio_url end as portfolio_url,
  case when m.show_links then m.x_url end as x_url,
  case when m.show_links then m.linkedin_url end as linkedin_url,
  case when m.show_links then m.github_url end as github_url,
  m.joined_at,
  case when m.show_photo then m.photo_path end as photo_path,
  -- appended in Sprint 17
  m.middle_name_ar as middle_name, m.middle_name_en,
  case when m.show_headline then m.headline_ar end as headline,
  case when m.show_headline then m.headline_en end as headline_en,
  case when m.show_skills then
    coalesce((select array_agg(s.slug order by ms.position)
              from public.member_skills ms join public.skills s on s.id = ms.skill_id and s.is_active
              where ms.member_id = m.id), '{}'::text[])
  else '{}'::text[] end as skill_slugs,
  case when m.show_open_to then m.open_to else '{}'::text[] end as open_to,
  case when m.show_links then m.website_url end as website_url,
  case when m.show_links then m.behance_url end as behance_url,
  case when m.show_links then m.dribbble_url end as dribbble_url,
  case when m.show_links then m.youtube_url end as youtube_url,
  -- Q-M4: current committee positions of a listed member (committee roles only).
  coalesce((select array_agg(distinct c.slug)
            from public.role_assignments ra
            join public.roles r on r.key = ra.role_key and r.scope = 'committee'
            join public.committees c on c.id = ra.committee_id and c.status = 'active'
            where ra.user_id = m.user_id and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())),
           '{}'::text[]) as committee_slugs,
  coalesce((select jsonb_agg(jsonb_build_object(
                     'slug', c.slug, 'name_ar', c.name_ar, 'name_en', coalesce(c.name_en, c.name_ar),
                     'role_key', ra.role_key, 'role_ar', r.name_ar, 'role_en', r.name_en, 'since', ra.starts_at)
                   order by r.display_order, c.display_order)
            from public.role_assignments ra
            join public.roles r on r.key = ra.role_key and r.scope = 'committee'
            join public.committees c on c.id = ra.committee_id and c.status = 'active'
            where ra.user_id = m.user_id and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())),
           '[]'::jsonb) as committees
from public.members m
left join public.majors mj on mj.id = m.major_id
left join public.majors sm on sm.id = m.sub_major_id
left join public.universities u on u.id = m.university_id
left join public.tracks t on t.id = m.track_id
where m.status = 'active' and m.is_directory_visible;
comment on view public.member_directory is 'Public directory (ME-1): active + visible members; each field only when its flag is on.';

-- ------------------------------------------------------------------------------------------ 2. skills and projects
create view public.member_public_skills as
select m.id as member_id, s.slug, s.name_ar, s.name_en, s.category, ms.position
from public.members m
join public.member_skills ms on ms.member_id = m.id
join public.skills s on s.id = ms.skill_id and s.is_active
where m.status = 'active' and m.is_directory_visible and m.show_skills;
revoke all on public.member_public_skills from anon, authenticated;
grant select on public.member_public_skills to anon, authenticated;
comment on view public.member_public_skills is 'Skills of listed members who chose to show them (Sprint 17).';

create view public.member_public_projects as
select m.id as member_id, p.id as project_id, p.position, p.title_ar, p.title_en, p.description_ar, p.description_en,
       p.url, p.cover_path
from public.members m
join public.member_projects p on p.member_id = m.id
where m.status = 'active' and m.is_directory_visible and m.show_projects;
revoke all on public.member_public_projects from anon, authenticated;
grant select on public.member_public_projects to anon, authenticated;
comment on view public.member_public_projects is 'Projects of listed members who chose to show them (Sprint 17).';

-- ------------------------------------------------------------------------------------------ 3. events a member took part in (Q-M3)
-- Opt-in (show_participation). Presenters, mentors, judges and hosts count as "presenter"; a registration whose
-- attendance was finalised as attended counts as "attended".
create view public.member_public_participation as
select m.id as member_id, pe.id as event_id, pe.slug, pe.title_ar, pe.title_en, pe.start_date,
       pe.location_ar, pe.location_en, 'presenter'::text as role
from public.members m
join public.event_presenters p on p.profile_id = m.user_id
join public.public_events pe on pe.id = p.event_id and pe.status <> 'cancelled'
where m.status = 'active' and m.is_directory_visible and m.show_participation and m.user_id is not null
union all
select m.id, pe.id, pe.slug, pe.title_ar, pe.title_en, pe.start_date, pe.location_ar, pe.location_en, 'attended'::text
from public.members m
join public.event_registrations r on r.user_id = m.user_id and r.attendance_result = 'attended'
join public.public_events pe on pe.id = r.event_id and pe.status <> 'cancelled'
where m.status = 'active' and m.is_directory_visible and m.show_participation and m.user_id is not null;
revoke all on public.member_public_participation from anon, authenticated;
grant select on public.member_public_participation to anon, authenticated;
comment on view public.member_public_participation is 'Events a listed member took part in, only with their opt-in (Q-M3).';

-- ------------------------------------------------------------------------------------------ 4. leadership photo and link
-- A leadership card shows a photo only for a person who is listed and turned the photo on; the member id is exposed
-- only for listed members (so the card can link to the profile). Columns appended at the end.
create or replace view public.current_positions as
select
  ra.id                       as assignment_id,
  ra.role_key,
  r.name_ar                   as role_name_ar,
  r.name_en                   as role_name_en,
  r.display_order             as role_order,
  ra.display_title_ar,
  ra.display_title_en,
  ra.public_bio_ar,
  ra.public_bio_en,
  ra.public_tags_ar,
  ra.public_tags_en,
  c.id                        as committee_id,
  c.slug                      as committee_slug,
  c.name_ar                   as committee_name_ar,
  c.name_en                   as committee_name_en,
  c.display_order             as committee_order,
  p.full_name_ar              as person_name_ar,
  coalesce(p.full_name_en, p.full_name_ar) as person_name_en,
  ra.starts_at,
  ra.ends_at,
  lm.id                       as member_id,
  case when lm.show_photo then lm.photo_path end as member_photo_path
from public.role_assignments ra
join public.roles r on r.key = ra.role_key and r.is_public_position
join public.profiles p on p.id = ra.user_id
left join public.committees c on c.id = ra.committee_id
left join public.members lm on lm.user_id = ra.user_id and lm.status = 'active' and lm.is_directory_visible
where ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now());
