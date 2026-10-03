-- Sprint 09 · ART-001, ART-002 — articles ("threads"): bilingual Markdown, review → publish → archive.
-- Authoritative design: docs/11-modules/articles/README.md, docs/05-database/entities/content.md,
-- docs/03-business-domain/article-lifecycle.md. Open questions Q-006 / Q-033 use the documented proposals:
-- committee roles write, head/deputy/leader publish; committee and guest bylines are allowed.

-- ------------------------------------------------------------------------------------------ tags
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) between 1 and 60),
  label_ar   text not null check (char_length(label_ar) between 1 and 60),
  label_en   text check (char_length(label_en) <= 60),
  created_at timestamptz not null default now()
);
comment on table public.tags is 'Shared tag vocabulary for articles (ar/en labels).';

-- ------------------------------------------------------------------------------------------ articles
create table public.articles (
  id                uuid primary key default gen_random_uuid(),
  legacy_id         integer unique,
  slug              text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) between 3 and 120),
  committee_id      uuid references public.committees (id) on delete restrict,
  status            text not null default 'draft'
                      check (status in ('draft', 'in_review', 'changes_requested', 'published', 'archived')),
  title_ar          text not null check (char_length(title_ar) between 3 and 200),
  title_en          text check (char_length(title_en) <= 200),
  excerpt_ar        text check (char_length(excerpt_ar) <= 500),
  excerpt_en        text check (char_length(excerpt_en) <= 500),
  body_ar           text not null default '' check (char_length(body_ar) <= 50000),
  body_en           text check (char_length(body_en) <= 50000),
  reading_minutes   smallint not null default 1 check (reading_minutes >= 1),
  cover_image_path  text,
  resource_url      text check (resource_url is null or resource_url ~ '^https://'),
  resource_label_ar text check (char_length(resource_label_ar) <= 200),
  resource_label_en text check (char_length(resource_label_en) <= 200),
  submitted_by      uuid references public.profiles (id) on delete set null,
  submitted_at      timestamptz,
  reviewed_by       uuid references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  review_note       text,
  published_at      timestamptz,
  archived_at       timestamptz,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index articles_published_idx on public.articles (published_at desc) where status = 'published';
create index articles_committee_status_idx on public.articles (committee_id, status);
create index articles_created_by_idx on public.articles (created_by);

create table public.article_authors (
  article_id      uuid not null references public.articles (id) on delete cascade,
  position        smallint not null check (position >= 0),
  user_id         uuid references public.profiles (id) on delete set null,
  committee_id    uuid references public.committees (id) on delete set null,
  display_name_ar text check (char_length(display_name_ar) <= 150),
  display_name_en text check (char_length(display_name_en) <= 150),
  primary key (article_id, position),
  -- A byline is a registered user, a committee, or a guest known only by name. The names may also override
  -- how a user/committee is shown (the snapshot survives a deleted account, edge case 2).
  constraint article_authors_kind check (
    (user_id is not null and committee_id is null)
    or (committee_id is not null and user_id is null)
    or (user_id is null and committee_id is null and display_name_ar is not null)
  )
);

create table public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete restrict,
  position   smallint not null default 0,
  primary key (article_id, tag_id)
);

-- ------------------------------------------------------------------------------------------ triggers
-- AR-5: reading time is computed (words ÷ 200, at least 1) from the Arabic body, never typed.
create or replace function private.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  words integer;
begin
  words := coalesce(array_length(regexp_split_to_array(btrim(new.body_ar), '\s+'), 1), 0);
  if btrim(new.body_ar) = '' then words := 0; end if;
  new.reading_minutes := greatest(1, ceil(words / 200.0))::smallint;
  if tg_op = 'UPDATE' then
    -- AR-4: published_at is set once. AR-2: the slug is locked after the first publish.
    if old.published_at is not null then
      new.published_at := old.published_at;
      if new.slug is distinct from old.slug then raise exception 'SLUG_LOCKED' using errcode = 'P0001'; end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
create trigger articles_before_write before insert or update on public.articles
  for each row execute function private.articles_before_write();

