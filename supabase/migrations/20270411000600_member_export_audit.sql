-- Sprint 18 · MEM-018 — the members list can be exported (leadership, audited like every export).
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
  elsif p_kind = 'members' then
    if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
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
