-- Sprint 11 — administration tools: audit log reader, audited exports with a filter, site settings,
-- partners and the shared tag vocabulary. Same pattern as every other write: one SECURITY DEFINER function,
-- permission re-checked inside, machine error codes (`CODE:field`), an audit row per change.

-- ------------------------------------------------------------------------------------------ audit log reader
-- ACC-005: actors are shown by name, which the audit.view holder cannot read from profiles directly.
create or replace function public.list_audit_logs(
  p_actor text default null,
  p_action text default null,
  p_entity text default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 25,
  p_offset integer default 0
) returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 25), 1), 200);
  off integer := greatest(coalesce(p_offset, 0), 0);
  total integer;
  rows_out jsonb;
  actor_like text := nullif(btrim(coalesce(p_actor, '')), '');
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('audit.view') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_from is not null and p_to is not null and p_to < p_from then
    raise exception 'VALIDATION_FAILED:to' using errcode = 'P0001';
  end if;

  with f as (
    select a.*, p.full_name_ar as actor_ar, p.full_name_en as actor_en
      from public.audit_logs a
      left join public.profiles p on p.id = a.actor_id
     where (actor_like is null or p.full_name_ar ilike '%' || actor_like || '%' or p.full_name_en ilike '%' || actor_like || '%' or p.email ilike '%' || actor_like || '%')
       and (nullif(p_action, '') is null or a.action = p_action or a.action like p_action || '.%')
       and (nullif(p_entity, '') is null or a.entity_type = p_entity)
       and (p_from is null or (a.occurred_at at time zone 'Asia/Riyadh')::date >= p_from)
       and (p_to is null or (a.occurred_at at time zone 'Asia/Riyadh')::date <= p_to)
  ), page as (select * from f order by occurred_at desc, id desc limit lim offset off)
  select (select count(*) from f)::integer,
         coalesce((select jsonb_agg(jsonb_build_object(
             'id', g.id, 'at', g.occurred_at, 'action', g.action, 'entity_type', g.entity_type,
             'entity_id', g.entity_id, 'summary', g.summary,
             'actor', case when g.actor_id is null then null else jsonb_build_object('id', g.actor_id, 'name_ar', g.actor_ar, 'name_en', g.actor_en) end
           ) order by g.occurred_at desc, g.id desc) from page g), '[]'::jsonb)
    into total, rows_out;

  return jsonb_build_object('total', total, 'rows', rows_out);
end;
$$;
revoke all on function public.list_audit_logs(text, text, text, date, date, integer, integer) from public, anon;
grant execute on function public.list_audit_logs(text, text, text, date, date, integer, integer) to authenticated;

-- Filter facets for the screen.
create or replace function public.audit_facets()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('audit.view') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  return jsonb_build_object(
    'actions', coalesce((select jsonb_agg(distinct split_part(action, '.', 1) order by split_part(action, '.', 1))
                           from public.audit_logs), '[]'::jsonb),
    'entities', coalesce((select jsonb_agg(distinct entity_type order by entity_type) from public.audit_logs), '[]'::jsonb));
end;
$$;
revoke all on function public.audit_facets() from public, anon;
grant execute on function public.audit_facets() to authenticated;