-- Status only changes inside transition_article() (which sets the flag for its own transaction).
create or replace function private.articles_status_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and coalesce(current_setting('app.article_transition', true), '') <> 'on' then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger articles_status_guard before update on public.articles
  for each row execute function private.articles_status_guard();

-- ------------------------------------------------------------------------------------------ RLS
-- Who may see a row that is not public: its author, editors and publishers of its committee.
create or replace function private.article_visible(p_status text, p_committee uuid, p_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_status = 'published'
      or p_created_by = (select auth.uid())
      or private.has_permission('articles.edit', p_committee)
      or private.has_permission('articles.publish', p_committee)
$$;
revoke all on function private.article_visible(text, uuid, uuid) from public;
grant execute on function private.article_visible(text, uuid, uuid) to anon, authenticated;

create or replace function private.article_row_visible(p_article uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.articles a
    where a.id = p_article and private.article_visible(a.status, a.committee_id, a.created_by)
  )
$$;
revoke all on function private.article_row_visible(uuid) from public;
grant execute on function private.article_row_visible(uuid) to anon, authenticated;

alter table public.tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_authors enable row level security;
alter table public.article_tags enable row level security;
revoke all on table public.tags, public.articles, public.article_authors, public.article_tags from anon, authenticated;
grant select on public.tags, public.articles, public.article_authors, public.article_tags to anon, authenticated;

create policy tags_select on public.tags for select to anon, authenticated using (true);
create policy articles_select on public.articles
  for select to anon, authenticated
  using (private.article_visible(status, committee_id, created_by));
create policy article_authors_select on public.article_authors
  for select to anon, authenticated using (private.article_row_visible(article_id));
create policy article_tags_select on public.article_tags
  for select to anon, authenticated using (private.article_row_visible(article_id));

-- ------------------------------------------------------------------------------------------ read models
-- Public: published only, with names resolved. Owner rights on purpose (profiles are not public); only public columns.
-- display_rank keeps the six migrated threads in their original order after any newer thread (newest first).
create view public.public_articles as
select
  a.id, a.legacy_id, a.slug, a.committee_id,
  c.slug as committee_slug, c.name_ar as committee_name_ar, c.name_en as committee_name_en,
  a.title_ar, a.title_en, a.excerpt_ar, a.excerpt_en, a.body_ar, a.body_en, a.reading_minutes,
  a.cover_image_path, a.resource_url, a.resource_label_ar, a.resource_label_en, a.published_at,
  case when a.legacy_id is not null then 1000000000000 + a.legacy_id
       else -extract(epoch from a.published_at)::bigint end as display_rank,
  (select coalesce(jsonb_agg(jsonb_build_object(
            'kind', case when au.user_id is not null then 'user' when au.committee_id is not null then 'committee' else 'guest' end,
            'name_ar', coalesce(au.display_name_ar, p.full_name_ar, ac.name_ar),
            'name_en', coalesce(au.display_name_en, p.full_name_en, ac.name_en)
          ) order by au.position), '[]'::jsonb)
     from public.article_authors au
     left join public.profiles p on p.id = au.user_id
     left join public.committees ac on ac.id = au.committee_id
    where au.article_id = a.id) as authors,
  (select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'label_ar', t.label_ar, 'label_en', t.label_en) order by at.position, t.slug), '[]'::jsonb)
     from public.article_tags at join public.tags t on t.id = at.tag_id
    where at.article_id = a.id) as tags
from public.articles a
left join public.committees c on c.id = a.committee_id
where a.status = 'published';
comment on view public.public_articles is 'Published articles for the public pages (AR-1).';
revoke all on public.public_articles from anon, authenticated;
grant select on public.public_articles to anon, authenticated;

