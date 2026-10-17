-- MEM-011 (Sprint 17): the member profile becomes a real profile. Expand only: nothing is dropped or renamed.
-- New private data (phone) never reaches a public view. New public blocks start hidden (Q-M5); the about text that
-- listed members already had keeps showing (the single listing flag was their consent for it).

-- ------------------------------------------------------------------------------------------ 1. columns on members
alter table public.members
  add column middle_name_ar text check (char_length(middle_name_ar) <= 100),
  add column middle_name_en text check (char_length(middle_name_en) <= 100),
  add column headline_ar    text check (char_length(headline_ar) <= 120),
  add column headline_en    text check (char_length(headline_en) <= 120),
  add column about_ar       text check (char_length(about_ar) <= 2000),
  add column about_en       text check (char_length(about_en) <= 2000),
  add column open_to        text[] not null default '{}'
    check (open_to <@ array['internship', 'job', 'freelance', 'mentoring', 'speaking', 'collaboration']::text[]),
  add column website_url    text check (website_url ~ '^https://' and char_length(website_url) <= 500),
  add column behance_url    text check (behance_url ~ '^https://' and char_length(behance_url) <= 500),
  add column dribbble_url   text check (dribbble_url ~ '^https://' and char_length(dribbble_url) <= 500),
  add column youtube_url    text check (youtube_url ~ '^https://' and char_length(youtube_url) <= 500),
  add column phone          text check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  add column show_headline  boolean not null default false,
  add column show_about     boolean not null default false,
  add column show_skills    boolean not null default false,
  add column show_projects  boolean not null default false,
  add column show_open_to   boolean not null default false;

comment on column public.members.phone is 'PRIVATE. Leadership only (members.view_contact). Never part of a public view.';
comment on column public.members.about_ar is 'Public about text (replaces bio_ar, which stays for one release).';

-- The old bio becomes the about text. Members who were listed keep showing it.
update public.members set about_ar = bio_ar, about_en = bio_en where bio_ar is not null or bio_en is not null;
update public.members set show_about = true
where is_directory_visible and (about_ar is not null or about_en is not null);

-- ------------------------------------------------------------------------------------------ 2. skills (curated list)
create table public.skills (
  id            smallint generated always as identity primary key,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,48}$'),
  name_ar       text not null check (char_length(btrim(name_ar)) between 1 and 80),
  name_en       text not null check (char_length(btrim(name_en)) between 1 and 80),
  category      text not null check (category in ('web', 'ai_data', 'security', 'mobile', 'design', 'cloud', 'games', 'other')),
  is_active     boolean not null default true,
  display_order smallint not null default 100
);
comment on table public.skills is 'Curated skill list members pick from (Q-M6). Suggestions go to the administrators.';

insert into public.skills (slug, name_ar, name_en, category, display_order) values
  ('html-css', 'HTML وCSS', 'HTML and CSS', 'web', 10),
  ('javascript', 'JavaScript', 'JavaScript', 'web', 20),
  ('typescript', 'TypeScript', 'TypeScript', 'web', 30),
  ('react', 'React', 'React', 'web', 40),
  ('nextjs', 'Next.js', 'Next.js', 'web', 50),
  ('vue', 'Vue', 'Vue', 'web', 60),
  ('angular', 'Angular', 'Angular', 'web', 70),
  ('tailwind', 'Tailwind CSS', 'Tailwind CSS', 'web', 80),
  ('nodejs', 'Node.js', 'Node.js', 'web', 90),
  ('graphql', 'GraphQL', 'GraphQL', 'web', 100),
  ('php', 'PHP', 'PHP', 'web', 110),
  ('python', 'Python', 'Python', 'ai_data', 10),
  ('sql', 'SQL', 'SQL', 'ai_data', 20),
  ('postgresql', 'PostgreSQL', 'PostgreSQL', 'ai_data', 30),
  ('machine-learning', 'تعلّم الآلة', 'Machine learning', 'ai_data', 40),
  ('pytorch', 'PyTorch', 'PyTorch', 'ai_data', 50),
  ('tensorflow', 'TensorFlow', 'TensorFlow', 'ai_data', 60),
  ('llms', 'نماذج اللغة', 'LLMs', 'ai_data', 70),
  ('data-analysis', 'تحليل البيانات', 'Data analysis', 'ai_data', 80),
  ('data-viz', 'عرض البيانات', 'Data visualization', 'ai_data', 90),
  ('penetration-testing', 'اختبار الاختراق', 'Penetration testing', 'security', 10),
  ('appsec', 'أمن التطبيقات', 'Application security', 'security', 20),
  ('network-security', 'أمن الشبكات', 'Network security', 'security', 30),
  ('reverse-engineering', 'الهندسة العكسية', 'Reverse engineering', 'security', 40),
  ('digital-forensics', 'التحقيق الرقمي', 'Digital forensics', 'security', 50),
  ('flutter', 'Flutter', 'Flutter', 'mobile', 10),
  ('dart', 'Dart', 'Dart', 'mobile', 20),
  ('react-native', 'React Native', 'React Native', 'mobile', 30),
  ('swift', 'Swift', 'Swift', 'mobile', 40),
  ('kotlin', 'Kotlin', 'Kotlin', 'mobile', 50),
  ('firebase', 'Firebase', 'Firebase', 'mobile', 60),
  ('figma', 'Figma', 'Figma', 'design', 10),
  ('design-systems', 'أنظمة التصميم', 'Design systems', 'design', 20),
  ('user-research', 'بحث المستخدم', 'User research', 'design', 30),
  ('accessibility', 'سهولة الوصول', 'Accessibility', 'design', 40),
  ('branding', 'الهوية البصرية', 'Branding', 'design', 50),
  ('supabase', 'Supabase', 'Supabase', 'cloud', 10),
  ('vercel', 'Vercel', 'Vercel', 'cloud', 20),
  ('aws', 'AWS', 'AWS', 'cloud', 30),
  ('docker', 'Docker', 'Docker', 'cloud', 40),
  ('kubernetes', 'Kubernetes', 'Kubernetes', 'cloud', 50),
  ('linux', 'Linux', 'Linux', 'cloud', 60),
  ('ci-cd', 'التكامل والنشر المستمر', 'CI/CD', 'cloud', 70),
  ('unity', 'Unity', 'Unity', 'games', 10),
  ('csharp', 'C#', 'C#', 'games', 20),
  ('godot', 'Godot', 'Godot', 'games', 30),
  ('git', 'Git', 'Git', 'other', 10),
  ('testing', 'الاختبار', 'Testing', 'other', 20)
