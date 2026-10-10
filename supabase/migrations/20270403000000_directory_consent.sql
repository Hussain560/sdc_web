-- RDS-020: per-field consent for the public directory. A listed member chooses what the public card shows.
-- Defaults keep today's behaviour for people already listed (they were shown university, track and links under the
-- single listing flag); the photo and participation are new and start OFF (Q-M1, Q-M2, Q-M3 defaults).
alter table public.members
  add column show_university    boolean not null default true,
  add column show_track         boolean not null default true,
  add column show_links         boolean not null default true,
  add column show_photo         boolean not null default false,
  add column show_participation boolean not null default false,
  add column photo_path         text;

-- Same columns as before (so the old pages keep working), each one hidden when its flag is off; photo_path is new.
create or replace view public.member_directory as
select
  m.id, m.legacy_id,
  m.first_name_ar as first_name, m.last_name_ar as last_name, m.first_name_en, m.last_name_en,
  mj.name_ar as major, mj.name_en as major_en,
  sm.name_ar as sub_major, sm.name_en as sub_major_en,
  case m.academic_status when 'student' then 'طالب' when 'graduate' then 'خريج' when 'employee' then 'موظف' when 'other' then 'أخرى' end as status,
  case m.academic_status when 'student' then 'Student' when 'graduate' then 'Graduate' when 'employee' then 'Employee' when 'other' then 'Other' end as status_en,
  case when m.show_university then u.name_ar end as university,
  case when m.show_university then u.name_en end as university_en,
  case when m.show_track then t.name_ar end as track,
  case when m.show_track then t.name_en end as track_en,
  m.bio_ar as bio, m.bio_en,
  case when m.show_links then m.portfolio_url end as portfolio_url,
  case when m.show_links then m.x_url end as x_url,
  case when m.show_links then m.linkedin_url end as linkedin_url,
  case when m.show_links then m.github_url end as github_url,
  m.joined_at,
  case when m.show_photo then m.photo_path end as photo_path
from public.members m
left join public.majors mj on mj.id = m.major_id
left join public.majors sm on sm.id = m.sub_major_id
left join public.universities u on u.id = m.university_id
left join public.tracks t on t.id = m.track_id
where m.status = 'active' and m.is_directory_visible;

-- Articles a listed member wrote, ids only (the article itself is already public).
create view public.member_public_articles as
select m.id as member_id, aa.article_id
from public.members m
join public.article_authors aa on aa.user_id = m.user_id
join public.articles a on a.id = aa.article_id and a.status = 'published'
where m.status = 'active' and m.is_directory_visible and m.user_id is not null;
grant select on public.member_public_articles to anon, authenticated;
comment on view public.member_public_articles is 'Published articles of listed members (ids only). RDS-020.';
