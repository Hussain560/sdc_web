-- Sprint 10 · CMT-003 — committee management (docs/11-modules/committees/README.md §5, §8, §10):
-- create / edit / deactivate / reactivate / delete with the documented guards, and the cards of the dashboard list.
-- Positions themselves still go through assign_role / end_role_assignment / handover_head (Sprint 04).

create or replace function public.save_committee(p_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  is_new boolean := p_id is null;
  c public.committees;
  slug_in text := lower(nullif(btrim(coalesce(p ->> 'slug', '')), ''));
  v_order integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('committees.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;

  if is_new then
    -- CM-1: the slug is chosen once, unique, and stable afterwards (a rename keeps it).
    if slug_in is null or slug_in !~ '^[a-z0-9-]{2,60}$' then raise exception 'VALIDATION_FAILED:slug' using errcode = 'P0001'; end if;
    if exists (select 1 from public.committees where slug = slug_in) then raise exception 'SLUG_TAKEN' using errcode = 'P0001'; end if;
    c.id := gen_random_uuid();
    c.slug := slug_in;
    c.status := 'active';
    c.created_by := caller;
  else
    select * into c from public.committees where id = p_id for update;
    if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    if slug_in is not null and slug_in <> c.slug then raise exception 'SLUG_LOCKED' using errcode = 'P0001'; end if;
  end if;

  if p ? 'name_ar' then c.name_ar := btrim(coalesce(p ->> 'name_ar', '')); end if;
  if p ? 'name_en' then c.name_en := nullif(btrim(p ->> 'name_en'), ''); end if;
  if p ? 'description_ar' then c.description_ar := nullif(btrim(p ->> 'description_ar'), ''); end if;
  if p ? 'description_en' then c.description_en := nullif(btrim(p ->> 'description_en'), ''); end if;
  if p ? 'contact_email' then c.contact_email := nullif(btrim(p ->> 'contact_email'), ''); end if;
  if p ? 'display_order' then
    begin
      v_order := (p ->> 'display_order')::integer;
    exception when others then
      raise exception 'VALIDATION_FAILED:display_order' using errcode = 'P0001';
    end;
    if v_order not between 0 and 999 then raise exception 'VALIDATION_FAILED:display_order' using errcode = 'P0001'; end if;
    c.display_order := v_order;
  end if;

  if char_length(coalesce(c.name_ar, '')) not between 1 and 100 then raise exception 'VALIDATION_FAILED:name_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(c.name_en, '')) > 100 then raise exception 'VALIDATION_FAILED:name_en' using errcode = 'P0001'; end if;
  if char_length(coalesce(c.description_ar, '')) > 2000 then raise exception 'VALIDATION_FAILED:description_ar' using errcode = 'P0001'; end if;
  if char_length(coalesce(c.description_en, '')) > 2000 then raise exception 'VALIDATION_FAILED:description_en' using errcode = 'P0001'; end if;
  if c.contact_email is not null and c.contact_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'VALIDATION_FAILED:contact_email' using errcode = 'P0001';
  end if;

  if is_new then
    c.display_order := coalesce(c.display_order, 0);
    insert into public.committees (id, slug, name_ar, name_en, description_ar, description_en, status, display_order, contact_email, created_by)
    values (c.id, c.slug, c.name_ar, c.name_en, c.description_ar, c.description_en, c.status, c.display_order, c.contact_email, c.created_by);
  else
    update public.committees set name_ar = c.name_ar, name_en = c.name_en, description_ar = c.description_ar,
      description_en = c.description_en, display_order = c.display_order, contact_email = c.contact_email
    where id = c.id;
  end if;
  perform private.write_audit(case when is_new then 'committee.created' else 'committee.updated' end, 'committee', c.id::text, c.id,
    jsonb_build_object('slug', c.slug));
  return jsonb_build_object('id', c.id, 'slug', c.slug);
end;
$$;

-- Deactivate: open positions end (the caller sees the count first), the committee keeps its events and threads.
create or replace function public.set_committee_status(p_id uuid, p_active boolean, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.committees;
  reason text := nullif(btrim(coalesce(p_reason, '')), '');
  ended integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('committees.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into c from public.committees where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;

  if p_active then
    if c.status = 'active' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
    update public.committees set status = 'active' where id = c.id;
    perform private.write_audit('committee.reactivated', 'committee', c.id::text, c.id, jsonb_build_object('slug', c.slug));
  else
    if c.status = 'inactive' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
    if reason is null then raise exception 'REASON_REQUIRED' using errcode = 'P0001'; end if;
    update public.committees set status = 'inactive' where id = c.id;
    update public.role_assignments
       set ends_at = greatest(now(), starts_at), end_reason = left('Committee deactivated: ' || reason, 300)
     where committee_id = c.id and (ends_at is null or ends_at > now());
    get diagnostics ended = row_count;
    perform private.write_audit('committee.deactivated', 'committee', c.id::text, c.id,
      jsonb_build_object('slug', c.slug, 'reason', reason, 'positions_ended', ended));
  end if;
  return jsonb_build_object('status', case when p_active then 'active' else 'inactive' end, 'positions_ended', ended);
end;
$$;

-- CM-2: a committee that owns anything is deactivated, never deleted.
create or replace function public.delete_committee(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.committees;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('committees.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into c from public.committees where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if exists (select 1 from public.events where committee_id = c.id)
     or exists (select 1 from public.articles where committee_id = c.id)
     or exists (select 1 from public.role_assignments where committee_id = c.id) then
    raise exception 'NOT_DELETABLE' using errcode = 'P0001';
  end if;
  delete from public.committees where id = c.id;
  perform private.write_audit('committee.deleted', 'committee', c.id::text, null, jsonb_build_object('slug', c.slug));
end;
$$;

-- The cards of /dashboard/committees: head, deputy and counts. Leadership and viewers see every committee, a head
-- only the committees they manage.
create or replace function public.committee_cards()
returns table (
  id uuid, slug text, name_ar text, name_en text, status text, display_order smallint,
  head_name_ar text, head_name_en text, deputy_name_ar text, deputy_name_en text,
  members_count integer, events_count integer, articles_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.slug, c.name_ar, c.name_en, c.status, c.display_order,
    (select p.full_name_ar from public.role_assignments a join public.profiles p on p.id = a.user_id
      where a.committee_id = c.id and a.role_key = 'committee_head' and a.starts_at <= now() and (a.ends_at is null or a.ends_at > now()) limit 1),
    (select p.full_name_en from public.role_assignments a join public.profiles p on p.id = a.user_id
      where a.committee_id = c.id and a.role_key = 'committee_head' and a.starts_at <= now() and (a.ends_at is null or a.ends_at > now()) limit 1),
    (select p.full_name_ar from public.role_assignments a join public.profiles p on p.id = a.user_id
      where a.committee_id = c.id and a.role_key = 'committee_deputy' and a.starts_at <= now() and (a.ends_at is null or a.ends_at > now()) limit 1),
    (select p.full_name_en from public.role_assignments a join public.profiles p on p.id = a.user_id
      where a.committee_id = c.id and a.role_key = 'committee_deputy' and a.starts_at <= now() and (a.ends_at is null or a.ends_at > now()) limit 1),
    (select count(*)::integer from public.role_assignments a
      where a.committee_id = c.id and a.starts_at <= now() and (a.ends_at is null or a.ends_at > now())),
    (select count(*)::integer from public.events e
      where e.committee_id = c.id and e.status <> 'draft'
        and extract(year from coalesce(e.start_date, e.created_at::date)) = extract(year from private.today_riyadh())),
    (select count(*)::integer from public.articles a where a.committee_id = c.id and a.status = 'published')
  from public.committees c
  where (select auth.uid()) is not null
    and (private.has_permission('committees.manage') or private.has_permission('roles.view')
         or c.id in (select private.committees_with_permission('committee_members.manage')))
  order by (c.status = 'active') desc, c.display_order, c.name_ar
$$;

revoke all on function public.save_committee(uuid, jsonb), public.set_committee_status(uuid, boolean, text),
  public.delete_committee(uuid), public.committee_cards() from public, anon;
grant execute on function public.save_committee(uuid, jsonb), public.set_committee_status(uuid, boolean, text),
  public.delete_committee(uuid), public.committee_cards() to authenticated;