-- Dashboard list: what the caller may see (author, editor, publisher), without the bodies.
create view public.dashboard_articles as
select
  a.id, a.slug, a.committee_id, c.name_ar as committee_name_ar, c.name_en as committee_name_en,
  a.status, a.title_ar, a.title_en, a.reading_minutes, a.published_at, a.updated_at, a.submitted_at,
  a.review_note, a.created_by,
  (select coalesce(jsonb_agg(coalesce(au.display_name_ar, p.full_name_ar, ac.name_ar) order by au.position), '[]'::jsonb)
     from public.article_authors au
     left join public.profiles p on p.id = au.user_id
     left join public.committees ac on ac.id = au.committee_id
    where au.article_id = a.id) as author_names_ar,
  (select coalesce(jsonb_agg(coalesce(au.display_name_en, p.full_name_en, ac.name_en, au.display_name_ar, p.full_name_ar, ac.name_ar) order by au.position), '[]'::jsonb)
     from public.article_authors au
     left join public.profiles p on p.id = au.user_id
     left join public.committees ac on ac.id = au.committee_id
    where au.article_id = a.id) as author_names_en,
  (select count(*)::integer from public.article_tags at where at.article_id = a.id) as tag_count
from public.articles a
left join public.committees c on c.id = a.committee_id
where private.article_visible(a.status, a.committee_id, a.created_by);
revoke all on public.dashboard_articles from anon, authenticated;
grant select on public.dashboard_articles to authenticated;

-- Authors of one editable article with names (the editor needs the ids and the labels).
create view public.article_authors_named as
select
  au.article_id, au.position, au.user_id, au.committee_id, au.display_name_ar, au.display_name_en,
  coalesce(au.display_name_ar, p.full_name_ar, ac.name_ar) as label_ar,
  coalesce(au.display_name_en, p.full_name_en, ac.name_en, au.display_name_ar, p.full_name_ar, ac.name_ar) as label_en
from public.article_authors au
left join public.profiles p on p.id = au.user_id
left join public.committees ac on ac.id = au.committee_id
where private.article_row_visible(au.article_id);
revoke all on public.article_authors_named from anon, authenticated;
grant select on public.article_authors_named to authenticated;

create view public.article_status_counts with (security_invoker = true) as
select status, count(*)::integer as total from public.articles group by status;
revoke all on public.article_status_counts from anon;
grant select on public.article_status_counts to authenticated;

