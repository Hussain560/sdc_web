-- ACC-007 (Sprint 17): when a new head takes over, the previous head can stay on as deputy instead of leaving
-- the committee ("make X the deputy instead of ending the role"). Same guards as before; the new argument is optional,
-- so every existing caller keeps working.

drop function if exists public.handover_head(uuid, uuid, timestamptz);

create or replace function public.handover_head(
  p_committee uuid,
  p_new_head uuid,
  p_at timestamptz default now(),
  p_keep_as_deputy boolean default false
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current uuid;
  v_old_user uuid;
  v_new uuid;
begin
  if not (private.is_system_admin() or private.has_permission('roles.assign')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select id, user_id into v_current, v_old_user
  from public.role_assignments
  where role_key = 'committee_head' and committee_id = p_committee
    and starts_at <= p_at and (ends_at is null or ends_at > p_at)
  limit 1;

  if v_current is not null then
    perform public.end_role_assignment(v_current, 'handover', p_at);
  end if;

  v_new := public.assign_role(p_new_head, 'committee_head', p_committee, p_at, null);

  -- The previous head stays on as deputy (only when they are somebody else; every guard of assign_role applies).
  if p_keep_as_deputy and v_old_user is not null and v_old_user <> p_new_head then
    perform public.assign_role(v_old_user, 'committee_deputy', p_committee, p_at, null);
  end if;
  return v_new;
end;
$$;

revoke all on function public.handover_head(uuid, uuid, timestamptz, boolean) from public, anon;
grant execute on function public.handover_head(uuid, uuid, timestamptz, boolean) to authenticated;