on conflict (slug) do nothing;

alter table public.skills enable row level security;
revoke all on table public.skills from anon, authenticated;
grant select on table public.skills to anon, authenticated;
create policy skills_select_active on public.skills for select to anon, authenticated using (is_active);

-- ------------------------------------------------------------------------------------------ 3. member skills and projects
create table public.member_skills (
  member_id uuid not null references public.members (id) on delete cascade,
  skill_id  smallint not null references public.skills (id) on delete restrict,
  position  smallint not null check (position between 0 and 11),
  primary key (member_id, skill_id)
);
create index member_skills_skill_idx on public.member_skills (skill_id);

create table public.member_projects (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.members (id) on delete cascade,
  position       smallint not null default 0 check (position between 0 and 5),
  title_ar       text not null check (char_length(btrim(title_ar)) between 1 and 150),
  title_en       text check (char_length(title_en) <= 150),
  description_ar text check (char_length(description_ar) <= 500),
  description_en text check (char_length(description_en) <= 500),
  url            text not null check (url ~ '^https://' and char_length(url) <= 500),
  cover_path     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index member_projects_member_idx on public.member_projects (member_id, position);
create trigger member_projects_touch before update on public.member_projects
  for each row execute function private.touch_updated_at();

-- A member lists at most 12 skills and 6 projects (the RPCs check first; this is the database's own guard).
create or replace function private.member_list_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'member_skills' and
     (select count(*) from public.member_skills where member_id = new.member_id) >= 12 then
    raise exception 'LIMIT_REACHED' using errcode = 'P0001';
  end if;
  if tg_table_name = 'member_projects' and
     (select count(*) from public.member_projects where member_id = new.member_id) >= 6 then
    raise exception 'LIMIT_REACHED' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger member_skills_limit before insert on public.member_skills
  for each row execute function private.member_list_limits();
create trigger member_projects_limit before insert on public.member_projects
  for each row execute function private.member_list_limits();

-- Reads: the member sees their own, leadership sees all. Writes only through the RPCs. The public reads views.
alter table public.member_skills enable row level security;
alter table public.member_projects enable row level security;
revoke all on table public.member_skills, public.member_projects from anon, authenticated;
grant select on table public.member_skills, public.member_projects to authenticated;
create policy member_skills_select_own on public.member_skills for select to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and m.user_id = (select auth.uid())));
create policy member_skills_select_staff on public.member_skills for select to authenticated
  using (private.has_permission('members.view') or private.has_permission('members.manage'));
create policy member_projects_select_own on public.member_projects for select to authenticated
  using (exists (select 1 from public.members m where m.id = member_id and m.user_id = (select auth.uid())));
create policy member_projects_select_staff on public.member_projects for select to authenticated
  using (private.has_permission('members.view') or private.has_permission('members.manage'));

-- ------------------------------------------------------------------------------------------ 4. names stay in step
-- The account name (shown in e-mails and the dashboard) is built from the member's name parts.
create or replace function private.sync_profile_names()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_ar text := btrim(concat_ws(' ', nullif(btrim(new.first_name_ar), ''), nullif(btrim(new.middle_name_ar), ''),
                                  nullif(btrim(new.last_name_ar), '')));
  full_en text := case when nullif(btrim(new.first_name_en), '') is null then null
                  else btrim(concat_ws(' ', nullif(btrim(new.first_name_en), ''), nullif(btrim(new.middle_name_en), ''),
                                       nullif(btrim(new.last_name_en), ''))) end;
begin
  if new.user_id is null then return new; end if;
  update public.profiles set
    full_name_ar = case when char_length(full_ar) between 3 and 100 then full_ar else full_name_ar end,
    full_name_en = case when full_en is null then full_name_en else left(full_en, 100) end
  where id = new.user_id;
  return new;
end;
$$;
revoke all on function private.sync_profile_names() from public, anon, authenticated;
create trigger members_sync_profile_names
  after insert or update of first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en, user_id
  on public.members
  for each row execute function private.sync_profile_names();