-- ------------------------------------------------------------------------------------------ guards
-- First missing requirement to submit or publish (or null): Arabic title, Arabic body, a byline.
create or replace function private.article_missing_requirement(p_article uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  a public.articles;
begin
  select * into a from public.articles where id = p_article;
  if btrim(coalesce(a.title_ar, '')) = '' then return 'title_ar'; end if;
  if btrim(coalesce(a.body_ar, '')) = '' then return 'body_ar'; end if;
  if not exists (select 1 from public.article_authors where article_id = p_article) then return 'authors'; end if;
  return null;
end;
$$;
revoke all on function private.article_missing_requirement(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ save_article
create or replace function public.save_article(
  p_id uuid,
  p jsonb,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  is_new boolean := p_id is null;
  old public.articles;
  v public.articles;
  slug_in text;
  base text;
  n integer := 0;
  item jsonb;
  idx integer := 0;
  tag_slug text;
  tag_id uuid;
  committee_status text;
  owns boolean;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;

  if is_new then
    v.id := gen_random_uuid();
    v.status := 'draft';
    v.created_by := caller;
    v.created_at := now();
    v.updated_at := now();
    v.body_ar := '';
    v.reading_minutes := 1;
    v.committee_id := nullif(p ->> 'committee_id', '')::uuid;
    if v.committee_id is null and not private.has_permission('articles.create', null) then
      raise exception 'SCOPE_REQUIRED' using errcode = 'P0001';
    end if;
    if not private.has_permission('articles.create', v.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  else
    select * into old from public.articles where id = p_id for update;
    if not found or not private.article_visible(old.status, old.committee_id, old.created_by) then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
    owns := old.created_by = caller and private.has_permission('articles.create', old.committee_id);
    if old.status = 'published' then
      -- AR: editing a published article is for the publishers (audited).
      if not private.has_permission('articles.publish', old.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    elsif old.status in ('draft', 'changes_requested') then
      if not (owns or private.has_permission('articles.edit', old.committee_id)) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    else
      raise exception 'NOT_EDITABLE' using errcode = 'P0001';
    end if;
    if p_expected_updated_at is not null and old.updated_at <> p_expected_updated_at then
      raise exception 'STALE_DATA' using errcode = 'P0001';
    end if;
    v := old;
    if p ? 'committee_id' and nullif(p ->> 'committee_id', '')::uuid is distinct from old.committee_id then
      v.committee_id := nullif(p ->> 'committee_id', '')::uuid;
      if not private.has_permission('articles.create', v.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    end if;
  end if;

  if v.committee_id is not null then
    select status into committee_status from public.committees where id = v.committee_id;
    if committee_status is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    if (is_new or v.committee_id is distinct from old.committee_id) and committee_status <> 'active' then
      raise exception 'COMMITTEE_INACTIVE' using errcode = 'P0001';
    end if;
  end if;

  if p ? 'title_ar' then v.title_ar := btrim(coalesce(p ->> 'title_ar', '')); end if;
  if p ? 'title_en' then v.title_en := nullif(btrim(p ->> 'title_en'), ''); end if;
  if p ? 'excerpt_ar' then v.excerpt_ar := nullif(btrim(p ->> 'excerpt_ar'), ''); end if;
  if p ? 'excerpt_en' then v.excerpt_en := nullif(btrim(p ->> 'excerpt_en'), ''); end if;
  if p ? 'body_ar' then v.body_ar := coalesce(p ->> 'body_ar', ''); end if;
  if p ? 'body_en' then v.body_en := nullif(p ->> 'body_en', ''); end if;
  if p ? 'cover_image_path' then v.cover_image_path := nullif(btrim(p ->> 'cover_image_path'), ''); end if;
  if p ? 'resource_url' then v.resource_url := nullif(btrim(p ->> 'resource_url'), ''); end if;
  if p ? 'resource_label_ar' then v.resource_label_ar := nullif(btrim(p ->> 'resource_label_ar'), ''); end if;
  if p ? 'resource_label_en' then v.resource_label_en := nullif(btrim(p ->> 'resource_label_en'), ''); end if;

  -- Field-level validation, so the form can point at the field (code:field convention).
  if char_length(coalesce(v.title_ar, '')) < 3 or char_length(v.title_ar) > 200 then raise exception 'VALIDATION_FAILED:title_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(v.title_en, '')) > 200 then raise exception 'VALIDATION_FAILED:title_en' using errcode = 'P0001'; end if;
  if char_length(coalesce(v.excerpt_ar, '')) > 500 then raise exception 'VALIDATION_FAILED:excerpt_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(v.excerpt_en, '')) > 500 then raise exception 'VALIDATION_FAILED:excerpt_en' using errcode = 'P0001'; end if;
  if char_length(coalesce(v.body_ar, '')) > 50000 then raise exception 'VALIDATION_FAILED:body_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(v.body_en, '')) > 50000 then raise exception 'VALIDATION_FAILED:body_en' using errcode = 'P0001'; end if;
  if v.resource_url is not null and v.resource_url !~ '^https://' then raise exception 'VALIDATION_FAILED:resource_url' using errcode = 'P0001'; end if;

  -- slug: provided (checked) or generated once for a new article
  slug_in := nullif(btrim(p ->> 'slug'), '');
  if slug_in is not null then
    if old.published_at is not null and slug_in <> old.slug then raise exception 'SLUG_LOCKED' using errcode = 'P0001'; end if;
    if slug_in !~ '^[a-z0-9-]+$' or char_length(slug_in) < 3 or char_length(slug_in) > 120 then raise exception 'VALIDATION_FAILED:slug' using errcode = 'P0001'; end if;
    v.slug := slug_in;
    if exists (select 1 from public.articles where slug = v.slug and id <> v.id) then raise exception 'SLUG_TAKEN' using errcode = 'P0001'; end if;
  elsif is_new then
    base := private.slugify(coalesce(v.title_en, ''));
    if char_length(base) < 3 then base := 'thread'; end if;
    v.slug := base;
    while exists (select 1 from public.articles where slug = v.slug) loop
      n := n + 1;
      v.slug := base || '-' || substr(md5(random()::text || n::text), 1, 5);
    end loop;
  end if;

  if is_new then
    insert into public.articles select v.*;
  else
    update public.articles set
      committee_id = v.committee_id, slug = v.slug, title_ar = v.title_ar, title_en = v.title_en,
      excerpt_ar = v.excerpt_ar, excerpt_en = v.excerpt_en, body_ar = v.body_ar, body_en = v.body_en,
      cover_image_path = v.cover_image_path, resource_url = v.resource_url,
      resource_label_ar = v.resource_label_ar, resource_label_en = v.resource_label_en
    where id = v.id;
  end if;

  -- authors: replace the ordered set (≤ 8); a new article defaults to its creator (AR-6)
  if p ? 'authors' then
    if jsonb_array_length(p -> 'authors') > 8 then raise exception 'VALIDATION_FAILED:authors' using errcode = 'P0001'; end if;
    delete from public.article_authors where article_id = v.id;
    idx := 0;
    for item in select * from jsonb_array_elements(p -> 'authors') loop
      begin
        insert into public.article_authors (article_id, position, user_id, committee_id, display_name_ar, display_name_en)
        values (v.id, idx, nullif(item ->> 'user_id', '')::uuid, nullif(item ->> 'committee_id', '')::uuid,
                nullif(btrim(item ->> 'display_name_ar'), ''), nullif(btrim(item ->> 'display_name_en'), ''));
      exception when check_violation or foreign_key_violation then
        raise exception 'VALIDATION_FAILED:authors' using errcode = 'P0001';
      end;
      idx := idx + 1;
    end loop;
  elsif is_new then
    insert into public.article_authors (article_id, position, user_id) values (v.id, 0, caller);
  end if;

  -- tags: replace the set (≤ 8); unknown slugs create the tag with the given labels
  if p ? 'tags' then
    if jsonb_array_length(p -> 'tags') > 8 then raise exception 'VALIDATION_FAILED:tags' using errcode = 'P0001'; end if;
    delete from public.article_tags where article_id = v.id;
    idx := 0;
    for item in select * from jsonb_array_elements(p -> 'tags') loop
      tag_slug := lower(btrim(coalesce(item ->> 'slug', '')));
      if tag_slug !~ '^[a-z0-9-]{1,60}$' then raise exception 'VALIDATION_FAILED:tags' using errcode = 'P0001'; end if;
      insert into public.tags (slug, label_ar, label_en)
      values (tag_slug, coalesce(nullif(btrim(item ->> 'label_ar'), ''), tag_slug), nullif(btrim(item ->> 'label_en'), ''))
      on conflict (slug) do nothing;
      select id into tag_id from public.tags where slug = tag_slug;
      insert into public.article_tags (article_id, tag_id, position) values (v.id, tag_id, idx) on conflict do nothing;
      idx := idx + 1;
    end loop;
  end if;

  perform private.write_audit(case when is_new then 'article.created' else 'article.updated' end, 'article', v.id::text, v.committee_id,
    jsonb_build_object('slug', v.slug, 'status', coalesce(old.status, 'draft')));

  return (select jsonb_build_object('id', a.id, 'slug', a.slug, 'status', a.status, 'updated_at', a.updated_at)
            from public.articles a where a.id = v.id);
end;
$$;

-- ------------------------------------------------------------------------------------------ transition_article
create or replace function public.transition_article(p_id uuid, p_action text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.articles;
  caller uuid := (select auth.uid());
  to_status text;
  audit_action text;
  missing text;
  note text := nullif(btrim(coalesce(p_note, '')), '');
  can_author boolean;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into a from public.articles where id = p_id for update;
  if not found or not private.article_visible(a.status, a.committee_id, a.created_by) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  can_author := (a.created_by = caller and private.has_permission('articles.create', a.committee_id))
                or private.has_permission('articles.edit', a.committee_id);

  case p_action
    when 'submit' then
      if not can_author then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status not in ('draft', 'changes_requested') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      missing := private.article_missing_requirement(a.id);
      if missing is not null then raise exception 'INCOMPLETE:%', missing using errcode = 'P0001'; end if;
      to_status := 'in_review'; audit_action := 'article.submitted';
    when 'withdraw' then
      if not can_author then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status <> 'in_review' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      to_status := 'draft'; audit_action := 'article.withdrawn';
    when 'publish' then
      if not private.has_permission('articles.publish', a.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status not in ('in_review', 'draft', 'changes_requested') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      missing := private.article_missing_requirement(a.id);
      if missing is not null then raise exception 'PUBLISH_GUARD:%', missing using errcode = 'P0001'; end if;
      to_status := 'published'; audit_action := 'article.published';
    when 'request_changes' then
      if not private.has_permission('articles.publish', a.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status <> 'in_review' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      if note is null or char_length(note) < 10 then raise exception 'NOTE_TOO_SHORT' using errcode = 'P0001'; end if;
      to_status := 'changes_requested'; audit_action := 'article.changes_requested';
    when 'archive' then
      if not private.has_permission('articles.publish', a.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status <> 'published' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      to_status := 'archived'; audit_action := 'article.archived';
    when 'restore' then
      if not private.has_permission('articles.publish', a.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if a.status <> 'archived' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      to_status := 'published'; audit_action := 'article.restored';
    else
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end case;

  perform set_config('app.article_transition', 'on', true);
  update public.articles set
    status = to_status,
    submitted_by = case when p_action = 'submit' then caller else submitted_by end,
    submitted_at = case when p_action = 'submit' then now() else submitted_at end,
    reviewed_by = case when p_action in ('publish', 'request_changes') then caller else reviewed_by end,
    reviewed_at = case when p_action in ('publish', 'request_changes') then now() else reviewed_at end,
    review_note = case when p_action = 'request_changes' then note when p_action in ('publish', 'submit') then null else review_note end,
    published_at = case when p_action in ('publish', 'restore') then coalesce(published_at, now()) else published_at end,
    archived_at = case when p_action = 'archive' then now() when p_action = 'restore' then null else archived_at end
  where id = a.id;
  perform set_config('app.article_transition', 'off', true);

  perform private.write_audit(audit_action, 'article', a.id::text, a.committee_id,
    jsonb_build_object('slug', a.slug, 'from', a.status, 'to', to_status, 'note', note));
  return to_status;
end;
$$;

-- ------------------------------------------------------------------------------------------ delete_article_draft
create or replace function public.delete_article_draft(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.articles;
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into a from public.articles where id = p_id for update;
  if not found or not private.article_visible(a.status, a.committee_id, a.created_by) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if not ((a.created_by = caller and private.has_permission('articles.create', a.committee_id))
          or private.has_permission('articles.edit', a.committee_id)) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  -- Only a never-published draft can be deleted (otherwise archive it).
  if a.published_at is not null or a.status not in ('draft', 'changes_requested') then
    raise exception 'NOT_EDITABLE' using errcode = 'P0001';
  end if;
  delete from public.articles where id = a.id;
  perform private.write_audit('article.deleted', 'article', a.id::text, a.committee_id, jsonb_build_object('slug', a.slug));
end;
$$;

revoke all on function public.save_article(uuid, jsonb, timestamptz) from public, anon;
revoke all on function public.transition_article(uuid, text, text) from public, anon;
revoke all on function public.delete_article_draft(uuid) from public, anon;
grant execute on function public.save_article(uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.transition_article(uuid, text, text) to authenticated;
grant execute on function public.delete_article_draft(uuid) to authenticated;

-- ------------------------------------------------------------------------------------------ storage: covers
-- Article authors may upload covers to the same public bucket as event covers.
drop policy public_media_insert on storage.objects;
create policy public_media_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-media'
              and (private.has_permission_any_scope('events.edit') or private.has_permission_any_scope('articles.create')));
drop policy public_media_update on storage.objects;
create policy public_media_update on storage.objects
  for update to authenticated
  using (bucket_id = 'public-media'
         and (private.has_permission_any_scope('events.edit') or private.has_permission_any_scope('articles.create')))
  with check (bucket_id = 'public-media'
              and (private.has_permission_any_scope('events.edit') or private.has_permission_any_scope('articles.create')));
