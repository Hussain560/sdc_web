-- Sprint 09 · NOT-003 — the scheduled e-mail retry (backoff 5 min · 30 min · 2 h, at most 4 attempts, no retry of
-- non-retryable codes) and the admin e-mail log read model. docs/11-modules/notifications/README.md §8 NO-8, §10.

-- Rows the retry job should try now. Service role only (the job runs on the server with the secret key).
create or replace function public.due_email_retries(p_limit integer default 50)
returns table (id uuid, template_key text, entity_type text, entity_id text, attempt smallint)
language sql
stable
security definer
set search_path = ''
as $$
  select l.id, l.template_key, l.entity_type, l.entity_id, l.attempt
  from public.email_logs l
  where l.status = 'failed'
    and l.attempt < 4
    and coalesce(l.error_code, '') not in ('INVALID_RECIPIENT', 'NO_RECIPIENT')
    and l.created_at < now() - (case l.attempt
          when 1 then interval '5 minutes'
          when 2 then interval '30 minutes'
          else interval '2 hours' end)
    and not exists (
      select 1 from public.email_logs n
      where n.idempotency_key = l.idempotency_key
        and (n.status in ('sent', 'sending') or n.attempt > l.attempt)
    )
  order by l.created_at
  limit greatest(1, least(coalesce(p_limit, 50), 200))
$$;
revoke all on function public.due_email_retries(integer) from public, anon, authenticated;
grant execute on function public.due_email_retries(integer) to service_role;

-- The admin e-mail log: one row per attempt with a derived state. Runs under the caller's RLS (email_logs.view
-- sees everything; scoped reviewers only the mails of their registrations).
create view public.admin_email_logs with (security_invoker = true) as
select
  l.id, l.created_at, l.template_key, l.locale, l.recipient_email, l.entity_type, l.entity_id,
  l.attempt, l.status, l.provider, l.error_code, l.error_message,
  case
    when l.status = 'failed' and exists (
      select 1 from public.email_logs n where n.idempotency_key = l.idempotency_key and n.status = 'sent'
    ) then 'recovered'
    when l.status = 'failed' and (l.attempt >= 4 or coalesce(l.error_code, '') in ('INVALID_RECIPIENT', 'NO_RECIPIENT'))
      then 'abandoned'
    when l.status = 'failed' and exists (
      select 1 from public.email_logs n where n.idempotency_key = l.idempotency_key and n.attempt > l.attempt
    ) then 'superseded'
    when l.status = 'failed' then 'retrying'
    else l.status
  end as state
from public.email_logs l;
revoke all on public.admin_email_logs from anon;
grant select on public.admin_email_logs to authenticated;