-- ------------------------------------------------------------------------------------------ audited exports (REG-007)
-- The filter that produced the file is stored next to the row count; the data itself never is.
drop function if exists public.record_export(text, integer);
create or replace function public.record_export(p_kind text, p_count integer, p_filter jsonb default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  clean jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if p_kind = 'membership_applications' then
    if not (private.has_permission('membership.export') and private.has_permission('membership.review')) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
  elsif p_kind = 'registrations' then
    if not private.has_permission_any_scope('registrations.export') then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
  elsif p_kind = 'audit_logs' then
    if not private.has_permission('audit.view') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  else
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_filter is not null and jsonb_typeof(p_filter) <> 'object' then
    raise exception 'VALIDATION_FAILED:filter' using errcode = 'P0001';
  end if;
  -- keep only short scalar values: the filter is a description of the export, not a payload
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into clean
    from jsonb_each(coalesce(p_filter, '{}'::jsonb)) as t(k, v)
   where jsonb_typeof(v) in ('string', 'number', 'boolean') and char_length(v::text) <= 120 and char_length(k) <= 40;
  perform private.write_audit('export.' || p_kind, 'export', p_kind, null,
    jsonb_build_object('rows', greatest(coalesce(p_count, 0), 0), 'filter', clean));
end;
$$;
revoke all on function public.record_export(text, integer, jsonb) from public, anon;
grant execute on function public.record_export(text, integer, jsonb) to authenticated;

-- ------------------------------------------------------------------------------------------ site settings (ACC-006)
insert into public.site_settings (key, value, is_public) values
  ('social_instagram', '"https://instagram.com"'::jsonb, true),
  ('social_linkedin',
   '"https://www.linkedin.com/company/sdc-%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%85%D8%B9-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D9%84%D9%84%D9%85%D8%B7%D9%88%D8%B1%D9%8A%D9%86/"'::jsonb,
   true),
  ('social_x', '"https://x.com/sdc_saudi?s=21&t=XwrJBduv3_FE7Zi5Vp45Dw"'::jsonb, true),
  ('contact_email', '""'::jsonb, true),
  ('footer_rights_ar', '""'::jsonb, true),
  ('footer_rights_en', '""'::jsonb, true)
on conflict (key) do nothing;

create or replace function public.save_site_settings(p_values jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  k text;
  v jsonb;
  s text;
  changed text[] := '{}';
  old jsonb;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('settings.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_values is null or jsonb_typeof(p_values) <> 'object' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;

  for k, v in select * from jsonb_each(p_values) loop
    if k in ('social_instagram', 'social_linkedin', 'social_x') then
      if jsonb_typeof(v) <> 'string' then raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001'; end if;
      s := btrim(v #>> '{}');
      if s !~ '^https://[^[:space:]]{3,200}$' then raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001'; end if;
      v := to_jsonb(s);
    elsif k = 'contact_email' then
      if jsonb_typeof(v) <> 'string' then raise exception 'VALIDATION_FAILED:contact_email' using errcode = 'P0001'; end if;
      s := btrim(v #>> '{}');
      if s <> '' and s !~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then
        raise exception 'VALIDATION_FAILED:contact_email' using errcode = 'P0001';
      end if;
      v := to_jsonb(s);
    elsif k in ('footer_rights_ar', 'footer_rights_en') then
      if jsonb_typeof(v) <> 'string' or char_length(v #>> '{}') > 200 then
        raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001';
      end if;
      v := to_jsonb(btrim(v #>> '{}'));
    elsif k = 'certificates_enabled' then
      if jsonb_typeof(v) <> 'boolean' then raise exception 'VALIDATION_FAILED:certificates_enabled' using errcode = 'P0001'; end if;
    elsif k = 'certificate_threshold' then
      if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric <> floor((v #>> '{}')::numeric)
         or (v #>> '{}')::numeric not between 0 and 100 then
        raise exception 'VALIDATION_FAILED:certificate_threshold' using errcode = 'P0001';
      end if;
    else
      raise exception 'VALIDATION_FAILED:%', k using errcode = 'P0001';
    end if;

    select value into old from public.site_settings where key = k;
    if old is distinct from v then
      insert into public.site_settings (key, value, is_public, updated_by, updated_at)
      values (k, v, k not in ('certificates_enabled', 'certificate_threshold'), (select auth.uid()), now())
      on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
      changed := changed || k;
    end if;
  end loop;

  if cardinality(changed) > 0 then
    perform private.write_audit('settings.update', 'site_settings', 'site', null,
      jsonb_build_object('keys', to_jsonb(changed)));
  end if;
end;
$$;
revoke all on function public.save_site_settings(jsonb) from public, anon;
grant execute on function public.save_site_settings(jsonb) to authenticated;

-- ------------------------------------------------------------------------------------------ partners (PUB-001)
create table public.partners (
  id            uuid primary key default gen_random_uuid(),
  name_ar       text not null check (char_length(name_ar) between 1 and 100),
  name_en       text check (char_length(name_en) <= 100),
  logo_url      text check (logo_url is null or logo_url ~ '^https://[^[:space:]]{3,200}$'),
  website_url   text check (website_url is null or website_url ~ '^https://[^[:space:]]{3,200}$'),
  display_order integer not null default 0 check (display_order between 0 and 999),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
comment on table public.partners is 'Partner logos for the home page. The section is hidden while no active partner exists (Q-021).';
alter table public.partners enable row level security;
revoke all on table public.partners from anon, authenticated;
grant select on public.partners to anon, authenticated;
create policy partners_select_public on public.partners for select to anon, authenticated using (is_active);
create policy partners_select_admin on public.partners
  for select to authenticated using (private.has_permission_any_scope('settings.manage'));

create or replace function public.save_partner(p_id uuid, p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := p_id;
  n_ar text := btrim(coalesce(p ->> 'name_ar', ''));
  n_en text := nullif(btrim(coalesce(p ->> 'name_en', '')), '');
  logo text := nullif(btrim(coalesce(p ->> 'logo_url', '')), '');
  site text := nullif(btrim(coalesce(p ->> 'website_url', '')), '');
  ord integer := coalesce((p ->> 'display_order')::integer, 0);
  act boolean := coalesce((p ->> 'is_active')::boolean, true);
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('settings.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if char_length(n_ar) not between 1 and 100 then raise exception 'VALIDATION_FAILED:name_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(n_en, '')) > 100 then raise exception 'VALIDATION_FAILED:name_en' using errcode = 'P0001'; end if;
  if logo is not null and logo !~ '^https://[^[:space:]]{3,200}$' then raise exception 'VALIDATION_FAILED:logo_url' using errcode = 'P0001'; end if;
  if site is not null and site !~ '^https://[^[:space:]]{3,200}$' then raise exception 'VALIDATION_FAILED:website_url' using errcode = 'P0001'; end if;
  if ord not between 0 and 999 then raise exception 'VALIDATION_FAILED:display_order' using errcode = 'P0001'; end if;

  if v_id is null then
    insert into public.partners (name_ar, name_en, logo_url, website_url, display_order, is_active)
    values (n_ar, n_en, logo, site, ord, act) returning id into v_id;
    perform private.write_audit('partner.create', 'partner', v_id::text, null, jsonb_build_object('name', n_ar));
  else
    update public.partners set name_ar = n_ar, name_en = n_en, logo_url = logo, website_url = site,
           display_order = ord, is_active = act where id = v_id;
    if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    perform private.write_audit('partner.update', 'partner', v_id::text, null, jsonb_build_object('name', n_ar));
  end if;
  return v_id;
end;
$$;
revoke all on function public.save_partner(uuid, jsonb) from public, anon;
grant execute on function public.save_partner(uuid, jsonb) to authenticated;

create or replace function public.delete_partner(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare n text;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('settings.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  delete from public.partners where id = p_id returning name_ar into n;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  perform private.write_audit('partner.delete', 'partner', p_id::text, null, jsonb_build_object('name', n));
end;
$$;
revoke all on function public.delete_partner(uuid) from public, anon;
grant execute on function public.delete_partner(uuid) to authenticated;

-- ------------------------------------------------------------------------------------------ tags (ACC-006)
create or replace function public.save_tag(p_id uuid, p_label_ar text, p_label_en text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ar text := btrim(coalesce(p_label_ar, ''));
  en text := nullif(btrim(coalesce(p_label_en, '')), '');
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('reference_data.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if char_length(ar) not between 1 and 60 then raise exception 'VALIDATION_FAILED:label_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(en, '')) > 60 then raise exception 'VALIDATION_FAILED:label_en' using errcode = 'P0001'; end if;
  update public.tags set label_ar = ar, label_en = en where id = p_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  perform private.write_audit('tag.update', 'tag', p_id::text, null, jsonb_build_object('label', ar));
end;
$$;
revoke all on function public.save_tag(uuid, text, text) from public, anon;
grant execute on function public.save_tag(uuid, text, text) to authenticated;

-- A tag in use is kept (articles reference it); an unused one can be removed.
create or replace function public.delete_tag(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare l text;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('reference_data.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if exists (select 1 from public.article_tags where tag_id = p_id) then
    raise exception 'IN_USE' using errcode = 'P0001';
  end if;
  delete from public.tags where id = p_id returning label_ar into l;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  perform private.write_audit('tag.delete', 'tag', p_id::text, null, jsonb_build_object('label', l));
end;
$$;
revoke all on function public.delete_tag(uuid) from public, anon;
grant execute on function public.delete_tag(uuid) to authenticated;

-- Tag usage for the admin list (counts only).
create or replace function public.tag_usage()
returns table (id uuid, slug text, label_ar text, label_en text, uses integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('reference_data.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  return query
    select t.id, t.slug, t.label_ar, t.label_en,
           (select count(*)::integer from public.article_tags at where at.tag_id = t.id)
      from public.tags t order by t.label_ar;
end;
$$;
revoke all on function public.tag_usage() from public, anon;
grant execute on function public.tag_usage() to authenticated;
