-- Sprint 04 · ACC-001, CMT-001 — committees, roles, permissions, time-bound role assignments.
-- Authoritative design: docs/05-database/entities/{identity-and-access,organization}.md,
-- docs/06-security/{authorization-model,permission-catalog}.md, docs/11-modules/{access-control,committees}.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------------------------- committees
create table public.committees (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar        text not null check (char_length(name_ar) between 1 and 100),
  name_en        text check (char_length(name_en) <= 100),
  description_ar text check (char_length(description_ar) <= 2000),
  description_en text check (char_length(description_en) <= 2000),
  status         text not null default 'active' check (status in ('active', 'inactive')),
  display_order  smallint not null default 0,
  contact_email  text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.committees is 'Standing working groups. Deactivated, never deleted once referenced (BR-ORG-005).';
create index committees_status_order_idx on public.committees (status, display_order);
create trigger committees_touch_updated_at before update on public.committees
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------------------------- catalogue
create table public.roles (
  key                text primary key check (key ~ '^[a-z_]+$'),
  name_ar            text not null,
  name_en            text not null,
  scope              text not null check (scope in ('global', 'committee')),
  is_public_position boolean not null default false,
  display_order      smallint not null default 0,
  description_ar     text,
  description_en     text
);

create table public.permissions (
  key            text primary key check (key ~ '^[a-z_]+\.[a-z_]+$'),
  module         text not null,
  description_ar text not null,
  description_en text not null
);

create table public.role_permissions (
  role_key       text not null references public.roles (key) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

-- ---------------------------------------------------------------------------------------------- assignments
create table public.role_assignments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete restrict,
  role_key         text not null references public.roles (key),
  committee_id     uuid references public.committees (id) on delete restrict,
  display_title_ar text check (char_length(display_title_ar) <= 100),
  display_title_en text check (char_length(display_title_en) <= 100),
  -- Optional presentation text for the public leadership cards (/members), shown only for public roles.
  public_bio_ar    text check (char_length(public_bio_ar) <= 300),
  public_bio_en    text check (char_length(public_bio_en) <= 300),
  public_tags_ar   text[] check (cardinality(public_tags_ar) <= 3),
  public_tags_en   text[] check (cardinality(public_tags_en) <= 3),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  assigned_by      uuid references public.profiles (id) on delete set null,
  ended_by         uuid references public.profiles (id) on delete set null,
  end_reason       text check (char_length(end_reason) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint role_assignments_term_check check (ends_at is null or ends_at >= starts_at),
  -- BR-ORG-003: one community leader at a time, one head per committee at a time.
  constraint role_assignments_one_leader
    exclude using gist (role_key with =, tstzrange(starts_at, ends_at) with &&)
    where (role_key = 'community_leader'),
  constraint role_assignments_one_head
    exclude using gist (committee_id with =, tstzrange(starts_at, ends_at) with &&)
    where (role_key = 'committee_head'),
  -- The same person cannot hold the same role in the same scope twice at the same time.
  constraint role_assignments_no_duplicate
    exclude using gist (
      user_id with =, role_key with =,
      coalesce(committee_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
      tstzrange(starts_at, ends_at) with &&
    )
);
comment on table public.role_assignments is
  'Positions and authorization in one table: who holds which role, where, and for which term (BR-ORG-001). Never deleted.';
create index role_assignments_user_idx on public.role_assignments (user_id);
create index role_assignments_committee_idx on public.role_assignments (committee_id);
create index role_assignments_role_idx on public.role_assignments (role_key);
create index role_assignments_open_idx on public.role_assignments (user_id) where ends_at is null;
create trigger role_assignments_touch_updated_at before update on public.role_assignments
  for each row execute function private.touch_updated_at();

-- AC-2 / BR-ORG-002: committee-scoped roles need a committee; global roles forbid one.
create or replace function private.check_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_scope text;
begin
  select scope into v_scope from public.roles where key = new.role_key;
  if v_scope = 'committee' and new.committee_id is null then
    raise exception 'SCOPE_REQUIRED' using errcode = 'P0001';
  elsif v_scope = 'global' and new.committee_id is not null then
    raise exception 'SCOPE_FORBIDDEN' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger role_assignments_scope_check before insert or update of role_key, committee_id
  on public.role_assignments for each row execute function private.check_assignment_scope();

-- ---------------------------------------------------------------------------------------------- seed: roles
insert into public.roles (key, name_ar, name_en, scope, is_public_position, display_order, description_ar, description_en) values
  ('system_admin',     'مدير النظام',          'System administrator', 'global',    false, 0,  'إدارة تقنية للنظام والمستخدمين والأدوار', 'Technical administration of the system, users and roles'),
  ('founder',          'مؤسِّس',               'Founder',              'global',    true,  10, 'مؤسِّسو المجتمع — اطلاع ورقابة', 'Community founders — oversight and visibility'),
  ('community_leader', 'قائد المجتمع',         'Community leader',     'global',    true,  20, 'يقود المجتمع ويعتمد الفعاليات ويدير الاستقبال', 'Runs the community, approves events and runs intake'),
  ('advisor',          'المستشار',             'Advisor',              'global',    true,  30, 'دعم استراتيجي واطلاع على التقارير', 'Strategic support and report visibility'),
  ('committee_head',   'قائد اللجنة',          'Committee head',       'committee', true,  40, 'يدير لجنته: فعالياتها وتسجيلاتها وأعضاءها', 'Runs a committee: its events, registrations and members'),
  ('committee_deputy', 'نائب قائد اللجنة',     'Committee deputy',     'committee', true,  50, 'مثل القائد دون إدارة أعضاء اللجنة', 'Same as the head except managing committee members'),
  ('committee_member', 'عضو لجنة',             'Committee member',     'committee', false, 60, 'يعدّ مسودات الفعاليات والمقالات للجنته', 'Drafts events and articles for the committee');

-- ---------------------------------------------------------------------------------------------- seed: permissions (30)
insert into public.permissions (key, module, description_ar, description_en) values
  ('events.create',            'events',        'إنشاء مسودات الفعاليات', 'Create event drafts'),
  ('events.view_drafts',       'events',        'عرض الفعاليات غير المنشورة', 'See unpublished events'),
  ('events.edit',              'events',        'تعديل الفعاليات القابلة للتعديل', 'Edit editable events'),
  ('events.submit',            'events',        'إرسال الفعالية للمراجعة أو سحبها', 'Submit events for review or withdraw them'),
  ('events.approve',           'events',        'اعتماد ونشر الفعاليات أو طلب تعديلات', 'Approve (publish) events or request changes'),
  ('events.cancel',            'events',        'إلغاء الفعاليات المنشورة', 'Cancel published events'),
  ('events.complete',          'events',        'إكمال الفعاليات المنتهية', 'Mark ended events completed'),
  ('events.delete',            'events',        'حذف المسودات التي لم تُنشر', 'Delete never-published drafts'),
  ('registrations.review',     'registrations', 'عرض المسجلين وقبولهم أو رفضهم', 'View registrants and accept, reject or waitlist them'),
  ('registrations.attendance', 'registrations', 'تسجيل الحضور', 'Record attendance'),
  ('registrations.export',     'registrations', 'تصدير المسجلين', 'Export registrants'),
  ('articles.create',          'articles',      'إنشاء مسودات المقالات', 'Create article drafts'),
  ('articles.edit',            'articles',      'تعديل المقالات', 'Edit articles'),
  ('articles.publish',         'articles',      'نشر المقالات وأرشفتها', 'Publish and archive articles'),
  ('membership.manage_cycles', 'membership',    'إدارة دورات الاستقبال', 'Manage intake cycles'),
  ('membership.review',        'membership',    'مراجعة طلبات العضوية والبتّ فيها', 'Review and decide membership applications'),
  ('membership.export',        'membership',    'تصدير طلبات العضوية', 'Export membership applications'),
  ('members.view',             'members',       'عرض الحقول الخاصة للأعضاء', 'View private member fields'),
  ('members.manage',           'members',       'إدارة حالة الأعضاء وسجلاتهم', 'Manage member status and records'),
  ('committees.manage',        'committees',    'إنشاء اللجان وتعديلها وتعطيلها', 'Create, edit and deactivate committees'),
  ('committee_members.manage', 'committees',    'إضافة وإزالة أعضاء اللجنة', 'Add and remove committee members'),
  ('roles.view',               'access',        'عرض جميع تعيينات الأدوار', 'View all role assignments'),
  ('roles.assign',             'access',        'تعيين الأدوار وإنهاؤها', 'Assign and end roles'),
  ('users.view',               'access',        'البحث عن المستخدمين وعرض حساباتهم', 'Search users and view accounts'),
  ('reports.view_community',   'reports',       'لوحة تقارير المجتمع', 'Community reports dashboard'),
  ('reports.view_committee',   'reports',       'لوحة تقارير اللجنة', 'Committee reports dashboard'),
  ('reference_data.manage',    'admin',         'إدارة القوائم المرجعية', 'Manage reference lists'),
  ('settings.manage',          'admin',         'إدارة إعدادات الموقع', 'Manage site settings'),
  ('audit.view',               'admin',         'عرض سجل التدقيق', 'View the audit log'),
  ('email_logs.view',          'admin',         'عرض سجل البريد', 'View the e-mail log');

-- ---------------------------------------------------------------------------------------------- seed: role × permission matrix
-- docs/06-security/permission-catalog.md §2. Committee-scoped roles hold their permissions only in the
-- committee of the assignment; global roles hold them everywhere.
insert into public.role_permissions (role_key, permission_key)
select 'system_admin', key from public.permissions;

insert into public.role_permissions (role_key, permission_key) values
  -- founder (oversight; Q-032 / Q-007 defaults)
  ('founder', 'events.view_drafts'), ('founder', 'members.view'), ('founder', 'roles.view'),
  ('founder', 'reports.view_community'), ('founder', 'reports.view_committee'),
  -- advisor
  ('advisor', 'reports.view_community'), ('advisor', 'reports.view_committee'),
  -- committee_head
  ('committee_head', 'events.create'), ('committee_head', 'events.view_drafts'), ('committee_head', 'events.edit'),
  ('committee_head', 'events.submit'), ('committee_head', 'events.cancel'), ('committee_head', 'events.complete'),
  ('committee_head', 'events.delete'), ('committee_head', 'registrations.review'),
  ('committee_head', 'registrations.attendance'), ('committee_head', 'registrations.export'),
  ('committee_head', 'articles.create'), ('committee_head', 'articles.edit'), ('committee_head', 'articles.publish'),
  ('committee_head', 'committee_members.manage'), ('committee_head', 'reports.view_committee'),
  -- committee_deputy (head minus cancel, export, member management)
  ('committee_deputy', 'events.create'), ('committee_deputy', 'events.view_drafts'), ('committee_deputy', 'events.edit'),
  ('committee_deputy', 'events.submit'), ('committee_deputy', 'events.complete'), ('committee_deputy', 'events.delete'),
  ('committee_deputy', 'registrations.review'), ('committee_deputy', 'registrations.attendance'),
  ('committee_deputy', 'articles.create'), ('committee_deputy', 'articles.edit'), ('committee_deputy', 'articles.publish'),
  ('committee_deputy', 'reports.view_committee'),
  -- committee_member (drafts only; the draft restriction is enforced by the events policies)
  ('committee_member', 'events.create'), ('committee_member', 'events.view_drafts'), ('committee_member', 'events.edit'),
  ('committee_member', 'registrations.attendance'), ('committee_member', 'articles.create');

-- community_leader: everything operational, but not audit.view and no system administration (Q-032)
insert into public.role_permissions (role_key, permission_key)
select 'community_leader', key from public.permissions where key <> 'audit.view';

-- ---------------------------------------------------------------------------------------------- seed: committees (A-006)
insert into public.committees (slug, name_ar, name_en, display_order) values
  ('ai',               'لجنة الذكاء الاصطناعي',      'Artificial Intelligence',    10),
  ('cybersecurity',    'لجنة الأمن السيبراني',       'Cybersecurity',              20),
  ('tech-development', 'لجنة التقنية والتطوير',      'Technology & Development',   30),
  ('projects',         'لجنة المشاريع',              'Projects',                   40),
  ('design-identity',  'لجنة التصميم والهوية',       'Design & Identity',          50);

-- ---------------------------------------------------------------------------------------------- permission helpers
-- The only authorization primitives used in RLS (docs/05-database/rls-security-model.md §2).
create or replace function private.has_permission(p_permission text, p_committee uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.key = ra.role_key
    join public.role_permissions rp on rp.role_key = ra.role_key
    where ra.user_id = (select auth.uid())
      and rp.permission_key = p_permission
      and ra.starts_at <= now()
      and (ra.ends_at is null or ra.ends_at > now())
      and (r.scope = 'global' or (p_committee is not null and ra.committee_id = p_committee))
  );
$$;

create or replace function private.has_permission_any_scope(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.role_permissions rp on rp.role_key = ra.role_key
    where ra.user_id = (select auth.uid())
      and rp.permission_key = p_permission
      and ra.starts_at <= now()
      and (ra.ends_at is null or ra.ends_at > now())
  );
$$;

-- Committees where the caller holds the permission (all committees when held globally).
create or replace function private.committees_with_permission(p_permission text)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.committees c
  where exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.key = ra.role_key
    join public.role_permissions rp on rp.role_key = ra.role_key
    where ra.user_id = (select auth.uid())
      and rp.permission_key = p_permission
      and ra.starts_at <= now()
      and (ra.ends_at is null or ra.ends_at > now())
      and (r.scope = 'global' or ra.committee_id = c.id)
  );
$$;

-- BR-ORG-004. Placeholder until members are linked to accounts (Sprint 08 replaces this body).
create or replace function private.is_active_member(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select true $$;

revoke all on function private.has_permission(text, uuid) from public;
revoke all on function private.has_permission_any_scope(text) from public;
revoke all on function private.committees_with_permission(text) from public;
revoke all on function private.is_active_member(uuid) from public;
grant execute on function private.has_permission(text, uuid) to anon, authenticated;
grant execute on function private.has_permission_any_scope(text) to anon, authenticated;
grant execute on function private.committees_with_permission(text) to anon, authenticated;
grant execute on function private.is_active_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------- RLS + grants
alter table public.committees enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.role_assignments enable row level security;

revoke all on table public.committees, public.roles, public.permissions,
  public.role_permissions, public.role_assignments from anon, authenticated;

grant select on public.committees to anon, authenticated;
grant insert, update on public.committees to authenticated;
grant select on public.roles to anon, authenticated;
grant select on public.permissions, public.role_permissions to authenticated;
grant select on public.role_assignments to authenticated;

create policy committees_select_active on public.committees
  for select to anon, authenticated using (status = 'active');
create policy committees_select_all_managers on public.committees
  for select to authenticated
  using (private.has_permission('committees.manage') or private.has_permission('roles.view')
         or id in (select private.committees_with_permission('events.view_drafts')));
create policy committees_insert on public.committees
  for insert to authenticated with check (private.has_permission('committees.manage'));
create policy committees_update on public.committees
  for update to authenticated
  using (private.has_permission('committees.manage'))
  with check (private.has_permission('committees.manage'));

create policy roles_select_public on public.roles
  for select to anon using (is_public_position);
create policy roles_select_all on public.roles
  for select to authenticated using (true);
create policy permissions_select on public.permissions
  for select to authenticated using (true);
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

create policy role_assignments_select_own on public.role_assignments
  for select to authenticated using (user_id = (select auth.uid()));
create policy role_assignments_select_viewers on public.role_assignments
  for select to authenticated using (private.has_permission('roles.view'));
create policy role_assignments_select_committee_heads on public.role_assignments
  for select to authenticated
  using (committee_id is not null and private.has_permission('committee_members.manage', committee_id));

-- Admins and role viewers can read profiles (users list); everyone else only their own row.
create policy profiles_select_users_view on public.profiles
  for select to authenticated using (private.has_permission('users.view'));
create policy profiles_select_role_viewers on public.profiles
  for select to authenticated using (private.has_permission('roles.view'));
