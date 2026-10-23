-- Sprint 18 · ACC-009 — the activation link of an accepted applicant lives as long as the cycle's activation period
-- (7 days by default), not the one hour of an auth recovery link. The e-mail carries a random token (stored hashed);
-- opening it creates a fresh one-time sign-in link on the spot. A new link replaces the old one; an expired, unknown
-- or already used link shows one neutral page.

alter table public.membership_applications
  add column if not exists activation_token_hash text,
  add column if not exists activation_token_expires_at timestamptz;
create unique index if not exists membership_applications_activation_token_idx
  on public.membership_applications (activation_token_hash) where activation_token_hash is not null;

-- Issues (or replaces) the token of an application and returns it once. Valid for the cycle's activation days.
create or replace function public.issue_activation_token(p_application uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.membership_applications;
  c public.membership_cycles;
  v_token text := private.new_token();
begin
  select * into a from public.membership_applications where id = p_application for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  update public.membership_applications
     set activation_token_hash = private.token_hash(v_token),
         activation_token_expires_at = now() + make_interval(days => coalesce(c.activation_deadline_days, 7))
   where id = p_application;
  return v_token;
end;
$$;
revoke all on function public.issue_activation_token(uuid) from public, anon, authenticated;
grant execute on function public.issue_activation_token(uuid) to service_role;

-- What the activation page needs: who the token belongs to, or why it does not work.
create or replace function public.resolve_activation_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.membership_applications;
begin
  if coalesce(p_token, '') = '' then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  select * into a from public.membership_applications where activation_token_hash = private.token_hash(p_token);
  if not found then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  if a.status <> 'accepted' then return jsonb_build_object('ok', false, 'code', 'NOT_ACCEPTED'); end if;
  if exists (select 1 from public.members m where m.user_id = a.user_id and m.activated_at is not null) then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_ACTIVE');
  end if;
  if a.activation_token_expires_at is null or a.activation_token_expires_at < now() then
    return jsonb_build_object('ok', false, 'code', 'TOKEN_EXPIRED');
  end if;
  return jsonb_build_object('ok', true, 'id', a.id, 'email', a.email, 'locale', a.locale, 'user_id', a.user_id);
end;
$$;
revoke all on function public.resolve_activation_token(text) from public, anon, authenticated;
grant execute on function public.resolve_activation_token(text) to service_role;
