-- Sprint 08 — exports are sensitive: every CSV export is recorded in the audit log (SEC-007; closes the Sprint 06 gap).
-- The caller must hold the export permission of the kind they claim; only a count is stored, never the data.
create or replace function public.record_export(p_kind text, p_count integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
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
  else
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  perform private.write_audit('export.' || p_kind, 'export', p_kind, null,
    jsonb_build_object('rows', greatest(coalesce(p_count, 0), 0)));
end;
$$;
revoke all on function public.record_export(text, integer) from public, anon;
grant execute on function public.record_export(text, integer) to authenticated;
